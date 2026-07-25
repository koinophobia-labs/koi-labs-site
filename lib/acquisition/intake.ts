import { type LeadInput, redactLeadFreeText } from "@/lib/acquisition/leads";
import {
  buildFounderSalesPacket,
  founderPacketText,
  type FounderSalesPacket,
} from "@/lib/acquisition/founder-packet";
import { serviceLabel } from "@/lib/concierge/questions";
import { deterministicQualificationSummary, scoreConcierge, splitTools } from "@/lib/concierge/routing";
import { verifyConciergeEvaluation } from "@/lib/concierge/signing";
import type { ConciergeAnswers, ConciergeLeadData } from "@/lib/concierge/types";
import { normalizeWebsiteUrl, validSessionId, validateConciergeAnswers } from "@/lib/concierge/validation";

const requiredFields = ["name", "businessName", "email", "websiteOrSocial", "industry", "serviceInterest", "timeline", "biggestProblem"] as const;
const fieldLimits: Record<string, number> = { name: 120, businessName: 160, email: 254, phone: 40, websiteOrSocial: 500, industry: 120, serviceInterest: 160, budgetRange: 80, timeline: 80, biggestProblem: 4000, notes: 8400 };
const rateLimit = new Map<string, { count: number; resetAt: number }>();
export const INTAKE_RATE_WINDOW_MS = 10 * 60 * 1000;
export const INTAKE_RATE_MAX = 5;

export function intakeFormValue(form: FormData, key: string) { return String(form.get(key) || "").trim(); }
function validEmail(input: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input); }

function conciergeFromForm(form: FormData, input: LeadInput, desiredOutcome: string, currentTools: string): { data?: ConciergeLeadData; error?: string } {
  const sessionId = intakeFormValue(form, "conciergeSessionId");
  const rawAnswers = intakeFormValue(form, "conciergeAnswers");
  if (!sessionId && !rawAnswers) return {};
  if (!sessionId || !rawAnswers || !validSessionId(sessionId) || rawAnswers.length > 15_000) return { error: "The concierge handoff was invalid. Return to the concierge or use the standard form." };
  let decoded: unknown;
  try { decoded = JSON.parse(rawAnswers); } catch { return { error: "The concierge handoff was invalid. Return to the concierge or use the standard form." }; }
  const parsed = validateConciergeAnswers(decoded);
  if (!parsed.answers) return { error: "The concierge answers were incomplete. Return to the concierge or use the standard form." };

  const websiteUrl = normalizeWebsiteUrl(input.websiteOrSocial) || parsed.answers.websiteUrl;
  const merged: ConciergeAnswers = {
    ...parsed.answers,
    businessName: input.businessName,
    industry: input.industry,
    websiteUrl,
    primaryProblem: input.biggestProblem,
    desiredOutcome: desiredOutcome || parsed.answers.desiredOutcome,
    currentTools,
    budgetRange: (input.budgetRange || "Not sure yet") as ConciergeAnswers["budgetRange"],
    timeline: input.timeline as ConciergeAnswers["timeline"],
    name: input.name,
    email: input.email,
    companyWebsite: "",
  };
  const revalidated = validateConciergeAnswers(merged);
  if (!revalidated.answers) return { error: "The edited concierge details are incomplete. Correct the form or restart the concierge." };

  const recommendation = scoreConcierge(revalidated.answers);
  const signed = verifyConciergeEvaluation(intakeFormValue(form, "conciergeEvaluationToken"), sessionId, revalidated.answers);
  return { data: {
    schemaVersion: 1,
    sessionId,
    recommendedService: recommendation.service,
    recommendationConfidence: recommendation.confidence,
    recommendationReasons: recommendation.reasons,
    recommendationSource: signed?.source || "deterministic",
    requiresHumanReview: recommendation.requiresHumanReview,
    qualificationSummary: signed?.qualificationSummary || deterministicQualificationSummary(revalidated.answers, recommendation),
    answers: revalidated.answers,
    visitorPrimaryProblem: input.biggestProblem,
    currentTools: splitTools(currentTools),
    desiredOutcome: desiredOutcome || revalidated.answers.desiredOutcome,
    budgetRange: input.budgetRange || "Not supplied in final intake",
    timeline: input.timeline,
    websiteUrl,
  } };
}

