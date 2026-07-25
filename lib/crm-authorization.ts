export const CRM_GOOGLE_PROVIDER = "google";

export type CrmIdentity = {
  provider?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
};

export type CrmSessionIdentity = CrmIdentity & {
  authorized?: boolean | null;
};

export function normalizeCrmEmail(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function parseCrmAllowedEmails(value = process.env.CRM_ALLOWED_EMAILS) {
  return new Set(
    (value || "")
      .split(",")
      .map(normalizeCrmEmail)
      .filter(Boolean),
  );
}

export function isAllowedCrmEmail(
  email: string | null | undefined,
  allowlist = process.env.CRM_ALLOWED_EMAILS,
) {
  const normalized = normalizeCrmEmail(email);
  return normalized !== "" && parseCrmAllowedEmails(allowlist).has(normalized);
}

export function isAuthorizedCrmIdentity(
  identity: CrmIdentity,
  allowlist = process.env.CRM_ALLOWED_EMAILS,
) {
  return (
    identity.provider === CRM_GOOGLE_PROVIDER &&
    identity.emailVerified === true &&
    isAllowedCrmEmail(identity.email, allowlist)
  );
}

export function isAuthorizedCrmSession(
  identity: CrmSessionIdentity | null | undefined,
  allowlist = process.env.CRM_ALLOWED_EMAILS,
) {
  return (
    identity?.authorized === true &&
    isAuthorizedCrmIdentity(identity, allowlist)
  );
}
