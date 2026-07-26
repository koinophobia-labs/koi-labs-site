import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ConciergeAnswers, ConciergeEvaluationResponse } from "@/lib/concierge/types";

type SignedEvaluation = {
  v: 1;
  sessionId: string;
  answerDigest: string;
  issuedAt: number;
  source: ConciergeEvaluationResponse["source"];
  qualificationSummary: string;
};

function secret() {
  const value = process.env.CONCIERGE_SIGNING_SECRET || "";
  return value.length >= 32 ? value : "";
}
export function conciergeAnswerDigest(answers: ConciergeAnswers) {
  return createHash("sha256").update(JSON.stringify(answers)).digest("base64url");
}

export function signConciergeEvaluation(sessionId: string, answers: ConciergeAnswers, evaluation: ConciergeEvaluationResponse, now = Date.now()) {
  const key = secret();
  if (!key) return undefined;
  const payload: SignedEvaluation = {
    v: 1,
    sessionId,
    answerDigest: conciergeAnswerDigest(answers),
    issuedAt: now,
    source: evaluation.source,
    qualificationSummary: evaluation.extracted.qualificationSummary,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", key).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyConciergeEvaluation(token: string, sessionId: string, answers: ConciergeAnswers, now = Date.now()): SignedEvaluation | null {
  const key = secret();
  if (!key || token.length > 3000) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const expected = createHmac("sha256", key).update(encoded).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return null; }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedEvaluation;
    if (payload.v !== 1 || payload.sessionId !== sessionId || payload.answerDigest !== conciergeAnswerDigest(answers)) return null;
    if (!Number.isFinite(payload.issuedAt) || payload.issuedAt > now + 60_000 || now - payload.issuedAt > 24 * 60 * 60 * 1000) return null;
    if (!['deterministic', 'ai_assisted', 'fallback'].includes(payload.source) || typeof payload.qualificationSummary !== "string" || payload.qualificationSummary.length > 700) return null;
    return payload;
  } catch { return null; }
}
