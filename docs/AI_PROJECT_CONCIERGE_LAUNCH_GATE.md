# AI Project Concierge launch gate

Updated: 2026-07-18

## Release recommendation

**Code release candidate: PASS. Production launch: READY AFTER EXTERNAL GATES.**

The implementation, deterministic fallback, regression suite, production build, browser journeys, accessibility automation, and production dependency audit pass locally. The feature branch includes the current `origin/main`. No deployment was attempted or claimed because production deploys through the repository's `main`-branch Git integration only, and the production database migration plus live OpenAI and Resend smoke checks require approved credentials.

## Implemented scope

- Typed service, answer, evaluation, draft, signed-handoff, and CRM contracts.
- Adaptive seven-step public flow with back, edit, escape, refresh recovery, and standard-form paths.
- Auditable deterministic scoring with confidence bands, alternatives, manual review, and not-a-fit handling.
- Optional strict OpenAI Responses API enrichment that cannot change routing, price, recipients, persistence, or navigation.
- Complete no-key/provider-outage fallback.
- Homepage, services, intake, and audit entry points.
- Editable prefilled handoff into the existing intake with server recomputation and tamper resistance.
- JSONB CRM persistence migration, list qualification signals, and lead-detail context.
- Escaped text/HTML email notification extension and durable CRM lead link.
- Privacy-limited analytics events without raw visitor text or contact details.
- Honeypots, same-origin checks, durable/fallback rate limiting, payload limits, HMAC signing, and idempotency.
- Indexed route metadata and sitemap inclusion.
- Architecture, environment, operations, and test documentation.

## Baseline before integration

- `npm run test:crm` — 58/58 passed.
- `npm run test:commercial` — 6/6 passed.
- `npx tsc --noEmit` — passed.
- `npm run lint` — passed with one pre-existing warning in `lib/trendiHero.ts` for `_random` being unused.
- The first Turbopack attempt could not use a temporary out-of-worktree `node_modules` symlink. A real local `npm ci` was subsequently completed in the isolated worktree, removing that environment limitation.

## Final verification

| Gate | Result |
| --- | --- |
| `npm run test:concierge` | PASS — 35/35 |
| `npm run test:crm` | PASS — 58/58 |
| `npm run test:commercial` | PASS — 6/6 |
| Combined unit/integration assertions | PASS — 99/99 |
| `npm run test:dev-routing` after merging current `main` | PASS — 15/15 |
| `npm run test:concierge:e2e` against `next start` | PASS — 12/12 |
| `npm run test:release-qa` against `next start` | PASS — 50/50 |
| `npm run build` | PASS — Next.js 16.2.7 Turbopack, 38 static pages generated |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS — zero errors; same one pre-existing warning |
| `git diff --check` | PASS |
| `npm audit --omit=dev` | PASS — zero vulnerabilities |

The final dependency tree overrides Next.js's transitive PostCSS onto patched `8.5.15`; `npm ls postcss` reports the Next.js copy deduplicated to that version.

## Browser and accessibility evidence

- Website rebuild recommendation, editable intake prefill, and mocked persistence envelope.
- AI workflow recommendation from the services entry.
- Uncertain need routed to the existing Revenue Leak Audit handoff.
- Quick Fix Sprint on a 390 × 844 viewport.
- Conflicting scope routed to human review.
- AI disabled/provider unavailable path completed deterministically.
- Refresh recovery restored the active branch and step.
- No horizontal overflow on the mobile result.
- axe WCAG A/AA automation reported no concierge-result violations.
- Full-site release QA covered seven viewport widths from 320 through 1920 pixels, homepage and game overflow, link integrity, gameplay, privacy, reduced motion, media fallback, and homepage accessibility/contrast.

The release runner ignores only `/_vercel/insights/script.js` when testing a production build on localhost, because that Vercel-managed endpoint exists only after deployment. Other console errors remain failures. Manual VoiceOver/screen-reader verification is still recommended.

## Integration evidence and limits

- Standard intake compatibility: locally tested.
- Recommendation tampering: locally tested; final answers are revalidated and rescored on the server.
- CRM JSONB persistence: tested with mocked PostgreSQL queries and migration coverage.
- Email formatting: text/HTML payload, escaping, recommendation details, and CRM link tested with fixtures.
- AI behavior: no-key, provider error, timeout, malformed output, and valid strict output tested with mocks.
- Audit handoff: locally exercised in the browser and existing audit copy/route tests pass.
- Stripe: existing checkout/webhook tests pass; this feature does not change Stripe code and no live charge was attempted.