export function validateIntake(form: FormData): { input?: LeadInput; errors?: Record<string, string> } {
  const desiredOutcome = intakeFormValue(form, "desiredOutcome");
  const currentTools = intakeFormValue(form, "currentTools");
  const additionalNotes = intakeFormValue(form, "notes");
  const input: LeadInput = {
    name: intakeFormValue(form, "name"), businessName: intakeFormValue(form, "businessName"), email: intakeFormValue(form, "email"),
    phone: intakeFormValue(form, "phone"), websiteOrSocial: intakeFormValue(form, "websiteOrSocial"), industry: intakeFormValue(form, "industry"),
    serviceInterest: intakeFormValue(form, "serviceInterest"), budgetRange: intakeFormValue(form, "budgetRange"), timeline: intakeFormValue(form, "timeline"),
    biggestProblem: intakeFormValue(form, "biggestProblem"),
    notes: [desiredOutcome ? `Desired outcome: ${desiredOutcome}` : "", currentTools ? `Current tools: ${currentTools}` : "", additionalNotes ? `Additional notes: ${additionalNotes}` : ""].filter(Boolean).join("\n\n"),
    desiredOutcome,
    currentTools,
    source: "website intake",
  };
  const errors: Record<string, string> = {};
  for (const key of requiredFields) if (!input[key]) errors[key] = "This field is required.";
  if (desiredOutcome.length > 2000) errors.desiredOutcome = "Must be 2000 characters or fewer.";
  if (currentTools.length > 2000) errors.currentTools = "Must be 2000 characters or fewer.";
  if (additionalNotes.length > 4000) errors.notes = "Must be 4000 characters or fewer.";
  if (input.email && !validEmail(input.email)) errors.email = "Enter a valid email address.";
  if (input.websiteOrSocial) {
    const normalized = normalizeWebsiteUrl(input.websiteOrSocial);
    if (!normalized) errors.websiteOrSocial = "Enter a public http or https website or social link.";
    else input.websiteOrSocial = normalized;
  }
  for (const [key, limit] of Object.entries(fieldLimits)) if (String(input[key as keyof LeadInput] || "").length > limit) errors[key] = `Must be ${limit} characters or fewer.`;
  if (Object.keys(errors).length) return { errors };
  const concierge = conciergeFromForm(form, input, desiredOutcome, currentTools);
  if (concierge.error) return { errors: { conciergeAnswers: concierge.error } };
  if (concierge.data) { input.concierge = concierge.data; input.source = "ai_project_concierge"; }
  return { input };
}

function recommendationText(input: LeadInput) {
  if (!input.concierge) return "";
  const concierge = input.concierge;
  return `\n\nConcierge qualification:\nRecommended service: ${serviceLabel(concierge.recommendedService)}\nConfidence: ${Math.round(concierge.recommendationConfidence * 100)}%\nSource: ${concierge.recommendationSource}\nHuman review: ${concierge.requiresHumanReview ? "Required" : "Standard review"}\nSummary: ${concierge.qualificationSummary}\nReasons:\n${concierge.recommendationReasons.map((reason) => `- ${reason}`).join("\n")}\nCurrent tools: ${concierge.currentTools.join(", ") || "Not provided"}`;
}

