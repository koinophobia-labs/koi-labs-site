# Database release boundary

## Invariant

Vercel builds are application builds only.

`npm run vercel-build` runs `next build`. It does not import the migration
runner, connect to PostgreSQL for migration work, or execute schema SQL.
Preview, branch, and production builds therefore cannot apply migrations merely
because `DATABASE_URL` is present.

Database migrations are a separate release action:

```bash
ALLOW_DATABASE_MIGRATIONS=true \
TARGET_DATABASE_ENVIRONMENT=production \
npm run db:migrate-crm
```

`ALLOW_DATABASE_MIGRATIONS` accepts only the exact lowercase string `true`.
`TARGET_DATABASE_ENVIRONMENT` must be exactly `development`, `preview`,
`production`, or `test`.

## Database identity

Every shared database must carry a non-secret PostgreSQL metadata label:

```sql
ALTER DATABASE database_name
  SET "koinophobia.environment" TO 'production';
```

Use `preview` for an isolated preview database and the corresponding label for
other shared environments. Configure this marker deliberately through an
approved database-administration session; it is not created or changed by the
migration runner.

Before the first migration transaction, the runner performs one read-only
identity query for `koinophobia.environment`. The connected label must exactly
match `TARGET_DATABASE_ENVIRONMENT`. Output contains only the safe environment
label and migration filenames—never credentials, connection strings, database
hosts, or submitted data.

## Guard behavior

The runner refuses before connecting when:

- `VERCEL_ENV=preview`;
- `ALLOW_DATABASE_MIGRATIONS` is absent or is anything other than `true`;
- `TARGET_DATABASE_ENVIRONMENT` is absent or unsupported;
- a declared Vercel runtime environment does not match the target;
- `DATABASE_URL` is absent;
- an unmarked-local override is malformed, targets production/preview, or uses
  a non-loopback host.

After connecting, the runner executes only the read-only identity query. It
refuses before `BEGIN` or migration SQL when the marker is absent, unrecognized,
does not match the target, or cannot be read.

Each migration runs in its own PostgreSQL transaction:

1. `BEGIN`
2. execute one versioned migration file
3. `COMMIT`

A failure triggers `ROLLBACK`, reports the migration filename, and stops.
The runner never silently continues to the next file.

## Local development and test path

An unmarked disposable local database may be used only with an explicit
loopback-only override:

```bash
ALLOW_DATABASE_MIGRATIONS=true \
ALLOW_UNMARKED_LOCAL_DATABASE=true \
TARGET_DATABASE_ENVIRONMENT=test \
DATABASE_URL=postgresql://127.0.0.1:5432/local_test_database \
npm run db:migrate-crm
```

The override accepts only the exact lowercase string `true`, only
`development` or `test` targets, and only `localhost`, `127.0.0.1`, or `::1`.
Shared development, preview, and production databases must use the database
metadata label instead.

## Release order

1. Confirm a current database backup.
2. Verify the intended database's non-secret environment identity.
3. Run the explicit guarded migration command.
4. Verify the expected schema and indexes.
5. Deploy the application code.
6. Run controlled smoke verification for persistence, founder notification,
   Reply-To, non-prospect handling, and protected CRM rendering.

Migration 008 is intentionally retained. Its three defaulted columns and two
indexes are additive, idempotent, backward-compatible, and safe for the prior
application code to ignore.

## Preview end-to-end testing

Every preview that needs database-backed E2E testing must have its own isolated
database. Label that database `preview`, apply migrations deliberately from a
trusted operator environment with `TARGET_DATABASE_ENVIRONMENT=preview`, and
only then submit test data through the preview.

Do not run migrations from inside a Vercel preview environment:
`VERCEL_ENV=preview` always refuses, even when the approval flag is present.