Not verified in this worktree:

- Applying `db/007_ai_project_concierge.sql` to the production database.
- A real OpenAI structured-output request with the production model/key.
- A real Resend delivery and reply-to check.
- An authenticated production CRM record inspection.
- A live Stripe checkout (unchanged and intentionally not charged during local QA).

## Production environment audit

The production Vercel environment-name audit on 2026-07-18 confirmed `DATABASE_URL`, the existing Resend variables, and the existing Stripe secrets are present and encrypted. Secret values and entropy were not read. The legacy CRM administrator secret referenced by the original audit was subsequently retired from application runtime use after production Google authentication acceptance.

Two requested production variables are not currently configured:

- `CONCIERGE_SIGNING_SECRET`
- `NEXT_PUBLIC_SITE_URL`

`OPENAI_API_KEY` is also absent, but it is optional and does not block the deterministic concierge.

## Required production configuration

- `DATABASE_URL`
- `CONCIERGE_SIGNING_SECRET` with at least 32 random characters
- Existing `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL`
- Existing Stripe variables used by the audit/checkout flow
- `NEXT_PUBLIC_SITE_URL=https://koinophobialabs.com`
- Optional `OPENAI_API_KEY`; the concierge remains complete without it
- Optional `CONCIERGE_OPENAI_MODEL` (default: `gpt-5.6-luna`)
- Optional `CONCIERGE_OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)

## Deployment and post-deploy gate

`vercel-build` runs `next build` only. Vercel preview, branch, and production
builds must never execute schema migrations based on an inherited
`DATABASE_URL`.

Migrations are a separate, guarded release action. The production database must
be identified by its independently supplied Neon compute endpoint ID, expected
database name, and approved migration role. Application traffic may use a pooled
URL, but the migration operator must supply the direct URL through the approved
secret manager. From an approved operator environment, run:

```bash
ALLOW_DATABASE_MIGRATIONS=true \
DATABASE_PROVIDER=neon \
TARGET_DATABASE_ENVIRONMENT=production \
EXPECTED_NEON_ENDPOINT_ID=ep-approved-production-id \
EXPECTED_DATABASE_NAME=approved_database_name \
EXPECTED_DATABASE_ROLE=approved_migration_role \
DATABASE_URL_UNPOOLED='postgresql://…direct-host…/approved_database_name?sslmode=require' \
npm run db:migrate-crm
```

The runner validates the direct Neon endpoint and URL database before
connecting, then verifies the connected database, role, writable status,
recovery status, and application baseline before the first migration
transaction. It applies each migration transactionally, rolls back and stops on
failure, and logs only safe environment labels and migration filenames. No
custom database setting or elevated Neon permission is required. See
`docs/DATABASE_RELEASE_BOUNDARY.md`.

Migrations `007` and `008` are additive and backward compatible with the prior
application. The new application is not safe to serve before its required
columns exist, so use this order:

1. Confirm backup.
2. Verify the intended database identity.
3. Run the explicit guarded migration command.
4. Verify schema.
5. Deploy application code.
6. Run controlled smoke verification.

The indexes use regular `CREATE INDEX`, so they can briefly block writes while
each index is built. Run the explicit migration during a low-write window if
the affected tables have grown materially.

After confirming the environment and database target, use the repository's PR workflow:

```bash
npm ci
npm run test:concierge
npm run test:crm
npm run test:migrations
npm run build
# Apply migrations deliberately with the guarded command before deployment.
# Push the release branch, open a PR to main, and merge after checks pass.
# The Vercel Git integration builds application code only.
```

Do not use a Vercel CLI production promotion for this repository. Its recorded deployment guardrail requires production to remain traceable to `main` through the Git integration.

Then complete one real-provider concierge recommendation, submit one controlled lead, confirm the notification email, inspect its CRM qualification envelope, and recheck the Revenue Leak Audit handoff. Do not enable public traffic if the migration or durable lead persistence fails; the deterministic recommendation itself may remain available without OpenAI.

## Remaining launch risks

- Draft PR #40 remains unmerged pending release-boundary review.
- The production database identity marker must be configured and verified
  before the next explicit production migration.
- `CONCIERGE_SIGNING_SECRET` and `NEXT_PUBLIC_SITE_URL` must be added to the Vercel production environment before merge.
- Production migration and provider/email smoke checks are the only blocking launch gates identified.
- Manual screen-reader review remains advisable even though automated accessibility checks pass.
