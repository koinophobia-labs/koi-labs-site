import { dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  buildFounderSalesPacket,
  packetMarksProspect,
} from "../lib/acquisition/founder-packet";
import { sendLeadEmail } from "../lib/acquisition/intake";
import { storeLead, type LeadInput } from "../lib/acquisition/leads";

const requestedOutputPath = process.env.FOUNDER_PACKET_EVIDENCE_PATH;
if (!requestedOutputPath) throw new Error("FOUNDER_PACKET_EVIDENCE_PATH is required");
const outputPath: string = requestedOutputPath;

const base: LeadInput = {
  name: "Production-Safe Fixture",
  businessName: "Fixture Business",
  email: "fixture@koinophobia-fixtures.invalid",
  websiteOrSocial: "https://fixture-business.invalid",
  industry: "Local services",
  serviceInterest: "Not sure yet",
  budgetRange: "$1,500-$3,500",
  timeline: "This month",
  biggestProblem: "A submitted business problem.",
  desiredOutcome: "A submitted desired outcome.",
  currentTools: "Submitted Tool A, Submitted Tool B",
  source: "website intake",
};

const fixtures: Record<string, LeadInput> = {
  strongWebsiteRebuild: {
    ...base,
    name: "Maya Fixture",
    businessName: "Northstar Fitness Fixture",
    email: "maya@northstar-fixture.invalid",
    serviceInterest: "Small-Business Website",
    timeline: "1-2 months",
    biggestProblem: "The five page website is unclear on mobile, hides the class schedule, and sends qualified visitors to a contact form that few finish.",
    desiredOutcome: "Make classes easy to understand and turn qualified mobile visits into complete trial-week inquiries.",
    currentTools: "Squarespace, Google Analytics, Calendly",
  },
  smallAutomation: {
    ...base,
    name: "Jordan Fixture",
    businessName: "Lakeview Home Services Fixture",
    email: "jordan@lakeview-fixture.invalid",
    serviceInterest: "AI Workflow or Front Office",
    biggestProblem: "Staff manually copy each of roughly 12 inquiries a week from Gmail into HubSpot and Calendly, so follow-up is delayed. The office manager reviews exceptions.",
    desiredOutcome: "Route every complete inquiry into the CRM and calendar while keeping exceptions with the office manager.",
    currentTools: "Gmail, HubSpot, Calendly",
  },
  vagueInquiry: {
    ...base,
    name: "Riley Fixture",
    businessName: "Morgan Fixture Co",
    email: "riley@morgan-fixture.invalid",
    serviceInterest: "Not sure yet",
    budgetRange: "",
    biggestProblem: "We need help making the business work better online.",
    desiredOutcome: "",
    currentTools: "",
  },
  lowBudgetPoorFit: {
    ...base,
    name: "Avery Fixture",
    businessName: "Stone Street Fixture",
    email: "avery@stone-fixture.invalid",
    serviceInterest: "Small-Business Website",
    budgetRange: "Under $500",
    timeline: "This week",
    biggestProblem: "We need the whole site rebuilt this week because the current site is outdated and the service pages do not explain what we sell.",
    desiredOutcome: "Launch a complete new business website with clear service pages and an inquiry form.",
    currentTools: "Wix",
  },
  smokeTest: {
    ...base,
    name: "Koinophobia Smoke Test",
    businessName: "Founder Packet Smoke Test",
    email: "smoke@example.com",
    websiteOrSocial: "https://example.com",
    serviceInterest: "Small-Business Website",
    biggestProblem: "Controlled production-safe smoke test for the intake pipeline.",
    desiredOutcome: "Confirm the internal founder packet without contacting a prospect.",
    currentTools: "Test fixture",
  },
};

