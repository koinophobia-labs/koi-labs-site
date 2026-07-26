import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Session } from "next-auth";
import { NextRequest } from "next/server";
import { authConfig, SESSION_MAX_AGE_SECONDS } from "../auth";
import {
  hasAuthorizedGoogleCrmSession,
  hasCrmPageAccess,
  isCrmApiAuthorized,
} from "../lib/crm-access";
import {
  isAuthorizedCrmIdentity,
  isAuthorizedCrmSession,
  normalizeCrmEmail,
  parseCrmAllowedEmails,
} from "../lib/crm-authorization";

const approvedEmail = "approved-admin@example.invalid";
const allowedEmails = ` second-admin@example.invalid, ${approvedEmail.toUpperCase()} `;

function session(
  overrides: Partial<Session["user"]> = {},
): Session {
  return {
    expires: new Date(Date.now() + 60_000).toISOString(),
    user: {
      email: approvedEmail,
      crmProvider: "google",
      crmEmailVerified: true,
      crmAuthorized: true,
      ...overrides,
    },
  };
}

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("approved verified Google account is accepted", () => {
  assert.equal(
    isAuthorizedCrmIdentity(
      {
        provider: "google",
        email: approvedEmail,
        emailVerified: true,
      },
      allowedEmails,
    ),
    true,
  );
});

test("unapproved verified Google account is denied", () => {
  assert.equal(
    isAuthorizedCrmIdentity(
      {
        provider: "google",
        email: "not-approved@example.invalid",
        emailVerified: true,
      },
      allowedEmails,
    ),
    false,
  );
});

test("unverified Google account is denied", () => {
  assert.equal(
    isAuthorizedCrmIdentity(
      { provider: "google", email: approvedEmail, emailVerified: false },
      allowedEmails,
    ),
    false,
  );
});

test("missing email is denied", () => {
  assert.equal(
    isAuthorizedCrmIdentity(
      { provider: "google", emailVerified: true },
      allowedEmails,
    ),
    false,
  );
});

test("case and surrounding whitespace normalize to an exact allowlist match", () => {
  assert.equal(normalizeCrmEmail(`  ${approvedEmail.toUpperCase()}  `), approvedEmail);
  assert.deepEqual(
    [...parseCrmAllowedEmails(allowedEmails)].sort(),
    [approvedEmail, "second-admin@example.invalid"].sort(),
  );
  assert.equal(
    isAuthorizedCrmIdentity(
      {
        provider: "google",
        email: `  ${approvedEmail.toUpperCase()}  `,
        emailVerified: true,
      },
      allowedEmails,
    ),
    true,
  );
});

test("partial email and same-domain users are denied", () => {
  for (const email of [
    `prefix-${approvedEmail}`,
    "another-user@example.invalid",
    "approved-admin@example.invalid.attacker.invalid",
  ]) {
    assert.equal(
      isAuthorizedCrmIdentity(
        { provider: "google", email, emailVerified: true },
        allowedEmails,
      ),
      false,
    );
  }
});

test("an unsupported provider never inherits Google authorization", () => {
  assert.equal(
    isAuthorizedCrmIdentity(
      { provider: "apple", email: approvedEmail, emailVerified: true },
      allowedEmails,
    ),
    false,
  );
});

test("session authorization requires every verified Google claim and the live allowlist", () => {
  assert.equal(
    isAuthorizedCrmSession(
      {
        provider: "google",
        email: approvedEmail,
        emailVerified: true,
        authorized: true,
      },
      allowedEmails,
    ),
    true,
  );
  assert.equal(
    isAuthorizedCrmSession(
      {
        provider: "google",
        email: approvedEmail,
        emailVerified: true,
        authorized: false,
      },
      allowedEmails,
    ),
    false,
  );
});

test("Auth.js uses JWT sessions, a 12-hour lifetime, and protected session cookies", () => {
  assert.equal(authConfig.session?.strategy, "jwt");
  assert.equal(authConfig.session?.maxAge, 12 * 60 * 60);
  assert.equal(authConfig.jwt?.maxAge, SESSION_MAX_AGE_SECONDS);
  const options = authConfig.cookies?.sessionToken?.options;
  assert.equal(options?.httpOnly, true);
  assert.equal(options?.sameSite, "lax");
  assert.equal(options?.path, "/");
});

