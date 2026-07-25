import fs from "node:fs";

export const MIGRATION_FILES = Object.freeze([
  "001_crm_leads.sql",
  "002_crm_proposals.sql",
  "003_crm_audits.sql",
  "004_audit_remediation.sql",
  "005_audit_release.sql",
  "006_stripe_payments.sql",
  "007_ai_project_concierge.sql",
  "008_founder_sales_packet.sql",
]);

const DATABASE_PROVIDER = "neon";
const ALLOWED_ENVIRONMENTS = new Set([
  "development",
  "preview",
  "production",
  "test",
]);
const LOCAL_ENVIRONMENTS = new Set(["development", "test"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const REQUIRED_SSL_MODES = new Set(["require", "verify-ca", "verify-full"]);
const NEON_ENDPOINT_PATTERN = /^ep-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUIRED_BASELINE_COLUMNS = Object.freeze([
  "dedupe_key",
  "email",
  "id",
  "source",
  "status",
]);

class MigrationSafetyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MigrationSafetyError";
    this.code = code;
  }
}

function refuse(code, message) {
  throw new MigrationSafetyError(code, message);
}

function parseDatabaseUrl(databaseUrl, errorCode, errorMessage) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      refuse(errorCode, errorMessage);
    }
    return parsed;
  } catch {
    refuse(errorCode, errorMessage);
  }
}

function parseDatabaseName(parsedUrl) {
  if (
    !parsedUrl.pathname.startsWith("/") ||
    parsedUrl.pathname.length === 1 ||
    parsedUrl.pathname.slice(1).includes("/")
  ) {
    refuse(
      "DATABASE_NAME_INVALID",
      "The direct migration URL must select exactly one database.",
    );
  }

  try {
    return decodeURIComponent(parsedUrl.pathname.slice(1));
  } catch {
    refuse(
      "DATABASE_NAME_INVALID",
      "The direct migration URL must contain a valid database name.",
    );
  }
}

