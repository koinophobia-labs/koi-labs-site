import { createHmac, timingSafeEqual } from "crypto";

export const CRM_COOKIE = "koinophobia_crm_session";
function configuredSecret() { return process.env.CRM_ADMIN_SECRET || null; }
function signature(payload: string, secret: string) { return createHmac("sha256", secret).update(payload).digest("base64url"); }
export function createCrmSession(now = Date.now()) { const secret=configuredSecret();if(!secret)throw new Error("CRM_ADMIN_SECRET is not configured");const payload = Buffer.from(JSON.stringify({ exp: now + 12 * 60 * 60 * 1000 })).toString("base64url"); return `${payload}.${signature(payload,secret)}`; }
export function verifyCrmSession(token?: string) {
  const secret=configuredSecret();if (!token||!secret) return false; const [payload, supplied] = token.split("."); if (!payload || !supplied) return false;
  const expected = signature(payload,secret); const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); } catch { return false; }
}
export function validAdminSecret(candidate: string) { const secret=configuredSecret();if(!secret)return false;const a = Buffer.from(candidate); const b = Buffer.from(secret); return a.length === b.length && timingSafeEqual(a,b); }
