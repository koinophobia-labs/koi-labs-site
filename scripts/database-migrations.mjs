import fs from "node:fs";

export const DATABASE_ENVIRONMENT_SETTING = "koinophobia.environment";
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

const ALLOWED_ENVIRONMENTS = new Set([
  "development",
  "preview",
  "production",
  "test",
]);
const LOCAL_ENVIRONMENTS = new Set(["development", "test"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

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

function databaseHost(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      return null;
    }
    return parsed.hostname;
  } catch {
    return null;
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

  const targetEnvironment = env.TARGET_DATABASE_ENVIRONMENT?.trim() ?? "";
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

  const vercelEnvironment = env.VERCEL_ENV?.trim() ?? "";
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

  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  if (!databaseUrl) {
    refuse("DATABASE_URL_REQUIRED", "DATABASE_URL is required.");
  }

  const localOverrideValue = env.ALLOW_UNMARKED_LOCAL_DATABASE?.trim() ?? "";
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
    const host = databaseHost(databaseUrl);
    if (!host || !LOOPBACK_HOSTS.has(host)) {
      refuse(
        "LOCAL_OVERRIDE_HOST_REFUSED",
        "The unmarked local database override requires a loopback PostgreSQL host.",
      );
    }
  }

  return {
    allowUnmarkedLocalDatabase,
    databaseUrl,
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
      `select current_setting('${DATABASE_ENVIRONMENT_SETTING}', true) as environment_label`,
    );
  } catch {
    refuse(
      "DATABASE_IDENTITY_UNAVAILABLE",
      `Unable to verify database identity for ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }

  const environmentLabel = result?.rows?.[0]?.environment_label;
  if (!environmentLabel) {
    if (plan.allowUnmarkedLocalDatabase) {
      logger.log(
        `Database identity verified: ${plan.targetEnvironment} (explicit loopback override).`,
      );
      return;
    }
    refuse(
      "DATABASE_IDENTITY_MISSING",
      `Connected database has no ${DATABASE_ENVIRONMENT_SETTING} label; no migrations were executed.`,
    );
  }

  if (!ALLOWED_ENVIRONMENTS.has(environmentLabel)) {
    refuse(
      "DATABASE_IDENTITY_INVALID",
      `Connected database has an unrecognized environment label; no migrations were executed.`,
    );
  }
  if (environmentLabel !== plan.targetEnvironment) {
    refuse(
      "DATABASE_IDENTITY_MISMATCH",
      `Connected database is labeled ${environmentLabel}, not ${plan.targetEnvironment}; no migrations were executed.`,
    );
  }

  logger.log(`Database identity verified: ${environmentLabel}.`);
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
