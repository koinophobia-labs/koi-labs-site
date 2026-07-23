import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { storeLead } from "@/lib/acquisition/leads";
import {
  checkRateLimit,
  INTAKE_RATE_MAX,
  INTAKE_RATE_WINDOW_MS,
  intakeFormValue,
  intakeOutcome,
  leadMailto,
  sendLeadEmail,
  validateIntake,
} from "@/lib/acquisition/intake";
import { consumeAuditRateLimit } from "@/lib/audits";
import { isTrustedMutationRequest } from "@/lib/security/origin";
import { resolveIntakeIdempotencyKey, shouldSendLeadEmail, trustedClientKey } from "@/lib/acquisition/intake-abuse";

async function publicRateLimited(request: NextRequest) {
  const key = trustedClientKey(request);
  if (process.env.DATABASE_URL) {
    try {
      const actorKey = `intake:${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
      const result = await consumeAuditRateLimit({ actorKey, limit: INTAKE_RATE_MAX, windowSeconds: INTAKE_RATE_WINDOW_MS / 1000 });
      return !result.allowed;
    } catch { /* Keep the form available through the local fallback limiter. */ }
  }
  return checkRateLimit(key);
}
function log(event: string, requestId: string, details: Record<string, unknown> = {}) { console.info(JSON.stringify({ scope: "intake", event, requestId, ...details })); }
function failure(message: string, status: number, requestId: string, extra: Record<string, unknown> = {}) { return NextResponse.json({ ok: false, message, requestId, ...extra }, { status, headers: { "x-request-id": requestId, "cache-control": "no-store", "x-content-type-options": "nosniff" } }); }

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  if (!isTrustedMutationRequest(request)) return failure("The request origin was rejected.", 403, requestId);
  if (await publicRateLimited(request)) { log("rate_limited", requestId); return failure("Too many attempts. Please wait 10 minutes and try again.", 429, requestId); }
  let form: FormData;
  try { form = await request.formData(); } catch { log("malformed_request", requestId); return failure("The submission format was invalid. Please refresh and try again.", 400, requestId); }
  if (intakeFormValue(form, "companyWebsite")) { log("honeypot_rejected", requestId); return failure("The submission was rejected.", 400, requestId); }
  const parsed = validateIntake(form);
  if (!parsed.input) { log("validation_failed", requestId, { fields: Object.keys(parsed.errors || {}) }); return failure("Please correct the highlighted information and try again.", 422, requestId, { errors: parsed.errors }); }
  const input = parsed.input;
  // SITE-01: the standard form used a fresh per-request id when no concierge
  // session and no explicit idempotency-key were present, so every resubmit
  // created a new lead + new email. Fall back to a deterministic content-derived
  // key within a time window so accidental resubmits fold onto one lead.
  const idempotencyKey = resolveIntakeIdempotencyKey({
    conciergeSessionId: input.concierge?.sessionId,
    suppliedKey: request.headers.get("idempotency-key"),
    content: { email: input.email, businessName: input.businessName, biggestProblem: input.biggestProblem },
    nowMs: Date.now(),
  })
  let saved = false;
  let created = false;
  let leadId: string | undefined;
  try { const result = await storeLead(input, idempotencyKey); saved = Boolean(result.lead); created = result.created; leadId = result.lead.id; }
  catch { log("lead_storage_failed", requestId); }
  // SITE-01: send the lead email once per lead. Skip it on a confirmed dedupe
  // (already stored AND not newly created); still send when storage failed so a
  // lead is never silently lost.
  const emailThisSubmission = shouldSendLeadEmail(created, saved);
  const delivery = emailThisSubmission ? await sendLeadEmail(input, leadId) : { ok: true as const };
  if (!emailThisSubmission) log("email_skipped_duplicate", requestId, { leadId });
  const outcome = intakeOutcome(saved, delivery.ok);
  if (!outcome.ok) { log("persistence_failed", requestId, { providerAccepted: delivery.ok }); return failure(outcome.message, outcome.status, requestId, { mailto: leadMailto(input) }); }
  if (!delivery.ok) log("provider_failed", requestId, { reason: delivery.reason, status: "status" in delivery ? delivery.status : undefined, saved, source: input.source });
  else log("accepted", requestId, { providerAccepted: true, providerId: "providerId" in delivery ? delivery.providerId : undefined, emailSkipped: !emailThisSubmission, saved, created, source: input.source });
  return NextResponse.json({ ok: true, requestId, emailSent: outcome.emailSent, message: outcome.message }, { headers: { "x-request-id": requestId, "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
