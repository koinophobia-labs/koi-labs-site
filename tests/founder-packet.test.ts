import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { serviceOffers } from "../lib/commercial";
import {
  buildFounderSalesPacket,
  packetMarksProspect,
} from "../lib/acquisition/founder-packet";
import { formatLeadEmailHtml, sendLeadEmail } from "../lib/acquisition/intake";
import { storeLead, type LeadInput } from "../lib/acquisition/leads";
import { scoreConcierge } from "../lib/concierge/routing";
import type { ConciergeAnswers, ConciergeLeadData } from "../lib/concierge/types";

const websiteLead: LeadInput = {
  name: "Maya Chen",
  businessName: "Northstar Fitness",
  email: "maya@northstarfitness.biz",
  websiteOrSocial: "https://northstarfitness.biz",
  industry: "Local fitness studio",
  serviceInterest: "Small-Business Website",
  budgetRange: "$1,500-$3,500",
  timeline: "1-2 months",
  biggestProblem: "The five page website is unclear on mobile, hides the class schedule, and sends qualified visitors to a contact form that few finish.",
  desiredOutcome: "Make classes easy to understand and turn qualified mobile visits into complete trial-week inquiries.",
  currentTools: "Squarespace, Google Analytics, Calendly",
  notes: "The owner can provide current brand files and page copy.",
  source: "website intake",
};

const automationLead: LeadInput = {
  name: "Jordan Lee",
  businessName: "Lakeview Home Services",
  email: "jordan@lakeviewhomeservices.co",
  websiteOrSocial: "https://lakeviewhomeservices.co",
  industry: "Home services",
  serviceInterest: "AI Workflow or Front Office",
  budgetRange: "$1,500-$3,500",
  timeline: "This month",
  biggestProblem: "Staff manually copy each of roughly 12 inquiries a week from Gmail into HubSpot and Calendly, so follow-up is delayed. The office manager reviews exceptions.",
  desiredOutcome: "Route every complete inquiry into the CRM and calendar while keeping exceptions with the office manager.",
  currentTools: "Gmail, HubSpot, Calendly",
  source: "website intake",
};

const vagueLead: LeadInput = {
  name: "Riley Morgan",
  businessName: "Morgan & Co",
  email: "riley@morganandco.biz",
  websiteOrSocial: "https://morganandco.biz",
  industry: "Professional services",
  serviceInterest: "Not sure yet",
  budgetRange: "",
  timeline: "This month",
  biggestProblem: "We need help making the business work better online.",
  desiredOutcome: "",
  currentTools: "",
  source: "website intake",
};

const lowBudgetLead: LeadInput = {
  name: "Avery Stone",
  businessName: "Stone Street Studio",
  email: "avery@stonestreetstudio.co",
  websiteOrSocial: "https://stonestreetstudio.co",
  industry: "Creative studio",
  serviceInterest: "Small-Business Website",
  budgetRange: "Under $500",
  timeline: "This week",
  biggestProblem: "We need the whole site rebuilt this week because the current site is outdated and the service pages do not explain what we sell.",
  desiredOutcome: "Launch a complete new business website with clear service pages and an inquiry form.",
  currentTools: "Wix",
  source: "website intake",
};

const smokeLead: LeadInput = {
  name: "Koinophobia Smoke Test",
  businessName: "Founder Packet Smoke Test",
  email: "smoke@example.com",
  websiteOrSocial: "https://example.com",
  industry: "QA",
  serviceInterest: "Small-Business Website",
  budgetRange: "$1,500-$3,500",
  timeline: "This month",
  biggestProblem: "Controlled production-safe smoke test for the intake pipeline.",
  desiredOutcome: "Confirm the internal founder packet without contacting a prospect.",
  currentTools: "Test fixture",
  source: "website intake",
};

const auditLead: LeadInput = {
  name: "Drew Patel",
  businessName: "Drew's Barber Shop",
  email: "drew@drewsbarbershop.biz",
  websiteOrSocial: "https://drewsbarbershop.biz",
  industry: "Barber shop",
  serviceInterest: "Website audit",
  budgetRange: "Under $500",
  timeline: "This month",
  biggestProblem: "Visitors reach the website, but it is unclear whether the service pages, mobile booking path, or contact visibility is causing lost appointments.",
  desiredOutcome: "Identify the highest-cost website leaks and know what to fix first.",
  currentTools: "Square, Instagram, Google Business Profile",
  source: "website intake",
};

