import { serviceOffers } from "@/lib/commercial";
import { classifyProblemKind } from "@/lib/front-office/extract";
import { scoreConcierge } from "@/lib/concierge/routing";
import type {
  ConciergeAnswers,
  ServiceRecommendation,
  ServiceType,
} from "@/lib/concierge/types";
import { LINKS } from "@/lib/links";
import type { LeadInput } from "@/lib/acquisition/leads";

export const leadDispositionLabels = [
  "Ready for offer",
  "Needs clarification",
  "Nurture",
  "Not a fit",
  "Spam or test",
] as const;

export type LeadDispositionLabel = (typeof leadDispositionLabels)[number];
export type FounderPacketConfidence = "High" | "Medium" | "Low";

export type FounderSalesPacket = {
  schemaVersion: 1;
  problemSummary: {
    struggle: string;
    desiredOutcome: string;
    currentBlocker: string;
    urgency: string;
  };
  recommendedOffer: {
    service: string;
    whyItFits: string;
    suggestedScope: string[];
    estimatedTimeline: string;
    price: string;
    confidenceLevel: FounderPacketConfidence;
    confidenceScore: number;
    readinessRisk: string | null;
    offerSlug?: string;
    offerPath?: string;
  };
  missingInformation: string[];
  founderReplyDraft: string;
  disposition: {
    label: LeadDispositionLabel;
    reason: string;
  };
};

type PacketContext = {
  desiredOutcome: string;
  currentTools: string;
  branchContext: string;
  impact: string;
};

type PublishedOffer = (typeof serviceOffers)[number];

const directServiceKinds: Record<string, ConciergeAnswers["problemKind"]> = {
  "Website audit": "unsure",
  "Quick Fix Sprint": "small_fix",
  "Landing Page Rebuild": "website",
  "Small-Business Website": "website",
  "AI Workflow or Front Office": "manual_work",
  "Custom Product Development": "custom_product",
};

const offerSlugs: Partial<Record<ServiceType, string>> = {
  revenue_leak_audit: "audit",
  ai_automation: "ai-front-office",
  quick_fix: "quick-fix",
};

