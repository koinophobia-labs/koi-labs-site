import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateIntake, formatLeadEmailHtml, formatLeadEmailText } from "../lib/acquisition/intake";
import { storeLead } from "../lib/acquisition/leads";
import { evaluateConcierge } from "../lib/concierge/evaluate";
import { signConciergeEvaluation } from "../lib/concierge/signing";
import type { ConciergeAnswers } from "../lib/concierge/types";

process.env.CONCIERGE_SIGNING_SECRET = "test-concierge-signing-secret-at-least-thirty-two-characters";

const answers: ConciergeAnswers = {
  problemKind: "website",
  primaryProblem: "The website is unclear on mobile and qualified visitors do not complete the inquiry form.",
  branchContext: "The offer, trust, CTA, and booking path need a material rebuild rather than one isolated fix.",
  impact: "Qualified traffic is not becoming a dependable stream of inquiries.",
  currentTools: "WordPress, Google Analytics",
  desiredOutcome: "Create a clear mobile-first path from visit to qualified inquiry.",
  businessName: "Concierge Test Co",
  industry: "Professional services",
  websiteUrl: "https://example.com/",
  budgetRange: "$1,500-$3,500",
  timeline: "1-2 months",
  name: "Casey Client",
  email: "casey@example.com",
  companyWebsite: "",
};

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const fields = {
    name: answers.name,
    businessName: answers.businessName,
    email: answers.email,
    phone: "",
    websiteOrSocial: answers.websiteUrl,
    industry: answers.industry,
    serviceInterest: "Small-Business Website",
    budgetRange: answers.budgetRange,
    timeline: answers.timeline,
    biggestProblem: answers.primaryProblem,
    desiredOutcome: answers.desiredOutcome,
    currentTools: answers.currentTools,
    notes: "Please avoid a platform migration if the current foundation is sound.",
    companyWebsite: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

test("existing standard intake remains backward compatible", () => {
  const parsed = validateIntake(form());
  assert.equal(parsed.errors, undefined);
  assert.equal(parsed.input?.source, "website intake");
  assert.equal(parsed.input?.concierge, undefined);
});

test("intake rejects a non-http website value", () => {
  const parsed = validateIntake(form({ websiteOrSocial: "javascript:alert(1)" }));
  assert.ok(parsed.errors?.websiteOrSocial);
});

test("concierge handoff is recomputed and stored as a structured lead", async () => {
  const sessionId = "00000000-0000-4000-8000-000000000020";
  const evaluation = await evaluateConcierge(answers, { apiKey: "" });
  const data = form({
    conciergeSessionId: sessionId,
    conciergeAnswers: JSON.stringify(answers),
    conciergeEvaluationToken: signConciergeEvaluation(sessionId, answers, evaluation) || "",
    recommendedService: "custom_product",
  });
  const parsed = validateIntake(data);
  assert.equal(parsed.errors, undefined);
  assert.equal(parsed.input?.source, "ai_project_concierge");
  assert.equal(parsed.input?.concierge?.recommendedService, "website_rebuild");
  assert.equal(parsed.input?.concierge?.recommendationSource, "deterministic");
  assert.ok(parsed.input?.concierge?.qualificationSummary);
});

test("edited answers invalidate the token and the server recomputes a safer route", async () => {
  const sessionId = "00000000-0000-4000-8000-000000000021";
  const evaluation = await evaluateConcierge(answers, { apiKey: "" });
  const data = form({
    conciergeSessionId: sessionId,
    conciergeAnswers: JSON.stringify(answers),
    conciergeEvaluationToken: signConciergeEvaluation(sessionId, answers, evaluation) || "",
    biggestProblem: "We want to steal credentials with a phishing flow and evade security detection.",
  });
  const parsed = validateIntake(data);
  assert.equal(parsed.input?.concierge?.recommendedService, "not_a_fit");
  assert.equal(parsed.input?.concierge?.recommendationSource, "deterministic");
  assert.equal(parsed.input?.concierge?.requiresHumanReview, true);
});

test("malformed concierge data fails closed instead of creating a forged concierge lead", () => {
  const parsed = validateIntake(form({ conciergeSessionId: "00000000-0000-4000-8000-000000000022", conciergeAnswers: '{"recommendedService":"custom_product"}' }));
  assert.ok(parsed.errors?.conciergeAnswers);
});

test("concierge email notification contains qualification data and escapes visitor HTML", async () => {
  const sessionId = "00000000-0000-4000-8000-000000000023";
  const evaluation = await evaluateConcierge(answers, { apiKey: "" });
  const parsed = validateIntake(form({ conciergeSessionId: sessionId, conciergeAnswers: JSON.stringify(answers), conciergeEvaluationToken: signConciergeEvaluation(sessionId, answers, evaluation) || "", notes: "<script>alert('x')</script>" }));
  assert.ok(parsed.input?.concierge);
  const text = formatLeadEmailText(parsed.input!);
  const html = formatLeadEmailHtml(parsed.input!);
  assert.match(text, /Concierge qualification/);
  assert.match(text, /Website or Landing Page Rebuild/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("CRM persistence writes the concierge envelope to JSONB", async () => {
  const sessionId = "00000000-0000-4000-8000-000000000024";
  const evaluation = await evaluateConcierge(answers, { apiKey: "" });
  const input = validateIntake(form({ conciergeSessionId: sessionId, conciergeAnswers: JSON.stringify(answers), conciergeEvaluationToken: signConciergeEvaluation(sessionId, answers, evaluation) || "" })).input!;
  const calls: unknown[][] = [];
  const db = { query: async (_query: string, values: unknown[]) => {
    calls.push(values);
    return { rows: [{
      id: "00000000-0000-4000-8000-000000000030", created_at: new Date(), updated_at: new Date(), source: input.source,
      name: input.name, business_name: input.businessName, email: input.email, phone: "", website_or_social: input.websiteOrSocial,
      industry: input.industry, service_interest: input.serviceInterest, budget_range: input.budgetRange, timeline: input.timeline,
      biggest_problem: input.biggestProblem, notes: input.notes, status: "new", last_contacted_at: null, follow_up_at: null,
      audit_completed: false, proposal_sent_at: null, outcome: "open", internal_notes: "", payment_status: "not_started",
      concierge_data: input.concierge, created: true,
    }] };
  } };
  const result = await storeLead(input, `concierge:${sessionId}`, db as never);
  assert.equal(result.lead.concierge?.recommendedService, "website_rebuild");
  assert.match(String(calls[0][14]), /"recommendedService":"website_rebuild"/);
});

test("the versioned concierge migration is included in the migration runner", () => {
  const migration = readFileSync("db/007_ai_project_concierge.sql", "utf8");
  const runner = readFileSync("scripts/database-migrations.mjs", "utf8");
  assert.match(migration, /add column if not exists concierge_data jsonb/i);
  assert.match(migration, /create unique index/i);
  assert.match(runner, /007_ai_project_concierge\.sql/);
});