test("approved and unapproved Auth.js sessions are enforced by page and API guards", async () => {
  process.env.CRM_ALLOWED_EMAILS = allowedEmails;
  const request = new NextRequest("https://example.invalid/api/crm/leads");
  assert.equal(
    await hasAuthorizedGoogleCrmSession(async () => session()),
    true,
  );
  assert.equal(
    await isCrmApiAuthorized(request, async () => session()),
    true,
  );
  assert.equal(
    await isCrmApiAuthorized(request, async () =>
      session({ email: "not-approved@example.invalid" }),
    ),
    false,
  );
  assert.equal(
    await hasCrmPageAccess(async () => session()),
    true,
  );
  assert.equal(
    await hasCrmPageAccess(async () => null),
    false,
  );
});

test("retired secret endpoint and HMAC session code remain deleted", () => {
  assert.equal(
    existsSync(join(process.cwd(), "app/api/crm/login/route.ts")),
    false,
  );
  assert.equal(existsSync(join(process.cwd(), "lib/crm-auth.ts")), false);

  const access = readFileSync(
    join(process.cwd(), "lib/crm-access.ts"),
    "utf8",
  );
  assert.doesNotMatch(access, /CRM_ADMIN_SECRET|CRM_COOKIE|verifyCrmSession/);

  const conciergeSigning = readFileSync(
    join(process.cwd(), "lib/concierge/signing.ts"),
    "utf8",
  );
  assert.match(conciergeSigning, /CONCIERGE_SIGNING_SECRET/);
  assert.doesNotMatch(conciergeSigning, /CRM_ADMIN_SECRET/);
});

test("every private CRM surface contains its server-side authorization guard", () => {
  const apiRoutes = filesBelow(join(process.cwd(), "app/api/crm")).filter(
    (path) => path.endsWith("/route.ts"),
  );
  const pages = filesBelow(join(process.cwd(), "app/crm")).filter(
    (path) => path.endsWith("/page.tsx") && !path.endsWith("/login/page.tsx"),
  );

  assert.ok(apiRoutes.length > 0);
  assert.ok(pages.length > 0);
  for (const path of apiRoutes) {
    assert.match(readFileSync(path, "utf8"), /isCrmApiAuthorized/);
  }
  for (const path of pages) {
    assert.match(readFileSync(path, "utf8"), /requireCrmPageAccess/);
  }
});

test("login and OAuth error UI disclose no secret field, token, or configuration", () => {
  const source = readFileSync(
    join(process.cwd(), "app/crm/login/page.tsx"),
    "utf8",
  );
  assert.match(source, /Continue with Google/);
  assert.match(source, /approved Koinophobia Labs administrators/);
  assert.doesNotMatch(source, /type=["']password/);
  assert.doesNotMatch(source, /CRM_ADMIN_SECRET/);
  assert.doesNotMatch(source, /\/api\/crm\/login/);
  assert.doesNotMatch(source, /\{error\}/);
});

test("sign-out invalidates Auth.js and public intake remains outside the boundary", async () => {
  const authRoute = readFileSync(
    join(process.cwd(), "app/api/auth/[...nextauth]/route.ts"),
    "utf8",
  );
  const signOut = readFileSync(
    join(process.cwd(), "app/crm/CrmSignOut.tsx"),
    "utf8",
  );
  const intake = readFileSync(
    join(process.cwd(), "app/api/intake/route.ts"),
    "utf8",
  );
  assert.match(authRoute, /handlers/);
  assert.match(signOut, /Sign out/);
  assert.match(signOut, /await signOut/);
  assert.match(signOut, /redirectTo: "\/crm\/login"/);
  assert.doesNotMatch(signOut, /CRM_COOKIE|cookies\(\)/);
  assert.doesNotMatch(intake, /isCrmApiAuthorized|requireCrmPageAccess/);
  assert.equal(await hasCrmPageAccess(async () => null), false);

  const authSource = readFileSync(join(process.cwd(), "auth.ts"), "utf8");
  assert.match(authSource, /scope: "openid email profile"/);
  assert.doesNotMatch(
    authSource,
    /gmail|drive|calendar|contacts|access_type|offline/i,
  );
});
