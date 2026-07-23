import test from "node:test";
import assert from "node:assert/strict";
import { isTrustedMutationRequest } from "../lib/security/origin";
import {
  resolveIntakeIdempotencyKey,
  shouldSendLeadEmail,
  trustedClientKey,
} from "../lib/acquisition/intake-abuse";

// Minimal NextRequest-like stub for the pieces these functions read.
function fakeReq(headers: Record<string, string>, nextUrl = { origin: "https://koinophobialabs.com", protocol: "https:" }) {
  return { headers: new Headers(headers), nextUrl } as never;
}

const content = { email: "Owner@Shop.com", businessName: "Shop Co", biggestProblem: "Slow site, no leads." };

// ── SITE-02a: origin trust ───────────────────────────────────────────────────
test("SITE-02: no Origin AND no sec-fetch-site is UNTRUSTED (scripted client)", () => {
  assert.equal(isTrustedMutationRequest(fakeReq({})), false);
});
test("SITE-02: same-origin sec-fetch-site is trusted", () => {
  assert.equal(isTrustedMutationRequest(fakeReq({ "sec-fetch-site": "same-origin" })), true);
});
test("SITE-02: cross-site sec-fetch-site is rejected", () => {
  assert.equal(isTrustedMutationRequest(fakeReq({ "sec-fetch-site": "cross-site" })), false);
});
test("SITE-02: a matching Origin is trusted, a foreign Origin is not", () => {
  assert.equal(isTrustedMutationRequest(fakeReq({ origin: "https://koinophobialabs.com" })), true);
  assert.equal(isTrustedMutationRequest(fakeReq({ origin: "https://evil.example" })), false);
});

// ── SITE-02b: rate-limit key ─────────────────────────────────────────────────
test("SITE-02: rate key prefers the platform-trusted x-real-ip", () => {
  assert.equal(trustedClientKey(fakeReq({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1, 9.9.9.9" })), "9.9.9.9");
});
test("SITE-02: rotating the LEFTMOST x-forwarded-for token cannot change the key", () => {
  const a = trustedClientKey(fakeReq({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" }));
  const b = trustedClientKey(fakeReq({ "x-forwarded-for": "2.2.2.2, 203.0.113.7" }));
  assert.equal(a, "203.0.113.7");
  assert.equal(a, b); // attacker-rotated left token is ignored; real client IP wins
});

// ── SITE-01a: deterministic dedupe key ───────────────────────────────────────
test("SITE-01: identical content in the same window yields the SAME idempotency key", () => {
  const now = 1_760_000_000_000;
  const k1 = resolveIntakeIdempotencyKey({ content, nowMs: now });
  const k2 = resolveIntakeIdempotencyKey({ content, nowMs: now + 5_000 });
  assert.equal(k1, k2);
  assert.match(k1, /^content:[a-f0-9]{64}:\d+$/);
});
test("SITE-01: different content yields a different key", () => {
  const now = 1_760_000_000_000;
  const k1 = resolveIntakeIdempotencyKey({ content, nowMs: now });
  const k2 = resolveIntakeIdempotencyKey({ content: { ...content, biggestProblem: "Different problem." }, nowMs: now });
  assert.notEqual(k1, k2);
});
test("SITE-01: a concierge session or explicit key overrides the content key", () => {
  const now = 1_760_000_000_000;
  assert.equal(resolveIntakeIdempotencyKey({ conciergeSessionId: "sess-1", content, nowMs: now }), "concierge:sess-1");
  assert.equal(resolveIntakeIdempotencyKey({ suppliedKey: "client-key-9", content, nowMs: now }), "client-key-9");
});

// ── SITE-01b: email gating ───────────────────────────────────────────────────
test("SITE-01: email sends on a new lead, is SKIPPED on a confirmed dedupe, sends on storage failure", () => {
  assert.equal(shouldSendLeadEmail(true, true), true);   // new lead
  assert.equal(shouldSendLeadEmail(false, true), false); // deduped -> skip (already emailed once)
  assert.equal(shouldSendLeadEmail(false, false), true); // storage failed -> still email, never lose a lead
});
