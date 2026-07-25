import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  MIGRATION_FILES,
  runMigrations,
} from "../scripts/database-migrations.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const productionEndpointId = "ep-production-release-1234";
const productionDatabaseName = "koinophobia";
const productionDatabaseRole = "release_owner";
const productionEnvironment = {
  ALLOW_DATABASE_MIGRATIONS: "true",
  DATABASE_PROVIDER: "neon",
  DATABASE_URL_UNPOOLED:
    `postgresql://${productionDatabaseRole}@${productionEndpointId}.us-east-2.aws.neon.tech/${productionDatabaseName}?sslmode=require`,
  EXPECTED_DATABASE_NAME: productionDatabaseName,
  EXPECTED_DATABASE_ROLE: productionDatabaseRole,
  EXPECTED_NEON_ENDPOINT_ID: productionEndpointId,
  TARGET_DATABASE_ENVIRONMENT: "production",
  VERCEL_ENV: "production",
};

function fakeClient({
  baselineColumnCount = 5,
  baselineTableExists = true,
  databaseName = productionDatabaseName,
  databaseRole = productionDatabaseRole,
  failIdentity = false,
  failOn = "",
  inRecovery = false,
  transactionReadOnly = "off",
} = {}) {
  const queries = [];
  return {
    queries,
    async end() {},
    async query(sql) {
      const text = typeof sql === "string" ? sql : sql.text;
      queries.push(text);
      if (text.includes("current_database()")) {
        if (failIdentity) {
          throw new Error("fixture identity query failure");
        }
        return {
          rows: [{
            baseline_column_count: baselineColumnCount,
            baseline_table_exists: baselineTableExists,
            database_name: databaseName,
            database_role: databaseRole,
            in_recovery: inRecovery,
            transaction_read_only: transactionReadOnly,
          }],
        };
      }
      if (failOn && text.includes(failOn)) {
        throw new Error("fixture database failure");
      }
      return { rows: [] };
    },
  };
}

function quietLogger() {
  return { log() {} };
}

function commandExists(command) {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

async function expectPreconnectRefusal(env, pattern) {
  let connected = false;
  await assert.rejects(
    runMigrations({
      connect: async () => {
        connected = true;
        return fakeClient();
      },
      env,
      logger: quietLogger(),
    }),
    pattern,
  );
  assert.equal(connected, false);
}

test("preview Vercel builds cannot execute migrations", async () => {
  assert.equal(packageJson.scripts["vercel-build"], "next build");
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      VERCEL_ENV: "preview",
    },
    /disabled inside Vercel preview environments/,
  );
});

test("ordinary production Vercel builds are application-only", () => {
  assert.equal(packageJson.scripts["vercel-build"], "next build");
  assert.doesNotMatch(packageJson.scripts["vercel-build"], /migrat|database|sql/i);
});

test("a direct production Neon endpoint succeeds with every required guard", async () => {
  const client = fakeClient();
  await runMigrations({
    connect: async () => client,
    env: productionEnvironment,
    logger: quietLogger(),
  });

  assert.match(client.queries[0], /current_database\(\)/);
  assert.match(client.queries[0], /current_user/);
  assert.match(client.queries[0], /transaction_read_only/);
  assert.match(client.queries[0], /pg_is_in_recovery/);
  assert.match(client.queries[0], /public\.crm_leads/);
  assert.equal(client.queries.filter((query) => query === "begin").length, 8);
  assert.equal(client.queries.filter((query) => query === "commit").length, 8);
  assert.equal(client.queries.filter((query) => query === "rollback").length, 0);
  assert.ok(client.queries.some((query) => query.includes("founder_packet")));
});

test("missing or vague approval refuses before connecting or executing SQL", async () => {
  for (const approval of [undefined, "", "1", "TRUE", "yes"]) {
    await expectPreconnectRefusal(
      {
        ...productionEnvironment,
        ALLOW_DATABASE_MIGRATIONS: approval,
      },
      /ALLOW_DATABASE_MIGRATIONS=true exactly/,
    );
  }
});

test("target and runtime mismatches refuse before connecting", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      TARGET_DATABASE_ENVIRONMENT: "",
    },
    /TARGET_DATABASE_ENVIRONMENT is required/,
  );
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      TARGET_DATABASE_ENVIRONMENT: "test",
    },
    /does not match the allowed runtime environment/,
  );
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      VERCEL_ENV: "branch",
    },
    /VERCEL_ENV is not a recognized migration environment/,
  );
});