export function formatLeadEmailText(rawInput: LeadInput, leadId?: string) {
  // SITE-03: mask obvious secrets before they reach Blake's inbox.
  const input = redactLeadFreeText(rawInput);
  const founderPacket = buildFounderSalesPacket(input);
  const crmLink = leadId ? `\nCRM: ${(process.env.NEXT_PUBLIC_SITE_URL || "https://koinophobialabs.com").replace(/\/$/, "")}/crm/leads/${encodeURIComponent(leadId)}` : "";
  return `New Koinophobia Labs lead\n\n${founderPacketText(founderPacket)}\n\nSUBMITTED DETAILS\nName: ${input.name}\nBusiness name: ${input.businessName}\nEmail: ${input.email}\nPhone: ${input.phone || "Not provided"}\nWebsite/social: ${input.websiteOrSocial}\nIndustry: ${input.industry}\nService interest: ${input.serviceInterest}\nBudget range: ${input.budgetRange || "Not provided"}\nTimeline: ${input.timeline}\n\nBiggest problem:\n${input.biggestProblem}\n\nNotes:\n${input.notes || "Not provided"}\n\nSource: ${input.source || "website intake"}${recommendationText(input)}${crmLink}`;
}

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function founderPacketHtml(packet: FounderSalesPacket) {
  const scope = packet.recommendedOffer.suggestedScope.length
    ? `<ul>${packet.recommendedOffer.suggestedScope.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "<p>No implementation scope recommended yet.</p>";
  const missing = packet.missingInformation.length
    ? `<ol>${packet.missingInformation.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ol>`
    : "<p>None identified before starting.</p>";
  const problemRows = [
    ["Struggling with", packet.problemSummary.struggle],
    ["Desired outcome", packet.problemSummary.desiredOutcome],
    ["Current blocker", packet.problemSummary.currentBlocker],
    ["Urgency", packet.problemSummary.urgency],
  ];
  const offerRows = [
    ["Service", packet.recommendedOffer.service],
    ["Why it fits", packet.recommendedOffer.whyItFits],
    ["Estimated timeline", packet.recommendedOffer.estimatedTimeline],
    ["Existing price/range", packet.recommendedOffer.price],
    ["Confidence", `${packet.recommendedOffer.confidenceLevel} (${Math.round(packet.recommendedOffer.confidenceScore * 100)}%)`],
    ["Readiness risk", packet.recommendedOffer.readinessRisk || "None apparent from the submission."],
  ];
  const table = (rows: string[][]) => `<table style="border-collapse:collapse;width:100%;max-width:720px"><tbody>${rows.map(([label, value]) => `<tr><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top;background:#f9fafb;width:160px">${escapeHtml(label)}</th><td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>`;
  return `<section style="border:2px solid #0f766e;border-radius:8px;padding:18px;margin:20px 0"><p style="margin:0 0 4px;color:#0f766e;font-size:12px;font-weight:700;letter-spacing:.08em">FOUNDER SALES PACKET · INTERNAL ONLY</p><h2 style="margin:0 0 8px">${escapeHtml(packet.disposition.label)}</h2><p>${escapeHtml(packet.disposition.reason)}</p><h3>Problem summary</h3>${table(problemRows)}<h3>Recommended offer</h3>${table(offerRows)}<h3>Suggested scope</h3>${scope}<h3>Missing information</h3>${missing}<h3>Founder reply draft</h3><p style="color:#9a3412;font-weight:700">Draft only — this message has not been sent to the lead.</p><div style="white-space:pre-wrap;border-left:4px solid #d1d5db;padding-left:12px">${escapeHtml(packet.founderReplyDraft)}</div></section>`;
}
export function formatLeadEmailHtml(rawInput: LeadInput, leadId?: string) {
  // SITE-03: mask obvious secrets before they reach Blake's inbox.
  const input = redactLeadFreeText(rawInput);
  const founderPacket = buildFounderSalesPacket(input);
  const conciergeRows = input.concierge ? [["Recommended service", serviceLabel(input.concierge.recommendedService)], ["Rule confidence", `${Math.round(input.concierge.recommendationConfidence * 100)}%`], ["Recommendation source", input.concierge.recommendationSource], ["Human review", input.concierge.requiresHumanReview ? "Required" : "Standard review"]] : [];
  const rows = [["Name", input.name], ["Business name", input.businessName], ["Email", input.email], ["Phone", input.phone || "Not provided"], ["Website/social", input.websiteOrSocial], ["Industry", input.industry], ["Service interest", input.serviceInterest], ["Budget range", input.budgetRange || "Not provided"], ["Timeline", input.timeline], ["Source", input.source || "website intake"], ...conciergeRows];
  const concierge = input.concierge ? `<h2>Concierge qualification</h2><p style="white-space:pre-wrap">${escapeHtml(input.concierge.qualificationSummary)}</p><ul>${input.concierge.recommendationReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>` : "";
  const crmLink = leadId ? `<p><a href="${escapeHtml(`${(process.env.NEXT_PUBLIC_SITE_URL || "https://koinophobialabs.com").replace(/\/$/, "")}/crm/leads/${encodeURIComponent(leadId)}`)}">Open this lead in the CRM</a></p>` : "";
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;margin:0;padding:24px"><h1 style="font-size:20px">New Koinophobia Labs lead</h1>${founderPacketHtml(founderPacket)}<h2>Submitted details</h2><table style="border-collapse:collapse;width:100%;max-width:720px"><tbody>${rows.map(([label, rowValue]) => `<tr><th style="border:1px solid #e5e7eb;padding:8px;text-align:left;background:#f9fafb">${escapeHtml(label)}</th><td style="border:1px solid #e5e7eb;padding:8px">${escapeHtml(rowValue)}</td></tr>`).join("")}</tbody></table><h2>Biggest problem</h2><p style="white-space:pre-wrap">${escapeHtml(input.biggestProblem)}</p><h2>Notes</h2><p style="white-space:pre-wrap">${escapeHtml(input.notes || "Not provided")}</p>${concierge}${crmLink}</body></html>`;
}

export function leadMailto(input: LeadInput) { return `mailto:${process.env.CONTACT_TO_EMAIL || "koinophobia999@gmail.com"}?subject=${encodeURIComponent(`Koinophobia Labs intake: ${input.businessName}`)}&body=${encodeURIComponent(formatLeadEmailText(input))}`; }
export async function sendLeadEmail(input: LeadInput, leadId?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "Koinophobia Labs Leads <leads@koinophobialabs.com>";
  if (!apiKey || !to) return { ok: false, reason: "not_configured" as const };
  const founderPacket = buildFounderSalesPacket(redactLeadFreeText(input));
  const subjectPrefix = founderPacket.disposition.label === "Spam or test"
    ? "Test / non-prospect intake"
    : input.concierge ? "New concierge lead" : "New website lead";
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, subject: `${subjectPrefix}: ${input.businessName}`, text: formatLeadEmailText(input, leadId), html: formatLeadEmailHtml(input, leadId), reply_to: input.email }) });
    if (!response.ok) return { ok: false, reason: "provider_rejected" as const, status: response.status };
    const payload = await response.json().catch(() => ({}));
    return { ok: true, providerId: typeof payload.id === "string" ? payload.id : undefined };
  } catch { return { ok: false, reason: "provider_unreachable" as const }; }
}

export function checkRateLimit(key: string, now = Date.now()) {
  const existing = rateLimit.get(key);
  if (!existing || existing.resetAt <= now) { rateLimit.set(key, { count: 1, resetAt: now + INTAKE_RATE_WINDOW_MS }); return false; }
  existing.count += 1;
  return existing.count > INTAKE_RATE_MAX;
}
export function resetIntakeRouteStateForTests() { rateLimit.clear(); }
export function intakeOutcome(saved: boolean, emailSent: boolean) {
  if (!saved) return { ok: false as const, status: 503, message: "We could not safely record your intake right now. Please retry or use the email fallback." };
  return { ok: true as const, status: 200, emailSent, message: emailSent ? "Intake received and emailed to Blake. He will review fit, scope, and the next practical step." : "Intake received. Blake will review fit, scope, and the next practical step." };
}