function validateNeonMigrationUrl(databaseUrl, expectedEndpointId, expectedDatabaseName) {
  const parsed = parseDatabaseUrl(
    databaseUrl,
    "DATABASE_URL_UNPOOLED_INVALID",
    "DATABASE_URL_UNPOOLED must be a valid PostgreSQL URL.",
  );

  if (!REQUIRED_SSL_MODES.has(parsed.searchParams.get("sslmode") ?? "")) {
    refuse(
      "DATABASE_TLS_REQUIRED",
      "DATABASE_URL_UNPOOLED must require PostgreSQL TLS.",
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname.endsWith(".neon.tech")) {
    refuse(
      "DATABASE_PROVIDER_HOST_MISMATCH",
      "DATABASE_URL_UNPOOLED must use a Neon endpoint.",
    );
  }

  const hostEndpointId = hostname.split(".")[0] ?? "";
  if (hostEndpointId.endsWith("-pooler")) {
    refuse(
      "POOLED_DATABASE_URL_REFUSED",
      "Database migrations require a direct Neon connection, not a pooled connection.",
    );
  }
  if (!NEON_ENDPOINT_PATTERN.test(hostEndpointId)) {
    refuse(
      "NEON_ENDPOINT_INVALID",
      "The direct migration URL does not contain a valid Neon endpoint identity.",
    );
  }
  if (hostEndpointId !== expectedEndpointId) {
    refuse(
      "NEON_ENDPOINT_MISMATCH",
      "The direct migration URL does not match the approved Neon endpoint identity.",
    );
  }

  const urlDatabaseName = parseDatabaseName(parsed);
  if (urlDatabaseName !== expectedDatabaseName) {
    refuse(
      "DATABASE_NAME_MISMATCH",
      "The direct migration URL does not match the approved database name.",
    );
  }
}

export function resolveMigrationPlan(env = process.env) {
  if (env.VERCEL_ENV === "preview") {
    refuse(
      "VERCEL_PREVIEW_REFUSED",
      "Database migrations are disabled inside Vercel preview environments.",
    );
  }

  if (env.ALLOW_DATABASE_MIGRATIONS !== "true") {
    refuse(
      "APPROVAL_REQUIRED",
      "Database migrations require ALLOW_DATABASE_MIGRATIONS=true exactly.",
    );
  }

  const targetEnvironment = env.TARGET_DATABASE_ENVIRONMENT ?? "";
  if (!targetEnvironment) {
    refuse(
      "TARGET_REQUIRED",
      "TARGET_DATABASE_ENVIRONMENT is required.",
    );
  }
  if (!ALLOWED_ENVIRONMENTS.has(targetEnvironment)) {
    refuse(
      "TARGET_INVALID",
      "TARGET_DATABASE_ENVIRONMENT must be development, preview, production, or test.",
    );
  }

  const vercelEnvironment = env.VERCEL_ENV ?? "";
  if (vercelEnvironment && !ALLOWED_ENVIRONMENTS.has(vercelEnvironment)) {
    refuse(
      "RUNTIME_ENVIRONMENT_INVALID",
      "VERCEL_ENV is not a recognized migration environment.",
    );
  }
  if (
    vercelEnvironment &&
    vercelEnvironment !== targetEnvironment
  ) {
    refuse(
      "RUNTIME_TARGET_MISMATCH",
      `Migration target ${targetEnvironment} does not match the allowed runtime environment ${vercelEnvironment}.`,
    );
  }

  const localOverrideValue = env.ALLOW_UNMARKED_LOCAL_DATABASE ?? "";
  if (localOverrideValue && localOverrideValue !== "true") {
    refuse(
      "LOCAL_OVERRIDE_INVALID",
      "ALLOW_UNMARKED_LOCAL_DATABASE must be true exactly when used.",
    );
  }

  const allowUnmarkedLocalDatabase = localOverrideValue === "true";
  if (allowUnmarkedLocalDatabase) {
    if (!LOCAL_ENVIRONMENTS.has(targetEnvironment)) {
      refuse(
        "LOCAL_OVERRIDE_TARGET_REFUSED",
        "The unmarked local database override is restricted to development or test targets.",
      );
    }
    const databaseUrl = env.DATABASE_URL ?? "";
    if (!databaseUrl) {
      refuse(
        "LOCAL_DATABASE_URL_REQUIRED",
        "DATABASE_URL is required for the explicit local database override.",
      );
    }
    const parsed = parseDatabaseUrl(
      databaseUrl,
      "LOCAL_DATABASE_URL_INVALID",
      "The local database override requires a valid PostgreSQL URL.",
    );
    if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
      refuse(
        "LOCAL_OVERRIDE_HOST_REFUSED",
        "The unmarked local database override requires a loopback PostgreSQL host.",
      );
    }

    return {
      allowUnmarkedLocalDatabase,
      databaseUrl,
      targetEnvironment,
    };
  }

  if (env.DATABASE_PROVIDER !== DATABASE_PROVIDER) {
    refuse(
      "DATABASE_PROVIDER_REQUIRED",
      "DATABASE_PROVIDER must be neon exactly for shared database migrations.",
    );
  }

  const databaseUrl = env.DATABASE_URL_UNPOOLED ?? "";
  if (!databaseUrl) {
    refuse(
      "DATABASE_URL_UNPOOLED_REQUIRED",
      "DATABASE_URL_UNPOOLED is required for shared database migrations.",
    );
  }

  const expectedEndpointId = env.EXPECTED_NEON_ENDPOINT_ID ?? "";
  if (!expectedEndpointId) {
    refuse(
      "EXPECTED_NEON_ENDPOINT_ID_REQUIRED",
      "EXPECTED_NEON_ENDPOINT_ID must be supplied independently.",
    );
  }
  if (!NEON_ENDPOINT_PATTERN.test(expectedEndpointId)) {
    refuse(
      "EXPECTED_NEON_ENDPOINT_ID_INVALID",
      "EXPECTED_NEON_ENDPOINT_ID is not a valid Neon endpoint identity.",
    );
  }

  const expectedDatabaseName = env.EXPECTED_DATABASE_NAME ?? "";
  if (!expectedDatabaseName) {
    refuse(
      "EXPECTED_DATABASE_NAME_REQUIRED",
      "EXPECTED_DATABASE_NAME is required.",
    );
  }

  const expectedDatabaseRole = env.EXPECTED_DATABASE_ROLE ?? "";
  if (!expectedDatabaseRole) {
    refuse(
      "EXPECTED_DATABASE_ROLE_REQUIRED",
      "EXPECTED_DATABASE_ROLE is required.",
    );
  }

  validateNeonMigrationUrl(
    databaseUrl,
    expectedEndpointId,
    expectedDatabaseName,
  );

  return {
    allowUnmarkedLocalDatabase,
    databaseUrl,
    expectedDatabaseName,
    expectedDatabaseRole,
    targetEnvironment,
  };
}

