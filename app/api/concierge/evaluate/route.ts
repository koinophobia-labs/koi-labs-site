import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { consumeAuditRateLimit } from "@/lib/audits";
import { evaluateConcierge } from "@/lib/concierge/evaluate";
import {
  cacheConciergeEvaluation,
  checkConciergeRateLimit,
  CONCIERGE_RATE_MAX,
  CONCIERGE_RATE_WINDOW_MS,
  getCachedConciergeEvaluation,
} from "@/lib/concierge/api-state";
import { conciergeAnswerDigest, signConciergeEvaluation } from "@/lib/concierge/signing";
import { parseEvaluationRequest } from "@/lib/concierge/validation";
import { isTrustedMutationRequest } from "@/lib/security/origin";

function clientKey(request: NextRequest) {
  return (request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
}

async function publicRateLimited(request: NextRequest) {
  const key = clientKey(request);
  if (process.env.DATABASE_URL) {
    try {
      const actorKey = `concierge:${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
      const result = await consumeAuditRateLimit({ actorKey, limit: CONCIERGE_RATE_MAX, windowSeconds: CONCIERGE_RATE_WINDOW_MS / 1000 });
      return !result.allowed;
    } catch { /* Fall back to the local limiter if persistence is temporarily unavailable. */ }
  }
  return checkConciergeRateLimit(key);
}

function response(body: Record<string, unknown>, status: number, requestId: string) {
  return NextResponse.json(body, {
    status,
    headers: { "x-request-id": requestId, "x-content-type-options": "nosniff", "cache-control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  if (!isTrustedMutationRequest(request)) return response({ ok: false, message: "The request origin was rejected.", requestId }, 403, requestId);
  if (await publicRateLimited(request)) return response({ ok: false, message: "Too many attempts. Wait a few minutes and try again.", requestId }, 429, requestId);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ ok: false, message: "The request format was invalid.", requestId }, 400, requestId); }
  const parsed = parseEvaluationRequest(body);
  if (!parsed.request) return response({ ok: false, message: "Please correct the incomplete answers.", errors: parsed.errors, requestId }, 422, requestId);
  if (parsed.request.answers.companyWebsite) return response({ ok: false, message: "The request was rejected.", requestId }, 400, requestId);

  const cacheKey = `${parsed.request.sessionId}:${conciergeAnswerDigest(parsed.request.answers)}`;
  const cached = getCachedConciergeEvaluation(cacheKey);
  if (cached) return response({ ok: true, evaluation: cached, duplicate: true, requestId }, 200, requestId);
  try {
    const safetyIdentifier = createHash("sha256").update(parsed.request.sessionId).digest("hex").slice(0, 48);
    const evaluation = await evaluateConcierge(parsed.request.answers, { safetyIdentifier });
    evaluation.evaluationToken = signConciergeEvaluation(parsed.request.sessionId, parsed.request.answers, evaluation);
    cacheConciergeEvaluation(cacheKey, evaluation);
    console.info(JSON.stringify({ scope: "concierge", event: "evaluated", requestId, source: evaluation.source, service: evaluation.recommendation.service }));
    return response({ ok: true, evaluation, duplicate: false, requestId }, 200, requestId);
  } catch {
    console.warn(JSON.stringify({ scope: "concierge", event: "evaluation_failed", requestId }));
    return response({ ok: false, message: "A safe recommendation could not be generated. Retry or use the standard form.", requestId }, 503, requestId);
  }
}