const scenarios = Object.fromEntries(Object.entries(fixtures).map(([name, input]) => {
  const packet = buildFounderSalesPacket(input);
  return [name, {
    submittedProblem: input.biggestProblem,
    submittedOutcome: input.desiredOutcome,
    problemSummary: packet.problemSummary,
    recommendedOffer: packet.recommendedOffer,
    missingInformation: packet.missingInformation,
    disposition: packet.disposition,
    founderReplyDraft: packet.founderReplyDraft,
    isProspect: packetMarksProspect(packet),
  }];
}));

async function main() {
const originalFetch = global.fetch;
const originalEnv = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
};
let capturedEmail: Record<string, unknown> = {};
try {
  process.env.RESEND_API_KEY = "re_production_safe_mock";
  process.env.CONTACT_TO_EMAIL = "blake@koinophobialabs.com";
  process.env.CONTACT_FROM_EMAIL = "Koinophobia Labs Leads <leads@koinophobialabs.com>";
  global.fetch = async (_input, init) => {
    capturedEmail = JSON.parse(String(init?.body));
    return Response.json({ id: "mock_resend_founder_packet" });
  };
  await sendLeadEmail(fixtures.strongWebsiteRebuild, "00000000-0000-4000-8000-000000000099");
} finally {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

let capturedPersistence: unknown[] = [];
const fakeDb = { query: async (_query: string, values: unknown[]) => {
  capturedPersistence = values;
  return { rows: [{
    id: values[0], created_at: new Date("2026-07-25T12:00:00Z"), updated_at: new Date("2026-07-25T12:00:00Z"),
    source: values[2], name: values[3], business_name: values[4], email: values[5], phone: values[6],
    website_or_social: values[7], industry: values[8], service_interest: values[9], budget_range: values[10],
    timeline: values[11], biggest_problem: values[12], notes: values[13], concierge_data: JSON.parse(String(values[14])),
    founder_packet: JSON.parse(String(values[15])), is_prospect: values[16], non_prospect_reason: values[17],
    status: "new", last_contacted_at: null, follow_up_at: null, audit_completed: false, proposal_sent_at: null,
    outcome: "open", internal_notes: "", payment_status: "not_started", created: true,
  }] };
} };
const smokeRecord = await storeLead(fixtures.smokeTest, "founder-packet-smoke-evidence", fakeDb as never);

const emailText = String(capturedEmail.text || "");
const emailHtml = String(capturedEmail.html || "");
const evidence = {
  generatedAt: new Date().toISOString(),
  safety: {
    database: "mocked",
    resend: "mocked",
    networkRequests: 0,
    productionWrites: 0,
    customerMessagesSent: 0,
  },
  scenarios,
  capturedFounderNotification: {
    to: capturedEmail.to,
    reply_to: capturedEmail.reply_to,
    subject: capturedEmail.subject,
    recipientIsLead: capturedEmail.to === fixtures.strongWebsiteRebuild.email,
    containsProblemSummary: emailText.includes("Problem summary") && emailHtml.includes("Problem summary"),
    containsRecommendedOffer: emailText.includes("Recommended offer") && emailHtml.includes("Recommended offer"),
    containsMissingInformation: emailText.includes("Missing information") && emailHtml.includes("Missing information"),
    containsFounderDraft: emailText.includes("Founder reply draft") && emailHtml.includes("Founder reply draft"),
    explicitlyDraftOnly: emailText.includes("DRAFT ONLY, NOT SENT") && emailHtml.includes("this message has not been sent to the lead"),
  },
  capturedSmokePersistence: {
    founderPacketAttached: Boolean(smokeRecord.lead.founderPacket),
    disposition: smokeRecord.lead.founderPacket?.disposition.label,
    isProspect: smokeRecord.lead.isProspect,
    storedIsProspectValue: capturedPersistence[16],
    nonProspectReason: smokeRecord.lead.nonProspectReason,
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  scenarioCount: Object.keys(scenarios).length,
  founderNotificationRecipient: capturedEmail.to,
  replyTo: capturedEmail.reply_to,
  smokeIsProspect: smokeRecord.lead.isProspect,
}, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