test("the database provider, direct URL, protocol, and TLS are mandatory", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_PROVIDER: undefined,
    },
    /DATABASE_PROVIDER must be neon exactly/,
  );
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_URL_UNPOOLED: undefined,
    },
    /DATABASE_URL_UNPOOLED is required/,
  );
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_URL_UNPOOLED:
        `https://${productionEndpointId}.us-east-2.aws.neon.tech/${productionDatabaseName}?sslmode=require`,
    },
    /valid PostgreSQL URL/,
  );
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_URL_UNPOOLED:
        `postgresql://${productionDatabaseRole}@${productionEndpointId}.us-east-2.aws.neon.tech/${productionDatabaseName}`,
    },
    /must require PostgreSQL TLS/,
  );
});

test("a wrong Neon endpoint is refused before connecting", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_URL_UNPOOLED:
        `postgresql://${productionDatabaseRole}@ep-wrong-release-5678.us-east-2.aws.neon.tech/${productionDatabaseName}?sslmode=require`,
    },
    /does not match the approved Neon endpoint identity/,
  );
});

test("a preview endpoint is refused when production is expected", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_URL_UNPOOLED:
        `postgresql://${productionDatabaseRole}@ep-preview-branch-5678.us-east-2.aws.neon.tech/${productionDatabaseName}?sslmode=require`,
    },
    /does not match the approved Neon endpoint identity/,
  );
});

test("a pooled Neon hostname is refused before connecting", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_URL_UNPOOLED:
        `postgresql://${productionDatabaseRole}@${productionEndpointId}-pooler.us-east-2.aws.neon.tech/${productionDatabaseName}?sslmode=require`,
    },
    /direct Neon connection, not a pooled connection/,
  );
});

test("the expected endpoint ID must be supplied independently", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      EXPECTED_NEON_ENDPOINT_ID: undefined,
    },
    /EXPECTED_NEON_ENDPOINT_ID must be supplied independently/,
  );
});

test("the expected database name and migration role are mandatory", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      EXPECTED_DATABASE_NAME: undefined,
    },
    /EXPECTED_DATABASE_NAME is required/,
  );
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      EXPECTED_DATABASE_ROLE: undefined,
    },
    /EXPECTED_DATABASE_ROLE is required/,
  );
});

test("a URL database-name mismatch is refused before connecting", async () => {
  await expectPreconnectRefusal(
    {
      ...productionEnvironment,
      DATABASE_URL_UNPOOLED:
        `postgresql://${productionDatabaseRole}@${productionEndpointId}.us-east-2.aws.neon.tech/wrong_database?sslmode=require`,
    },
    /does not match the approved database name/,
  );
});

test("a connected database-name mismatch refuses before migration SQL", async () => {
  const client = fakeClient({ databaseName: "wrong_database" });
  await assert.rejects(
    runMigrations({
      connect: async () => client,
      env: productionEnvironment,
      logger: quietLogger(),
    }),
    /does not match the approved production database/,
  );
  assert.equal(client.queries.length, 1);
  assert.equal(client.queries.includes("begin"), false);
});

test("a connected role mismatch refuses before migration SQL", async () => {
  const client = fakeClient({ databaseRole: "application_role" });
  await assert.rejects(
    runMigrations({
      connect: async () => client,
      env: productionEnvironment,
      logger: quietLogger(),
    }),
    /does not match the approved production migration role/,
  );
  assert.equal(client.queries.length, 1);
  assert.equal(client.queries.includes("begin"), false);
});

test("read-only and recovery connections refuse before migration SQL", async () => {
  for (const client of [
    fakeClient({ transactionReadOnly: "on" }),
    fakeClient({ inRecovery: true }),
  ]) {
    await assert.rejects(
      runMigrations({
        connect: async () => client,
        env: productionEnvironment,
        logger: quietLogger(),
      }),
      /read-only|in recovery/,
    );
    assert.equal(client.queries.length, 1);
    assert.equal(client.queries.includes("begin"), false);
  }
});