function clean(value: string | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function noteValue(notes: string | undefined, label: string) {
  if (!notes) return "";
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = notes.match(new RegExp(`(?:^|\\n)${escaped}:\\s*([^\\n]+(?:\\n(?!\\n|[A-Za-z ]+:)[^\\n]+)*)`, "i"));
  return clean(match?.[1]);
}

function packetContext(input: LeadInput): PacketContext {
  return {
    desiredOutcome: clean(
      input.desiredOutcome ||
      input.concierge?.desiredOutcome ||
      input.concierge?.answers.desiredOutcome ||
      noteValue(input.notes, "Desired outcome"),
    ),
    currentTools: clean(
      input.currentTools ||
      input.concierge?.answers.currentTools ||
      input.concierge?.currentTools.join(", ") ||
      noteValue(input.notes, "Current tools"),
    ),
    branchContext: clean(
      input.concierge?.answers.branchContext ||
      noteValue(input.notes, "Current situation"),
    ),
    impact: clean(
      input.concierge?.answers.impact ||
      noteValue(input.notes, "Impact"),
    ),
  };
}

function recommendationFor(input: LeadInput, context: PacketContext): ServiceRecommendation {
  if (input.concierge) return scoreConcierge(input.concierge.answers);

  const submittedText = [
    input.biggestProblem,
    context.branchContext,
    context.impact,
    context.currentTools,
    context.desiredOutcome,
  ].filter(Boolean).join(" ");
  const explicitKind = directServiceKinds[input.serviceInterest];
  const inferredKind = explicitKind || classifyProblemKind(submittedText);
  const budgetRange = [
    "Under $500",
    "$500-$1,500",
    "$1,500-$3,500",
    "$3,500+",
    "Not sure yet",
  ].includes(input.budgetRange || "") ? input.budgetRange as ConciergeAnswers["budgetRange"] : undefined;
  const timeline = [
    "This week",
    "This month",
    "1-2 months",
    "Just researching",
  ].includes(input.timeline) ? input.timeline as ConciergeAnswers["timeline"] : undefined;

  return scoreConcierge({
    ...(inferredKind ? { problemKind: inferredKind } : {}),
    primaryProblem: input.biggestProblem,
    branchContext: context.branchContext,
    impact: context.impact,
    currentTools: context.currentTools,
    desiredOutcome: context.desiredOutcome,
    budgetRange,
    timeline,
  });
}

function publishedOfferFor(
  recommendation: ServiceRecommendation,
  input: LeadInput,
): PublishedOffer | undefined {
  let slug = offerSlugs[recommendation.service];
  if (recommendation.service === "website_rebuild") {
    const websiteText = `${input.serviceInterest} ${input.biggestProblem}`.toLowerCase();
    slug = input.serviceInterest === "Landing Page Rebuild" || /\blanding page\b/.test(websiteText)
      ? "landing-page"
      : "website";
  }
  return slug ? serviceOffers.find((offer) => offer.slug === slug) : undefined;
}

function suggestedScope(offer: PublishedOffer | undefined, input: LeadInput, context: PacketContext) {
  if (!offer) return [];
  if (offer.slug !== "ai-front-office") return [...offer.includes];

  const text = `${input.biggestProblem} ${context.branchContext} ${context.currentTools}`.toLowerCase();
  const selected = new Set<string>([offer.includes[0], offer.includes[offer.includes.length - 1]]);
  if (/intake|form|inquir|lead|booking/.test(text)) selected.add("Structured intake");
  if (/summar|route|assign|triage|copy|spreadsheet/.test(text)) selected.add("Summarization or routing");
  if (context.currentTools || /integration|connect|dashboard|crm/.test(text)) selected.add("Dashboard or tool integration");
  if (/follow.?up|handoff|reminder|reply|email|schedule/.test(text)) selected.add("Follow-up and handoff logic");
  return offer.includes.filter((item) => selected.has(item));
}

function confidenceLevel(score: number): FounderPacketConfidence {
  if (score >= 0.8) return "High";
  if (score >= 0.6) return "Medium";
  return "Low";
}

function isControlledTest(input: LeadInput) {
  const email = input.email.toLowerCase().trim();
  const domain = email.split("@")[1] || "";
  const identity = `${input.name} ${input.businessName} ${input.source || ""}`.toLowerCase();
  return input.source === "test" ||
    ["example.com", "example.org", "example.net", "test.invalid"].includes(domain) ||
    (/\b(test|qa|smoke)\b/.test(identity) && /\b(test|qa|smoke)\b/.test(email.replace(/[@.+_-]/g, " ")));
}

function readinessRisk(
  input: LeadInput,
  context: PacketContext,
  recommendation: ServiceRecommendation,
  offer: PublishedOffer | undefined,
  controlledTest: boolean,
) {
  if (controlledTest) return "This is a controlled test submission, not a sales prospect.";
  if (recommendation.service === "not_a_fit") return recommendation.reasons[0] || "The submitted request is outside the current offer boundary.";
  if (!offer) return "No published Koinophobia Labs offer has enough pricing and scope information to recommend yet.";
  if (offer.slug === "website" && input.budgetRange === "Under $500") {
    return `The selected budget is below the existing ${offer.price} website range.`;
  }
  if (offer.slug === "ai-front-office" && !context.currentTools) {
    return "The tools, permissions, and failure paths are not clear enough to scope the workflow yet.";
  }
  if (["website", "ai-front-office"].includes(offer.slug) && input.timeline === "This week") {
    return `The requested timing is tighter than the existing ${offer.timeline} delivery window.`;
  }
  if (input.timeline === "Just researching") {
    return "The lead selected “Just researching,” so buying intent appears exploratory.";
  }
  if (recommendation.confidence < 0.65) {
    return "The submitted details point to competing or incomplete service signals.";
  }
  return null;
}

function missingInformation(
  input: LeadInput,
  context: PacketContext,
  recommendation: ServiceRecommendation,
  offer: PublishedOffer | undefined,
  controlledTest: boolean,
) {
  if (controlledTest || recommendation.service === "not_a_fit") return [];
  const questions: string[] = [];
  const add = (question: string) => {
    if (questions.length < 3 && !questions.includes(question)) questions.push(question);
  };
  const text = `${input.biggestProblem} ${context.branchContext} ${context.impact} ${context.currentTools} ${context.desiredOutcome}`.toLowerCase();

  if (!context.desiredOutcome) {
    add("What specific business outcome would make this project successful?");
  }
  if (
    recommendation.service !== "revenue_leak_audit" &&
    (!input.budgetRange || input.budgetRange === "Not sure yet")
  ) {
    add("What budget ceiling should the scope stay within?");
  }

  if (recommendation.service === "website_rebuild") {
    if (!context.currentTools) add("What platform is the current site built on, and do you have administrator access?");
    if (!/\b(home|service|about|contact|booking|landing|page|sitewide|whole site|\d+\s+pages?)\b/.test(text)) {
      add("Which pages and primary customer action must be included in the first scope?");
    }
  } else if (recommendation.service === "ai_automation") {
    if (!context.currentTools) add("Which tools currently receive, store, and hand off this work?");
    if (!/\b(each|every|per|daily|weekly|monthly|hour|hours|times|\d+)\b/.test(text)) {
      add("How often does this workflow run, and roughly how many items move through it?");
    }
    if (!/\b(human|reviews?|approv(?:e|es|ed|al)|fallback|exceptions?)\b/.test(text)) {
      add("Which exceptions or decisions must remain human-reviewed?");
    }
  } else if (recommendation.service === "custom_product") {
    add("Who are the first users, and what single job must the first release let them complete?");
    add("What data, accounts, or third-party systems would the product need to access?");
  } else if (recommendation.service === "quick_fix") {
    if (!/\b(iphone|android|mobile|desktop|browser|page|url|button|form|link|tracking)\b/.test(text)) {
      add("Where exactly does the issue occur, and what observable result would prove it is fixed?");
    }
  } else if (recommendation.service === "manual_review") {
    add("Which single part of the current customer or operating process is failing most often?");
    if (!context.impact) add("What is the current cost of the problem in lost leads, time, or delayed work?");
  }

  return questions.slice(0, 3);
}

function dispositionFor(
  input: LeadInput,
  context: PacketContext,
  recommendation: ServiceRecommendation,
  offer: PublishedOffer | undefined,
  controlledTest: boolean,
  risk: string | null,
): FounderSalesPacket["disposition"] {
  if (controlledTest) {
    return { label: "Spam or test", reason: "The submission uses explicit QA/test identity signals and is retained only as a non-prospect test record." };
  }
  if (recommendation.service === "not_a_fit") {
    return { label: "Not a fit", reason: recommendation.reasons[0] || "The request is outside the studio’s safe or feasible service boundary." };
  }
  if (recommendation.service === "manual_review" || !offer) {
    return { label: "Needs clarification", reason: "A published offer cannot be selected responsibly until the material scope questions are answered." };
  }
  if (offer.slug === "website" && input.budgetRange === "Under $500") {
    return { label: "Nurture", reason: `The requested website scope does not fit the existing ${offer.price} range at the submitted budget.` };
  }
  if (input.timeline === "Just researching") {
    return { label: "Nurture", reason: "The problem may fit an existing offer, but the submitted timing indicates research rather than current buying intent." };
  }
  if (recommendation.confidence < 0.65 || (offer.slug === "ai-front-office" && !context.currentTools)) {
    return { label: "Needs clarification", reason: risk || "Material feasibility information is still missing." };
  }
  return { label: "Ready for offer", reason: "The problem, desired outcome, offer fit, and current constraints are specific enough for a founder response." };
}

function urgencySummary(timeline: string) {
  const summaries: Record<string, string> = {
    "This week": "Time-sensitive — the lead selected “This week.”",
    "This month": "Near-term — the lead selected “This month.”",
    "1-2 months": "Planned — the lead selected “1–2 months.”",
    "Just researching": "Exploratory — the lead selected “Just researching.”",
  };
  return summaries[timeline] || `Unclear — the submitted timing was “${timeline || "not provided"}.”`;
}

function sentenceSnippet(value: string, max = 220) {
  const normalized = clean(value);
  if (normalized.length <= max) return normalized;
  const clipped = normalized.slice(0, max);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > max * 0.7 ? boundary : max).trim()}…`;
}

function firstName(name: string) {
  return clean(name).split(" ")[0] || "there";
}

function inlineSnippet(value: string) {
  return sentenceSnippet(value).replace(/[.!?]+$/, "");
}

function replyDraft(
  input: LeadInput,
  context: PacketContext,
  offer: PublishedOffer | undefined,
  scope: string[],
  questions: string[],
  disposition: FounderSalesPacket["disposition"],
  risk: string | null,
) {
  if (disposition.label === "Spam or test") {
    return "[Internal only — do not send. This submission was recognized as a controlled test/non-prospect.]";
  }

  const greeting = `Hi ${firstName(input.name)} —`;
  const problem = inlineSnippet(input.biggestProblem);
  const outcome = inlineSnippet(context.desiredOutcome);
  const understood = `You said ${input.businessName} is dealing with: “${problem}.”${outcome ? ` The outcome you want is: “${outcome}.”` : ""}`;
  const auditLink = offer?.slug === "audit" ? `${LINKS.labs}${offer.href}` : "";
  const linkLine = auditLink ? ` You can review the exact audit deliverable here: ${auditLink}` : "";

  if (disposition.label === "Not a fit") {
    return `${greeting}\n\nI read the submission. ${understood} Based on what you shared, I don’t think a Koinophobia Labs build is the responsible next step as currently scoped. ${risk || "A smaller self-service step or a different specialist is likely the better path."}\n\nBlake`;
  }

  if (disposition.label === "Needs clarification") {
    const questionLine = questions.length
      ? `Before I recommend a scope, I need ${questions.map((question, index) => `${index + 1}) ${question}`).join(" ")}`
      : "Before I recommend a scope, I need to separate the competing requirements.";
    const likely = offer ? ` The likely starting point is the ${offer.title}, but I don’t want to force the work into the wrong package.` : "";
    return `${greeting}\n\nI read the submission. ${understood}${likely}\n\n${questionLine} Reply here with those details and I’ll tell you the smallest sensible next step.${linkLine}\n\nBlake`;
  }

  if (!offer) {
    return `${greeting}\n\nI read the submission. ${understood} I need a little more scope before I can recommend a responsible offer or price. Reply here with the missing details and I’ll tell you the smallest sensible next step.\n\nBlake`;
  }

  const scopeLine = scope.length ? `I’d keep the first scope to ${scope.slice(0, 3).join(", ")}.` : "";
  const priceLine = offer.price === "Custom after discovery"
    ? "This offer is priced after discovery because the tools, rules, and failure paths determine the scope; I won’t invent a number before those are clear."
    : `The existing price is ${offer.price}, with a typical ${offer.timeline} delivery window once scope, access, and inputs are ready.`;
  const questionLine = questions.length
    ? ` Before starting, I still need: ${questions.map((question, index) => `${index + 1}) ${question}`).join(" ")}`
    : "";

  if (disposition.label === "Nurture") {
    const riskAfterBut = risk ? `${risk.charAt(0).toLowerCase()}${risk.slice(1)}` : "the timing suggests this is not ready to scope yet.";
    return `${greeting}\n\nI read the submission. ${understood} The closest existing offer is the ${offer.title}, but ${riskAfterBut} ${priceLine}${questionLine}\n\nIf that changes, reply here and I’ll help narrow the smallest useful version.${linkLine}\n\nBlake`;
  }

  return `${greeting}\n\nI read the submission. ${understood} Based on that, I’d start with the ${offer.title}. ${scopeLine} ${priceLine}${questionLine}\n\nReply here if that direction fits and I’ll turn it into a written scope.${linkLine}\n\nBlake`;
}

export function buildFounderSalesPacket(input: LeadInput): FounderSalesPacket {
  const context = packetContext(input);
  const recommendation = recommendationFor(input, context);
  const offer = publishedOfferFor(recommendation, input);
  const scope = suggestedScope(offer, input, context);
  const controlledTest = isControlledTest(input);
  const risk = readinessRisk(input, context, recommendation, offer, controlledTest);
  const questions = missingInformation(input, context, recommendation, offer, controlledTest);
  const disposition = dispositionFor(input, context, recommendation, offer, controlledTest, risk);
  const struggle = clean(input.biggestProblem);
  const blocker = context.branchContext
    ? context.branchContext
    : struggle
      ? `The submitted problem itself is the stated blocker: ${struggle}`
      : "No current blocker was stated.";

  return {
    schemaVersion: 1,
    problemSummary: {
      struggle: `${input.businessName} reports: ${struggle}`,
      desiredOutcome: context.desiredOutcome || "No desired outcome was stated.",
      currentBlocker: blocker,
      urgency: urgencySummary(input.timeline),
    },
    recommendedOffer: {
      service: offer?.title || (
        recommendation.service === "not_a_fit"
          ? "No Koinophobia Labs offer recommended"
          : "No published offer selected yet"
      ),
      whyItFits: offer
        ? recommendation.rationale
        : recommendation.service === "not_a_fit"
          ? recommendation.reasons.join(" ")
          : "The submitted information is not specific enough to select a published offer without inventing scope or price.",
      suggestedScope: scope,
      estimatedTimeline: offer?.timeline || "Not estimated until a published offer is selected",
      price: offer?.price || "No price recommended",
      confidenceLevel: confidenceLevel(recommendation.confidence),
      confidenceScore: recommendation.confidence,
      readinessRisk: risk,
      ...(offer ? { offerSlug: offer.slug, offerPath: offer.href } : {}),
    },
    missingInformation: questions,
    founderReplyDraft: replyDraft(input, context, offer, scope, questions, disposition, risk),
    disposition,
  };
}

export function packetMarksProspect(packet: FounderSalesPacket) {
  return !["Spam or test", "Not a fit"].includes(packet.disposition.label);
}

export function founderPacketText(packet: FounderSalesPacket) {
  const missing = packet.missingInformation.length
    ? packet.missingInformation.map((question, index) => `${index + 1}. ${question}`).join("\n")
    : "None identified before starting.";
  const scope = packet.recommendedOffer.suggestedScope.length
    ? packet.recommendedOffer.suggestedScope.map((item) => `- ${item}`).join("\n")
    : "- No implementation scope recommended yet.";
  return `FOUNDER SALES PACKET

Lead disposition: ${packet.disposition.label}
Reason: ${packet.disposition.reason}

Problem summary
- Struggling with: ${packet.problemSummary.struggle}
- Desired outcome: ${packet.problemSummary.desiredOutcome}
- Current blocker: ${packet.problemSummary.currentBlocker}
- Urgency: ${packet.problemSummary.urgency}

Recommended offer
- Service: ${packet.recommendedOffer.service}
- Why it fits: ${packet.recommendedOffer.whyItFits}
- Estimated timeline: ${packet.recommendedOffer.estimatedTimeline}
- Existing price/range: ${packet.recommendedOffer.price}
- Confidence: ${packet.recommendedOffer.confidenceLevel} (${Math.round(packet.recommendedOffer.confidenceScore * 100)}%)
- Readiness risk: ${packet.recommendedOffer.readinessRisk || "None apparent from the submission."}
Suggested scope:
${scope}

Missing information
${missing}

Founder reply draft — DRAFT ONLY, NOT SENT
${packet.founderReplyDraft}`;
}
