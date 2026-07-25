import assert from "node:assert/strict";
import test from "node:test";
import { redactSecrets } from "../lib/security/redaction";
import { redactLeadFreeText, storeLead, type LeadInput } from "../lib/acquisition/leads";
import { formatLeadEmailHtml, formatLeadEmailText } from "../lib/acquisition/intake";
import type { ConciergeLeadData } from "../lib/concierge/types";

// SITE-03: visitor free-text is masked for obvious secrets before it is stored
// in crm_leads or placed in the lead email. These tests prove cards / SSNs /
// keys are masked and that ordinary business prose is left untouched.

test("redactSecrets masks obvious card, SSN, and key shapes", () => {
  assert.match(redactSecrets("card 4111 1111 1111 1111 please"), /\[redacted-card\]/);
  assert.match(redactSecrets("amex 3782 822463 10005"), /\[redacted-card\]/); // 15-digit Luhn-valid
  assert.match(redactSecrets("my ssn is 123-45-6789"), /\[redacted-ssn\]/);
  assert.match(redactSecrets("ssn 123 45 6789 thanks"), /\[redacted-ssn\]/);
  assert.match(redactSecrets("key sk-ant-api03-Abcdefghijklmnop0123456789 leaked"), /\[redacted-api-key\]/);
  assert.match(redactSecrets("stripe sk_live_51AbCdEfGhIjKlMnOpQrStk"), /\[redacted-api-key\]/);
  assert.match(redactSecrets("token ghp_1234567890abcdef1234567890abcdefABCD"), /\[redacted-api-key\]/);
  assert.match(redactSecrets("aws AKIAIOSFODNN7EXAMPLE here"), /\[redacted-aws-key\]/);
  assert.match(redactSecrets("Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"), /Bearer \[redacted-token\]/);
  assert.match(
    redactSecrets("-----BEGIN RSA PRIVATE KEY-----\nMIIEabc123\n-----END RSA PRIVATE KEY-----"),
    /\[redacted-private-key\]/,
  );
  // The raw secret must not survive anywhere in the output.
  const scrubbed = redactSecrets("pan 4111 1111 1111 1111 ssn 123-45-6789 key sk-ant-api03-Abcdefghijklmnop0123456789");
  assert.doesNotMatch(scrubbed, /4111 1111 1111 1111/);
  assert.doesNotMatch(scrubbed, /123-45-6789/);
  assert.doesNotMatch(scrubbed, /sk-ant-api03/);
});

test("redactSecrets leaves ordinary business prose untouched", () => {
  const prose =
    "We lose about 30 qualified leads a month. Revenue dropped 15% in Q2 2026. " +
    "Call me at 555-123-4567 or 312.555.0199. Order #4567 shipped late and PO 998877 stalled.";
  assert.equal(redactSecrets(prose), prose);
  // A 16-digit run that FAILS Luhn is not a card and must survive.
  const notACard = "reference 4111 1111 1111 1112 in the ticket";
  assert.equal(redactSecrets(notACard), notACard);
  // Empty / non-string inputs pass through unchanged.
  assert.equal(redactSecrets(""), "");
});

function conciergeEnvelope(secret: string): ConciergeLeadData {
  return {
    schemaVersion: 1,
    sessionId: "00000000-0000-4000-8000-000000000099",
    recommendedService: "website_rebuild",
    recommendationConfidence: 0.8,
    recommendationReasons: [`They mentioned ${secret}`],
    recommendationSource: "deterministic",
    requiresHumanReview: false,
    qualificationSummary: `Summary referencing ${secret}`,
    answers: {
      problemKind: "website",
      primaryProblem: `Primary problem with ${secret}`,
      branchContext: `Branch context ${secret}`,
      impact: `Impact ${secret}`,
      currentTools: `Tools ${secret}`,
      desiredOutcome: `Outcome ${secret}`,
      businessName: "Redaction Co",
      industry: "Services",
      websiteUrl: "https://example.com/",
      budgetRange: "$1,500-$3,500",
      timeline: "1-2 months",
      name: "Casey Client",
      email: "casey@example.com",
      companyWebsite: "",
    },
    visitorPrimaryProblem: `Visitor problem with ${secret}`,
    currentTools: [`Tool ${secret}`],
    desiredOutcome: `Desired ${secret}`,
    budgetRange: "$1,500-$3,500",
    timeline: "1-2 months",
    websiteUrl: "https://example.com/",
  };
}