async function connectPostgres(databaseUrl) {
  const pg = await import("pg");
  const client = new pg.default.Client({
    application_name: "koinophobia-explicit-migration",
    connectionString: databaseUrl,
  });
  await client.connect();
  return client;
}

function readMigration(name) {
  return fs.readFileSync(new URL(`../db/${name}`, import.meta.url), "utf8");
}

export async function verifyDatabaseIdentity(client, plan, logger = console) {
  let result;
  try {
    result = await client.query(
      `
        select
          current_database()::text as database_name,
          current_user::text as database_role,
          current_setting('transaction_read_only') as transaction_read_only,
          pg_is_in_recovery() as in_recovery,
          to_regclass('public.crm_leads') is not null as baseline_table_exists,
          (
            select count(*)::integer
            from information_schema.columns
            where table_schema = 'public'
              and table_name = 'crm_leads'
              and column_name = any($1::text[])
          ) as baseline_column_count
      `,
      [REQUIRED_BASELINE_COLUMNS],
    );
  } catch {
    refuse(
      "DATABASE_IDENTITY_UNAVAILABLE",
      `Unable to verify database identity for ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }

  const identity = result?.rows?.[0];
  if (!identity) {
    refuse(
      "DATABASE_IDENTITY_UNAVAILABLE",
      `Unable to verify database identity for ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }

  if (identity.transaction_read_only !== "off") {
    refuse(
      "DATABASE_READ_ONLY_REFUSED",
      `Connected database is read-only for ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }
  if (identity.in_recovery !== false) {
    refuse(
      "DATABASE_RECOVERY_REFUSED",
      `Connected database is in recovery for ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }

  if (plan.allowUnmarkedLocalDatabase) {
    logger.log(
      `Database identity verified: ${plan.targetEnvironment} (explicit loopback override).`,
    );
    return;
  }

  if (identity.database_name !== plan.expectedDatabaseName) {
    refuse(
      "CONNECTED_DATABASE_NAME_MISMATCH",
      `Connected database does not match the approved ${plan.targetEnvironment} database; no migrations were executed.`,
    );
  }
  if (identity.database_role !== plan.expectedDatabaseRole) {
    refuse(
      "CONNECTED_DATABASE_ROLE_MISMATCH",
      `Connected role does not match the approved ${plan.targetEnvironment} migration role; no migrations were executed.`,
    );
  }
  if (
    identity.baseline_table_exists !== true ||
    identity.baseline_column_count !== REQUIRED_BASELINE_COLUMNS.length
  ) {
    refuse(
      "DATABASE_BASELINE_MISMATCH",
      `Connected database does not contain the expected application baseline for ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }

  logger.log(`Database identity verified: ${plan.targetEnvironment}.`);
}

async function applyMigration(client, name, sql, logger) {
  try {
    await client.query("begin");
  } catch {
    refuse(
      "MIGRATION_TRANSACTION_UNAVAILABLE",
      `CRM migration ${name} could not start a transaction; execution stopped.`,
    );
  }

  try {
    await client.query(sql);
    await client.query("commit");
    logger.log(`CRM migration ${name} applied successfully in a transaction.`);
  } catch {
    try {
      await client.query("rollback");
    } catch {
      // The original migration failure remains the actionable result.
    }
    refuse(
      "MIGRATION_FAILED",
      `CRM migration ${name} failed; execution stopped after rollback.`,
    );
  }
}

export async function runMigrations({
  connect = connectPostgres,
  env = process.env,
  logger = console,
  loadMigration = readMigration,
} = {}) {
  const plan = resolveMigrationPlan(env);

  let client;
  try {
    client = await connect(plan.databaseUrl);
  } catch {
    refuse(
      "DATABASE_CONNECTION_FAILED",
      `Unable to verify database identity for ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }

  try {
    await verifyDatabaseIdentity(client, plan, logger);
    for (const name of MIGRATION_FILES) {
      let sql;
      try {
        sql = await loadMigration(name);
      } catch {
        refuse(
          "MIGRATION_FILE_UNAVAILABLE",
          `CRM migration ${name} could not be loaded; execution stopped before that migration.`,
        );
      }
      await applyMigration(client, name, sql, logger);
    }
  } finally {
    try {
      await client.end();
    } catch {
      // Closing a failed connection must not hide the guarded migration result.
    }
  }
}