const requiredCases = [
  ["strong website rebuild", websiteLead, "Small-Business Website", "Ready for offer"],
  ["small automation", automationLead, "AI Workflow or Front Office", "Ready for offer"],
  ["vague inquiry", vagueLead, "No published offer selected yet", "Needs clarification"],
  ["low-budget poor fit", lowBudgetLead, "Small-Business Website", "Nurture"],
  ["smoke test", smokeLead, "Small-Business Website", "Spam or test"],
] as const;

test("the five required lead scenarios produce complete, bounded founder packets", () => {
  for (const [name, input, expectedService, expectedDisposition] of requiredCases) {
    const packet = buildFounderSalesPacket(input);
    assert.equal(packet.schemaVersion, 1, name);
    assert.equal(packet.recommendedOffer.service, expectedService, name);
    assert.equal(packet.disposition.label, expectedDisposition, name);
    assert.ok(packet.problemSummary.struggle.includes(input.biggestProblem), `${name}: submitted problem must remain verbatim`);
    assert.ok(packet.problemSummary.desiredOutcome.includes(input.desiredOutcome || "No desired outcome"), `${name}: outcome must be submitted or explicitly absent`);
    assert.ok(packet.missingInformation.length <= 3, `${name}: no more than three questions`);
    assert.ok(packet.founderReplyDraft.length > 0, `${name}: reply draft exists`);
    assert.doesNotMatch(packet.founderReplyDraft, /\bguarantee[ds]?\b|\bpromise[ds]?\b/i, `${name}: no guarantee`);
  }
  assert.deepEqual(buildFounderSalesPacket(automationLead).missingInformation, [], "answered automation details must not be re-asked");
  assert.ok(buildFounderSalesPacket(vagueLead).missingInformation.some((question) => /budget ceiling/i.test(question)), "vague lead must clarify price boundary");
});

test("every selected price, timeline, and scope item comes from the existing offer catalog", () => {
  for (const [, input] of [...requiredCases, ["audit intake", auditLead, "", ""] as const]) {
    const packet = buildFounderSalesPacket(input);
    if (!packet.recommendedOffer.offerSlug) {
      assert.equal(packet.recommendedOffer.price, "No price recommended");
      continue;
    }
    const offer = serviceOffers.find((item) => item.slug === packet.recommendedOffer.offerSlug);
    assert.ok(offer, packet.recommendedOffer.offerSlug);
    assert.equal(packet.recommendedOffer.service, offer.title);
    assert.equal(packet.recommendedOffer.price, offer.price);
    assert.equal(packet.recommendedOffer.estimatedTimeline, offer.timeline);
    for (const scopeItem of packet.recommendedOffer.suggestedScope) {
      assert.ok(offer.includes.includes(scopeItem), `${scopeItem} is not in ${offer.title}`);
    }
  }
});

test("the audit intake maps to the existing $250 audit and its correct public link", () => {
  const packet = buildFounderSalesPacket(auditLead);
  assert.equal(packet.recommendedOffer.service, "Revenue Leak Audit");
  assert.equal(packet.recommendedOffer.price, "$250");
  assert.equal(packet.recommendedOffer.offerPath, "/audit");
  assert.match(packet.founderReplyDraft, /https:\/\/koinophobialabs\.com\/audit/);
});

test("concierge routing remains authoritative when the packet is attached", () => {
  const answers: ConciergeAnswers = {
    problemKind: "website",
    primaryProblem: websiteLead.biggestProblem,
    branchContext: "The offer, trust, core pages, and booking path need a material rebuild.",
    impact: "Qualified mobile traffic is not becoming trial-week inquiries.",
    currentTools: websiteLead.currentTools || "",
    desiredOutcome: websiteLead.desiredOutcome || "",
    businessName: websiteLead.businessName,
    industry: websiteLead.industry,
    websiteUrl: websiteLead.websiteOrSocial,
    budgetRange: "$1,500-$3,500",
    timeline: "1-2 months",
    name: websiteLead.name,
    email: websiteLead.email,
    companyWebsite: "",
  };
  const routed = scoreConcierge(answers);
  const concierge: ConciergeLeadData = {
    schemaVersion: 1,
    sessionId: "00000000-0000-4000-8000-000000000088",
    recommendedService: routed.service,
    recommendationConfidence: routed.confidence,
    recommendationReasons: routed.reasons,
    recommendationSource: "deterministic",
    requiresHumanReview: routed.requiresHumanReview,
    qualificationSummary: "Server-recomputed qualification.",
    answers,
    visitorPrimaryProblem: answers.primaryProblem,
    currentTools: ["Squarespace", "Google Analytics", "Calendly"],
    desiredOutcome: answers.desiredOutcome,
    budgetRange: answers.budgetRange,
    timeline: answers.timeline,
    websiteUrl: answers.websiteUrl,
  };
  const packet = buildFounderSalesPacket({ ...websiteLead, source: "ai_project_concierge", concierge });
  assert.equal(routed.service, "website_rebuild");
  assert.equal(packet.recommendedOffer.service, "Small-Business Website");
  assert.equal(packet.recommendedOffer.confidenceScore, routed.confidence);
});

