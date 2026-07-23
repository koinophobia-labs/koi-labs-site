// Light server-side redaction of obviously-sensitive tokens in visitor free-text.
//
// SITE-03: visitor free-text (biggestProblem, notes, concierge answers) flows
// verbatim into crm_leads and the lead email. A visitor who ignores the UI
// warning can paste a card number, SSN, or API key into those fields, and it is
// then persisted and mailed. This masks the obvious secret/card shapes BEFORE
// persistence and email.
//
// It is deliberately conservative. It targets high-signal patterns — Luhn-valid
// 13–19 digit card runs, formatted SSNs, known key prefixes (sk-…, AWS AKIA…,
// Stripe/GitHub tokens), bearer tokens, and PEM private-key blocks — so ordinary
// business prose (revenue figures, dates, phone numbers, order counts, percentages)
// is left untouched. It is NOT a DLP engine and is not claimed to catch everything;
// the UI warning remains the first line of defence. Pure and dependency-free on
// purpose, so it is unit-testable in isolation.

// A run of 13–19 digits, optionally separated by single spaces or hyphens, not
// bordered by another digit. Validated with Luhn before masking so ordinary long
// numbers are not blindly nuked.
const CARD_CANDIDATE = /(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)/g;
// Formatted US SSN: 3-2-4 grouped by a hyphen or space.
const SSN = /(?<!\d)\d{3}[ -]\d{2}[ -]\d{4}(?!\d)/g;
// OpenAI / Anthropic style: sk-…, sk-ant-…, sk-proj-….
const OPENAI_ANTHROPIC_KEY = /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{16,}\b/g;
// Stripe-style secret/restricted/publishable keys: sk_live_…, rk_test_…, pk_live_….
const STRIPE_KEY = /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}\b/g;
// GitHub personal-access / app tokens.
const GITHUB_TOKEN = /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b/g;
// AWS access key IDs (long-term AKIA…, temporary ASIA…): prefix + 16 base32 chars.
const AWS_ACCESS_KEY = /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g;
// HTTP bearer tokens — keep the scheme word, drop the credential.
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*/gi;
// PEM private-key blocks, and a bare header for truncated pastes.
const PRIVATE_KEY_BLOCK = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9]+ )*PRIVATE KEY-----/g;
const PRIVATE_KEY_HEADER = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/g;

/** Luhn checksum over a pure-digit string. */
function luhnValid(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = digits.charCodeAt(index) - 48; // "0" is char code 48
    if (value < 0 || value > 9) return false;
    if (alternate) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Mask obvious secret/card/PII token shapes in a single string. Returns the
 * input unchanged when nothing matches. Non-string input is returned as-is.
 */
export function redactSecrets(input: string): string {
  if (typeof input !== "string" || input.length === 0) return input;
  let out = input;
  // PEM blocks first (multi-line), then a bare unterminated header.
  out = out.replace(PRIVATE_KEY_BLOCK, "[redacted-private-key]");
  out = out.replace(PRIVATE_KEY_HEADER, "[redacted-private-key]");
  // Keyed secrets before the card scan so their embedded digits are already gone.
  out = out.replace(BEARER, "Bearer [redacted-token]");
  out = out.replace(OPENAI_ANTHROPIC_KEY, "[redacted-api-key]");
  out = out.replace(STRIPE_KEY, "[redacted-api-key]");
  out = out.replace(GITHUB_TOKEN, "[redacted-api-key]");
  out = out.replace(AWS_ACCESS_KEY, "[redacted-aws-key]");
  // Formatted SSNs (unambiguous once grouped) before the card scan.
  out = out.replace(SSN, "[redacted-ssn]");
  // Credit cards: only mask candidate runs that actually pass Luhn.
  out = out.replace(CARD_CANDIDATE, (match) => {
    const digits = match.replace(/[ -]/g, "");
    if (digits.length < 13 || digits.length > 19) return match;
    return luhnValid(digits) ? "[redacted-card]" : match;
  });
  return out;
}
