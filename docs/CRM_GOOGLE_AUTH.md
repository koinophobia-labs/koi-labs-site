# Private CRM Google authentication

The Koinophobia Labs CRM uses Auth.js with the Google OpenID Connect provider,
JWT-backed sessions, and an exact administrator email allowlist. It does not
create application user accounts or authentication tables.

The only requested scopes are:

```text
openid email profile
```

No Gmail, Drive, Calendar, contacts, refresh-token, or offline-access scope is
requested. OAuth access and refresh tokens are not copied into the browser
session.

## Authorization boundary

Google authentication is necessary but not sufficient. A CRM session is
authorized only when:

1. The provider identifier is exactly `google`.
2. Google's `email_verified` claim is exactly `true`.
3. The profile contains an email.
4. The trimmed, lowercased email exactly matches one complete entry in
   `CRM_ALLOWED_EMAILS`.

Substring, same-domain, and similar-looking addresses are rejected. A future
Apple provider must be added explicitly and must still pass the same
administrator allowlist; adding a provider must never grant access by itself.

Every CRM page calls the shared server page guard before reading private data.
Every CRM API route calls the shared server API guard before reading, mutating,
or exporting private data. The tests enumerate these route files so a newly
added private surface fails CI if its guard is missing. Public intake and
concierge routes are outside this boundary and remain public.

Sessions use Auth.js' encrypted JWT strategy with a 12-hour maximum age.
Production session cookies are `HttpOnly`, `Secure`, path-scoped to `/`, and
`SameSite=Lax`, which supports the OAuth callback while retaining cross-site
request protection.

## Required environment variables

Configure these independently in each Vercel environment:

```text
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
CRM_ALLOWED_EMAILS
```

- `AUTH_SECRET`: at least 32 cryptographically random characters. Generate it
  locally with `npm exec auth secret` and store the value only in the password
  manager and Vercel.
- `AUTH_GOOGLE_ID`: Web application OAuth client ID.
- `AUTH_GOOGLE_SECRET`: Web application OAuth client secret.
- `CRM_ALLOWED_EMAILS`: comma-separated exact administrator emails. Add
  Blake's exact Google email in Vercel; never commit it.

Use different `AUTH_SECRET` values for preview and production. Store the Google
client secret and administrator email allowlist only in the Vercel environments
that need CRM access. Never put values in screenshots, logs, PR text, fixtures,
or committed environment files.

## Google Cloud configuration

1. Create or select the Koinophobia Labs Google Cloud project.
2. Open Google Auth Platform and configure the OAuth consent screen:
   - Use the Koinophobia Labs application name and support contact.
   - If the account belongs to a Google Workspace organization and only that
     organization should sign in, use the Internal audience.
   - Otherwise use the External audience in testing mode and add only the
     approved administrator as a test user until the consent configuration is
     ready for production.
   - Request only `openid`, `email`, and `profile`.
3. Create an OAuth client with application type **Web application**.
4. Add these production values:

   ```text
   Authorized JavaScript origin:
   https://koinophobialabs.com

   Authorized redirect URI:
   https://koinophobialabs.com/api/auth/callback/google
   ```

5. For local verification, add:

   ```text
   Authorized JavaScript origin:
   http://localhost:3000

   Authorized redirect URI:
   http://localhost:3000/api/auth/callback/google
   ```

   The non-interactive production-build smoke check for this PR used the exact
   local origin `http://localhost:3100` and exposed the callback
   `http://localhost:3100/api/auth/callback/google`. Register those `:3100`
   values as well only when reproducing the OAuth flow on that port. The smoke
   check used fictional configuration values and did not send credentials to
   Google.

6. After Vercel creates the review deployment, add its exact HTTPS origin and
   callback:

   ```text
   Authorized JavaScript origin:
   https://koinophobia-labs-git-agent-21a205-koinophobia999-8829s-projects.vercel.app

   Authorized redirect URI:
   https://koinophobia-labs-git-agent-21a205-koinophobia999-8829s-projects.vercel.app/api/auth/callback/google
   ```

   Google requires an exact redirect URI match, including scheme, host, path,
   case, and trailing slash. This branch alias was the exact host used for the
   PR's anonymous Preview checks and remains stable when Vercel replaces the
   underlying immutable deployment.

7. Put the client ID, client secret, preview `AUTH_SECRET`, and test-only
   allowlist in the Vercel Preview environment. Redeploy the preview so the new
   variables are included.
8. Put the production values in the Vercel Production environment only after
   preview acceptance. A production environment-variable change requires a new
   deployment.

References:

- [Auth.js Google provider](https://authjs.dev/getting-started/providers/google)
- [Auth.js deployment variables](https://authjs.dev/getting-started/deployment)
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Google web-server OAuth redirect rules](https://developers.google.com/identity/protocols/oauth2/web-server)

## Release and rollback

Production Google sign-in, protected CRM rendering, PDF export, sign-out, and
anonymous denial were verified before the legacy secret path was retired.
`/crm/login` exposes only **Continue with Google**.

The retired `/api/crm/login` endpoint, custom HMAC session code, legacy cookie,
and runtime dependence on `CRM_ADMIN_SECRET` must not be reintroduced. Signed
concierge handoffs use their dedicated `CONCIERGE_SIGNING_SECRET`.

For local-only HTTP validation, Auth.js also requires
`AUTH_TRUST_HOST=true`. Vercel hosts are inferred by Auth.js; do not treat this
local trust setting as an authorization control or add arbitrary production
hosts.

Release verification must cover:

1. The approved administrator can enter `/crm`.
2. Sign-out returns to `/crm/login` and invalidates the Auth.js session.
3. Unapproved identities are denied without revealing the allowlist.
4. Anonymous CRM pages redirect and private APIs return `401`.
5. Authenticated proposal and audit exports remain available.
6. Public intake and concierge routes remain unchanged.

If Google authentication fails after a release, roll back the application to
the last known-good deployment while retaining the current Auth.js and Google
OAuth environment variables. No database rollback is required for auth-only
changes.
