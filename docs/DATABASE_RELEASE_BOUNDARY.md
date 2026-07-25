# Database release boundary

## Invariant

Vercel builds are application builds only.

`npm run vercel-build` runs `next build`. It does not import the migration
runner, connect to PostgreSQL for migration work, or execute schema SQL.
Preview, branch, and production builds therefore cannot apply migrations merely
because an application `DATABASE_URL` is present.

Database migrations are a separate operator action. Shared Neon environments
require the complete guarded command:

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

Supply the direct URL through the approved secret manager. Do not paste it into
release notes, shell history, logs, screenshots, or pull requests.

## Production identity contract

The production endpoint ID is a non-secret release identity copied
independently from the intended compute in the Neon provider console. It must
not be inferred from `DATABASE_URL_UNPOOLED` by the operator, CI job, or
migration runner and then reused as its own expected value.

Application traffic may continue using a pooled `DATABASE_URL`. Migration work
must use `DATABASE_URL_UNPOOLED`, whose hostname is the direct Neon compute
endpoint and therefore has no `-pooler` suffix.

Before connecting, the migration runner requires all of the following:

- `ALLOW_DATABASE_MIGRATIONS=true` exactly;
- `DATABASE_PROVIDER=neon` exactly;
- a valid exact `TARGET_DATABASE_ENVIRONMENT`;
- no `VERCEL_ENV=preview` and no declared runtime/target mismatch;
- a parseable `postgres:` or `postgresql:` direct URL;
- PostgreSQL TLS via `sslmode=require`, `verify-ca`, or `verify-full`;
- a Neon hostname ending in `.neon.tech`;
- a direct endpoint ID that exactly matches the independently supplied
  `EXPECTED_NEON_ENDPOINT_ID`;
- a URL database name that exactly matches `EXPECTED_DATABASE_NAME`; and
- a non-empty `EXPECTED_DATABASE_ROLE`.

Any pre-connect failure refuses without opening a connection. Error output
contains only safe target labels and variable names. It never prints the
database URL, host, endpoint ID, database name, role, password, or submitted
application data.

## Post-connect verification

After connecting, the runner performs one read-only identity query before the
first `BEGIN`. It verifies:

- `current_database()` exactly matches `EXPECTED_DATABASE_NAME`;
- `current_user` exactly matches `EXPECTED_DATABASE_ROLE`;
- `transaction_read_only` is `off`;
- `pg_is_in_recovery()` is false; and
- `public.crm_leads` exists with the required baseline application columns.

The baseline check inspects schema metadata only. It does not read or mutate lead
rows. No custom PostgreSQL configuration parameter, mutable application-data
marker, metadata table, or elevated Neon permission is required.

If connection or post-connect identity verification fails, no migration
transaction or migration SQL runs.

## Transaction and failure behavior

Each migration runs in its own PostgreSQL transaction:

1. `BEGIN`
2. execute one versioned migration file
3. `COMMIT`

A failure triggers `ROLLBACK`, reports only the migration filename, and stops.
The runner never silently continues to the next file. Migrations 001–008 retain
their existing idempotent SQL.

## Local development and test path

A disposable local database may be used only with an explicit loopback-only
override:

```bash
ALLOW_DATABASE_MIGRATIONS=true \
ALLOW_UNMARKED_LOCAL_DATABASE=true \
TARGET_DATABASE_ENVIRONMENT=test \
DATABASE_URL=postgresql://127.0.0.1:5432/local_test_database \
npm run db:migrate-crm
```

The override accepts only the exact lowercase string `true`, only
`development` or `test` targets, and only `localhost`, `127.0.0.1`, or `::1`.
It still verifies that the connection is writable and not in recovery before
the first migration transaction. It cannot be used for a remote, preview, or
production database.

## Controlled production release order

1. Confirm a current production backup or provider snapshot.
2. In the Neon provider console, verify the intended production compute and
   copy its endpoint ID independently.
3. Obtain the direct production URL from the approved secret manager and verify
   the expected database name and approved migration role.
4. Run the explicit guarded migration command from an approved operator
   environment, never from Vercel preview.
5. Perform a separate read-only schema verification.
6. Deploy the application code.
7. Run controlled smoke verification for persistence, founder notification,
   Reply-To, non-prospect handling, and protected CRM rendering.

Migration 008 is intentionally retained. Its three defaulted columns and two
indexes are additive, idempotent, backward-compatible, and safe for the prior
application code to ignore.

## Preview end-to-end testing

Every preview that needs database-backed E2E testing must have its own isolated
Neon database and compute endpoint. Independently record that preview endpoint
ID, use its direct unpooled URL, and apply migrations deliberately from a
trusted operator environment with `TARGET_DATABASE_ENVIRONMENT=preview` before
submitting preview test data.

A cloned database marker is not a release identity. Endpoint identity separates
the preview compute from production even when the preview database was created
from a production schema snapshot.

Do not run migrations from inside a Vercel preview environment:
`VERCEL_ENV=preview` always refuses, even when every other guard is present.
