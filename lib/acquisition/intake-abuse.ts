import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

// SITE-01: window within which an identical (email + business + problem)
// resubmission folds onto the same lead instead of creating a duplicate.
export const INTAKE_DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

type IntakeContent = { email: string; businessName: string; biggestProblem: string };

/** SITE-01 — deterministic per-content dedupe key inside a time window. */
export function deriveContentIdempotencyKey(
  content: IntakeContent,
  nowMs: number,
  windowMs: number = INTAKE_DEDUPE_WINDOW_MS,
): string {
  const digest = createHash("sha256")
    .update([content.email.toLowerCase().trim(), content.businessName.trim(), content.biggestProblem.trim()].join(" "))
    .digest("hex");
  return `content:${digest}:${Math.floor(nowMs / windowMs)}`;
}

/**
 * SITE-01 — resolve the idempotency key for a submission. A concierge session or
 * an explicit idempotency-key header wins; otherwise a content-derived key is
 * used so the standard form no longer creates a fresh lead on every resubmit.
 */
export function resolveIntakeIdempotencyKey(opts: {
  conciergeSessionId?: string | null;
  suppliedKey?: string | null;
  content: IntakeContent;
  nowMs: number;
  windowMs?: number;
}): string {
  if (opts.conciergeSessionId) return `concierge:${opts.conciergeSessionId}`;
  const supplied = opts.suppliedKey?.trim();
  if (supplied && supplied.length > 0 && supplied.length <= 200) return supplied;
  return deriveContentIdempotencyKey(opts.content, opts.nowMs, opts.windowMs);
}

/**
 * SITE-01 — send the lead email once per lead: skip on a confirmed dedupe
 * (stored AND not newly created); still send when storage failed so a lead is
 * never silently lost.
 */
export function shouldSendLeadEmail(created: boolean, saved: boolean): boolean {
  return created || !saved;
}

/**
 * SITE-02 — key the rate limiter on the platform-trusted client IP. The
 * LEFTMOST x-forwarded-for token is client-supplied and rotatable; use x-real-ip
 * (Vercel sets it to the true client IP) or the RIGHTMOST xff entry (the proxy
 * appends the real connecting IP last).
 */
export function trustedClientKey(request: Pick<NextRequest, "headers">): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