test("an unexpected application baseline refuses before migration SQL", async () => {
  for (const client of [
    fakeClient({ baselineTableExists: false }),
    fakeClient({ baselineColumnCount: 4 }),
  ]) {
    await assert.rejects(
      runMigrations({
        connect: async () => client,
        env: productionEnvironment,
        logger: quietLogger(),
      }),
      /does not contain the expected application baseline/,
    );
    assert.equal(client.queries.length, 1);
    assert.equal(client.queries.includes("begin"), false);
  }
});

test("connection and identity failures expose no connection secrets", async () => {
  const privateEndpoint = "ep-private-fixture-9999";
  const privateHost = `${privateEndpoint}.us-east-2.aws.neon.tech`;
  const privateUrlFixture = new URL(
    `postgresql://${privateHost}/${productionDatabaseName}?sslmode=require`,
  );
  privateUrlFixture.username = productionDatabaseRole;
  privateUrlFixture.password = "fixture-credential";
  const privateUrl = privateUrlFixture.toString();
  const privateEnvironment = {
    ...productionEnvironment,
    DATABASE_URL_UNPOOLED: privateUrl,
    EXPECTED_NEON_ENDPOINT_ID: privateEndpoint,
  };

  await assert.rejects(
    runMigrations({
      connect: async () => {
        throw new Error(`connection failed at ${privateUrl}`);
      },
      env: privateEnvironment,
      logger: quietLogger(),
    }),
    (error) => {
      assert.match(error.message, /Unable to verify database identity/);
      assert.doesNotMatch(error.message, /fixture-credential|ep-private|neon\.tech|postgresql:\/\//);
      return true;
    },
  );

  const client = fakeClient({ failIdentity: true });
  await assert.rejects(
    runMigrations({
      connect: async () => client,
      env: privateEnvironment,
      logger: quietLogger(),
    }),
    (error) => {
      assert.match(error.message, /Unable to verify database identity/);
      assert.doesNotMatch(error.message, /fixture-credential|ep-private|neon\.tech|postgresql:\/\//);
      return true;
    },
  );
  assert.equal(client.queries.length, 1);
  assert.equal(client.queries.includes("begin"), false);
});

test("successful output exposes only the safe target and migration filenames", async () => {
  const messages = [];
  await runMigrations({
    connect: async () => fakeClient(),
    env: productionEnvironment,
    logger: { log: (message) => messages.push(message) },
  });

  const output = messages.join("\n");
  assert.match(output, /Database identity verified: production/);
  assert.match(output, /008_founder_sales_packet\.sql/);
  assert.doesNotMatch(
    output,
    /release_owner|ep-production|neon\.tech|koinophobia|postgresql:\/\//,
  );
});

test("test and development migrations allow an explicit loopback-only path", async () => {
  for (const targetEnvironment of ["test", "development"]) {
    const client = fakeClient({
      baselineColumnCount: 0,
      baselineTableExists: false,
      databaseName: "local_fixture",
      databaseRole: "local_role",
    });
    await runMigrations({
      connect: async () => client,
      env: {
        ALLOW_DATABASE_MIGRATIONS: "true",
        ALLOW_UNMARKED_LOCAL_DATABASE: "true",
        DATABASE_URL: "postgresql://127.0.0.1:5432/local_fixture",
        TARGET_DATABASE_ENVIRONMENT: targetEnvironment,
      },
      logger: quietLogger(),
    });
    assert.equal(client.queries.filter((query) => query === "commit").length, 8);
  }
});

test("the local override refuses remote and production targets", async () => {
  for (const env of [
    {
      ALLOW_DATABASE_MIGRATIONS: "true",
      ALLOW_UNMARKED_LOCAL_DATABASE: "true",
      DATABASE_URL: "postgresql://database.example/release",
      TARGET_DATABASE_ENVIRONMENT: "test",
    },
    {
      ALLOW_DATABASE_MIGRATIONS: "true",
      ALLOW_UNMARKED_LOCAL_DATABASE: "true",
      DATABASE_URL: "postgresql://127.0.0.1/release",
      TARGET_DATABASE_ENVIRONMENT: "production",
    },
  ]) {
    await expectPreconnectRefusal(env, /override/);
  }
});

test("migration failures roll back, identify the file, and stop", async () => {
  const client = fakeClient({ failOn: "crm_audits" });
  await assert.rejects(
    runMigrations({
      connect: async () => client,
      env: productionEnvironment,
      logger: quietLogger(),
    }),
    /003_crm_audits\.sql failed; execution stopped after rollback/,
  );

  assert.equal(client.queries.filter((query) => query === "rollback").length, 1);
  assert.equal(
    client.queries.some((query) => query.includes("audit_remediation")),
    false,
  );
});

test("the former custom database setting is not required anywhere", () => {
  const formerSetting = ["koinophobia", "environment"].join(".");
  const search = spawnSync(
    "git",
    ["grep", "-n", formerSetting, "--", ".", ":(exclude)outputs/**"],
    { encoding: "utf8" },
  );
  assert.equal(search.status, 1, search.stdout || search.stderr);
});

test("migration 008 keeps idempotent guards for all columns and indexes", () => {
  const migration = readFileSync("db/008_founder_sales_packet.sql", "utf8");
  for (const column of [
    "founder_packet jsonb",
    "is_prospect boolean",
    "non_prospect_reason text",
  ]) {
    assert.match(
      migration,
      new RegExp(`add column if not exists ${column}`, "i"),
    );
  }
  assert.equal(
    (migration.match(/create index if not exists/gi) ?? []).length,
    2,
  );
  assert.deepEqual(MIGRATION_FILES.slice(-1), ["008_founder_sales_packet.sql"]);
});

test(
  "a real PostgreSQL schema containing migration 008 is accepted unchanged",
  { skip: !commandExists("initdb") || !commandExists("pg_ctl") },
  async () => {
    const clusterDirectory = mkdtempSync(
      join(tmpdir(), "koinophobia-migration-test-"),
    );
    const port = await availablePort();
    let started = false;

    try {
      execFileSync(
        "initdb",
        ["-D", clusterDirectory, "-A", "trust", "--no-locale", "-E", "UTF8"],
        { stdio: "ignore" },
      );
      execFileSync(
        "pg_ctl",
        [
          "-D",
          clusterDirectory,
          "-o",
          `-F -p ${port} -h 127.0.0.1`,
          "-w",
          "start",
        ],
        { stdio: "ignore" },
      );
      started = true;

      const pg = await import("pg");
      const databaseUrl = `postgresql://127.0.0.1:${port}/postgres`;
      const env = {
        ALLOW_DATABASE_MIGRATIONS: "true",
        ALLOW_UNMARKED_LOCAL_DATABASE: "true",
        DATABASE_URL: databaseUrl,
        TARGET_DATABASE_ENVIRONMENT: "test",
      };
      await runMigrations({ env, logger: quietLogger() });

      const snapshotClient = new pg.default.Client({ connectionString: databaseUrl });
      await snapshotClient.connect();
      const beforeColumns = await snapshotClient.query(`
        select column_name, data_type, is_nullable, column_default
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'crm_leads'
          and column_name in ('founder_packet', 'is_prospect', 'non_prospect_reason')
        order by column_name
      `);
      const beforeIndexes = await snapshotClient.query(`
        select indexname, indexdef
        from pg_indexes
        where schemaname = 'public'
          and indexname in (
            'crm_leads_founder_disposition_idx',
            'crm_leads_prospect_status_idx'
          )
        order by indexname
      `);
      await snapshotClient.end();

      await runMigrations({ env, logger: quietLogger() });

      const verifyClient = new pg.default.Client({ connectionString: databaseUrl });
      await verifyClient.connect();
      const afterColumns = await verifyClient.query(`
        select column_name, data_type, is_nullable, column_default
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'crm_leads'
          and column_name in ('founder_packet', 'is_prospect', 'non_prospect_reason')
        order by column_name
      `);
      const afterIndexes = await verifyClient.query(`
        select indexname, indexdef
        from pg_indexes
        where schemaname = 'public'
          and indexname in (
            'crm_leads_founder_disposition_idx',
            'crm_leads_prospect_status_idx'
          )
        order by indexname
      `);
      await verifyClient.end();

      assert.equal(afterColumns.rows.length, 3);
      assert.equal(afterIndexes.rows.length, 2);
      assert.deepEqual(afterColumns.rows, beforeColumns.rows);
      assert.deepEqual(afterIndexes.rows, beforeIndexes.rows);
    } finally {
      if (started) {
        execFileSync(
          "pg_ctl",
          ["-D", clusterDirectory, "-m", "fast", "-w", "stop"],
          { stdio: "ignore" },
        );
      }
      rmSync(clusterDirectory, { force: true, recursive: true });
    }
  },
);