test("Resend receives one founder-only notification with Reply-To and the full draft packet", async () => {
  const originalFetch = global.fetch;
  const original = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  };
  const calls: Array<{ url: string; payload: Record<string, unknown> }> = [];
  try {
    process.env.RESEND_API_KEY = "re_test_only";
    process.env.CONTACT_TO_EMAIL = "blake@koinophobialabs.com";
    process.env.CONTACT_FROM_EMAIL = "Koinophobia Labs Leads <leads@koinophobialabs.com>";
    global.fetch = async (input, init) => {
      calls.push({ url: String(input), payload: JSON.parse(String(init?.body)) });
      return Response.json({ id: "email_test_founder_packet" });
    };

    const delivery = await sendLeadEmail(websiteLead, "00000000-0000-4000-8000-000000000099");
    assert.equal(delivery.ok, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    assert.equal(calls[0].payload.to, "blake@koinophobialabs.com");
    assert.equal(calls[0].payload.reply_to, websiteLead.email);
    assert.notEqual(calls[0].payload.to, websiteLead.email, "no automatic customer email");
    assert.match(String(calls[0].payload.text), /FOUNDER SALES PACKET/);
    assert.match(String(calls[0].payload.text), /DRAFT ONLY, NOT SENT/);
    assert.match(String(calls[0].payload.html), /INTERNAL ONLY/);
    assert.match(String(calls[0].payload.html), /Draft only — this message has not been sent to the lead/);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("lead-controlled text is escaped in founder notification HTML", () => {
  const html = formatLeadEmailHtml({
    ...websiteLead,
    name: "TEST DATA — <img src=x onerror=alert(1)>",
    biggestProblem: "TEST DATA — <script>alert('packet')</script>",
  });
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test("the CRM keeps the founder draft editable without a send action", () => {
  const page = readFileSync("app/crm/leads/[id]/page.tsx", "utf8");
  assert.match(page, /<textarea[\s\S]*aria-label="Editable founder reply draft"[\s\S]*defaultValue=\{lead\.founderPacket\.founderReplyDraft\}/);
  assert.doesNotMatch(page, /sendFounderReply|send reply|email lead/i);
});

test("the packet is persisted on the lead and smoke submissions remain non-prospects", async () => {
  const calls: unknown[][] = [];
  const db = { query: async (_query: string, values: unknown[]) => {
    calls.push(values);
    return { rows: [{
      id: values[0], created_at: new Date(), updated_at: new Date(), source: values[2],
      name: values[3], business_name: values[4], email: values[5], phone: values[6],
      website_or_social: values[7], industry: values[8], service_interest: values[9],
      budget_range: values[10], timeline: values[11], biggest_problem: values[12],
      notes: values[13], concierge_data: JSON.parse(String(values[14])),
      founder_packet: JSON.parse(String(values[15])), is_prospect: values[16],
      non_prospect_reason: values[17], status: "new", last_contacted_at: null,
      follow_up_at: null, audit_completed: false, proposal_sent_at: null,
      outcome: "open", internal_notes: "", payment_status: "not_started", created: true,
    }] };
  } };

  const result = await storeLead(smokeLead, "smoke-founder-packet", db as never);
  assert.equal(result.lead.isProspect, false);
  assert.equal(result.lead.founderPacket?.disposition.label, "Spam or test");
  assert.equal(packetMarksProspect(result.lead.founderPacket!), false);
  assert.equal(calls[0][16], false);
  assert.match(String(calls[0][17]), /non-prospect test record/);
});

test("the additive packet migration is in the migration runner", () => {
  const migration = readFileSync("db/008_founder_sales_packet.sql", "utf8");
  const runner = readFileSync("scripts/migrate-crm.mjs", "utf8");
  assert.match(migration, /founder_packet jsonb/i);
  assert.match(migration, /is_prospect boolean/i);
  assert.match(runner, /008_founder_sales_packet\.sql/);
});