test("redactLeadFreeText masks free-text everywhere but preserves structured routing fields", () => {
  const card = "4111 1111 1111 1111";
  const input: LeadInput = {
    name: "Casey Client",
    businessName: "Redaction Co",
    email: "casey@example.com",
    websiteOrSocial: "https://example.com",
    industry: "Services",
    serviceInterest: "Small-Business Website",
    timeline: "1-2 months",
    biggestProblem: `Our checkout card ${card} keeps failing`,
    notes: `SSN 123-45-6789 in a note`,
    source: "ai_project_concierge",
    concierge: conciergeEnvelope(card),
  };
  const safe = redactLeadFreeText(input);
  // Free-text, top-level and nested, is masked.
  assert.match(safe.biggestProblem, /\[redacted-card\]/);
  assert.match(safe.notes || "", /\[redacted-ssn\]/);
  assert.match(safe.concierge!.visitorPrimaryProblem, /\[redacted-card\]/);
  assert.match(safe.concierge!.qualificationSummary, /\[redacted-card\]/);
  assert.match(safe.concierge!.recommendationReasons[0], /\[redacted-card\]/);
  assert.match(safe.concierge!.currentTools[0], /\[redacted-card\]/);
  assert.match(safe.concierge!.answers.primaryProblem, /\[redacted-card\]/);
  assert.match(safe.concierge!.answers.impact, /\[redacted-card\]/);
  // Structured / routing fields are preserved verbatim.
  assert.equal(safe.email, "casey@example.com");
  assert.equal(safe.concierge!.sessionId, input.concierge!.sessionId);
  assert.equal(safe.concierge!.recommendedService, "website_rebuild");
  assert.equal(safe.concierge!.recommendationConfidence, 0.8);
  // The original input object is not mutated.
  assert.match(input.biggestProblem, /4111 1111 1111 1111/);
});

test("storeLead persists redacted free-text to crm_leads", async () => {
  const input: LeadInput = {
    name: "Test Person",
    businessName: "Test Business",
    email: "TEST@example.com",
    websiteOrSocial: "https://example.com",
    industry: "Services",
    serviceInterest: "Website audit",
    timeline: "Soon",
    biggestProblem: "Card 4111 1111 1111 1111 declines and my key sk-ant-api03-Abcdefghijklmnop0123456789 is exposed",
    notes: "SSN 123-45-6789",
    source: "website intake",
  };
  const calls: unknown[][] = [];
  const db = { query: async (_query: string, values: unknown[]) => {
    calls.push(values);
    return { rows: [{
      id: "00000000-0000-4000-8000-000000000001", created_at: new Date(), updated_at: new Date(), source: input.source,
      name: input.name, business_name: input.businessName, email: input.email.toLowerCase(), phone: "", website_or_social: input.websiteOrSocial,
      industry: input.industry, service_interest: input.serviceInterest, budget_range: "", timeline: input.timeline,
      biggest_problem: String(values[12]), notes: String(values[13]), status: "new", last_contacted_at: null, follow_up_at: null,
      audit_completed: false, proposal_sent_at: null, outcome: "open", internal_notes: "", payment_status: "not_started", created: true,
    }] };
  } };
  await storeLead(input, "request-1", db as never);
  const biggestProblem = String(calls[0][12]);
  const notes = String(calls[0][13]);
  assert.match(biggestProblem, /\[redacted-card\]/);
  assert.match(biggestProblem, /\[redacted-api-key\]/);
  assert.doesNotMatch(biggestProblem, /4111 1111 1111 1111/);
  assert.doesNotMatch(biggestProblem, /sk-ant-api03/);
  assert.match(notes, /\[redacted-ssn\]/);
});

test("the lead email carries redacted free-text and still escapes HTML", () => {
  const input: LeadInput = {
    name: "Test Person",
    businessName: "Test Business",
    email: "test@example.com",
    websiteOrSocial: "https://example.com",
    industry: "Services",
    serviceInterest: "Website audit",
    timeline: "Soon",
    biggestProblem: "Please help. Card 4111 1111 1111 1111 and SSN 123-45-6789. We lose 30 leads a month.",
    notes: "<script>alert('x')</script> token ghp_1234567890abcdef1234567890abcdefABCD",
    source: "website intake",
  };
  const text = formatLeadEmailText(input);
  const html = formatLeadEmailHtml(input);
  for (const body of [text, html]) {
    assert.match(body, /\[redacted-card\]/);
    assert.match(body, /\[redacted-ssn\]/);
    assert.match(body, /\[redacted-api-key\]/);
    assert.doesNotMatch(body, /4111 1111 1111 1111/);
    assert.doesNotMatch(body, /123-45-6789/);
    // Ordinary business context is preserved.
    assert.match(body, /We lose 30 leads a month/);
  }
  // Redaction composes with the existing HTML escaping.
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});
