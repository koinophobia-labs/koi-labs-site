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
const productionEnvironment = {
  ALLOW_DATABASE_MIGRATIONS: "true",
  DATABASE_URL: "postgresql://fixture.invalid/release",
  TARGET_DATABASE_ENVIRONMENT: "production",
  VERCEL_ENV: "production",
};

function fakeClient({
  environmentLabel = "production",
  failIdentity = false,
  failOn = "",
} = {}) {
  const queries = [];
  return {
    queries,
    async end() {},
    async query(sql) {
      const text = typeof sql === "string" ? sql : sql.text;
      queries.push(text);
      if (text.includes("current_setting")) {
        if (failIdentity) {
          throw new Error("fixture identity query failure");
        }
        return { rows: [{ environment_label: environmentLabel }] };
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

test("preview Vercel builds cannot execute migrations", async () => {
  assert.equal(packageJson.scripts["vercel-build"], "next build");

  let connected = false;
  await assert.rejects(
    runMigrations({
      connect: async () => {
        connected = true;
        return fakeClient();
      },
      env: {
        ...productionEnvironment,
        VERCEL_ENV: "preview",
      },
      logger: quietLogger(),
    }),
    /disabled inside Vercel preview environments/,
  );
  assert.equal(connected, false);
});

test("ordinary production Vercel builds are application-only", () => {
  assert.equal(packageJson.scripts["vercel-build"], "next build");
  assert.doesNotMatch(packageJson.scripts["vercel-build"], /migrat|database|sql/i);
});

test("explicit production migration succeeds with every required guard", async () => {
  const client = fakeClient();
  await runMigrations({
    connect: async () => client,
    env: productionEnvironment,
    logger: quietLogger(),
  });

  assert.match(client.queries[0], /current_setting/);
  assert.equal(client.queries.filter((query) => query === "begin").length, 8);
  assert.equal(client.queries.filter((query) => query === "commit").length, 8);
  assert.equal(client.queries.filter((query) => query === "rollback").length, 0);
  assert.ok(client.queries.some((query) => query.includes("founder_packet")));
});

test("missing or vague approval refuses before connecting or executing SQL", async () => {
  for (const approval of [undefined, "", "1", "TRUE", "yes"]) {
    let connected = false;
    await assert.rejects(
      runMigrations({
        connect: async () => {
          connected = true;
          return fakeClient();
        },
        env: {
          ...productionEnvironment,
          ALLOW_DATABASE_MIGRATIONS: approval,
        },
        logger: quietLogger(),
      }),
      /ALLOW_DATABASE_MIGRATIONS=true exactly/,
    );
    assert.equal(connected, false);
  }
});

test("a missing target refuses before connecting or executing SQL", async () => {
  let connected = false;
  await assert.rejects(
    runMigrations({
      connect: async () => {
        connected = true;
        return fakeClient();
      },
      env: {
        ...productionEnvironment,
        TARGET_DATABASE_ENVIRONMENT: "",
      },
      logger: quietLogger(),
    }),
    /TARGET_DATABASE_ENVIRONMENT is required/,
  );
  assert.equal(connected, false);
});

test("environment mismatch refuses before connecting or executing SQL", async () => {
  let connected = false;
  await assert.rejects(
    runMigrations({
      connect: async () => {
        connected = true;
        return fakeClient();
      },
      env: {
        ...productionEnvironment,
        TARGET_DATABASE_ENVIRONMENT: "test",
      },
      logger: quietLogger(),
    }),
    /does not match the allowed runtime environment/,
  );
  assert.equal(connected, false);
});

test("an unverifiable connection or identity stops before migration SQL", async () => {
  await assert.rejects(
    runMigrations({
      connect: async () => {
        throw new Error(
          "database connection failed at secret-host.invalid with credential do-not-log",
        );
      },
      env: productionEnvironment,
      logger: quietLogger(),
    }),
    (error) => {
      assert.match(error.message, /Unable to verify database identity/);
      assert.doesNotMatch(error.message, /password|secret-host/);
      return true;
    },
  );

  const client = fakeClient({ failIdentity: true });
  await assert.rejects(
    runMigrations({
      connect: async () => client,
      env: productionEnvironment,
      logger: quietLogger(),
    }),
    /Unable to verify database identity/,
  );
  assert.equal(client.queries.length, 1);
  assert.equal(client.queries.includes("begin"), false);
});

test("an unrecognized Vercel environment refuses before connecting", async () => {
  let connected = false;
  await assert.rejects(
    runMigrations({
      connect: async () => {
        connected = true;
        return fakeClient();
      },
      env: {
        ...productionEnvironment,
        VERCEL_ENV: "branch",
      },
      logger: quietLogger(),
    }),
    /VERCEL_ENV is not a recognized migration environment/,
  );
  assert.equal(connected, false);
});

test("database identity mismatch refuses before the first migration transaction", async () => {
  const client = fakeClient({ environmentLabel: "preview" });
  await assert.rejects(
    runMigrations({
      connect: async () => client,
      env: productionEnvironment,
      logger: quietLogger(),
    }),
    /labeled preview, not production/,
  );
  assert.equal(client.queries.length, 1);
  assert.match(client.queries[0], /current_setting/);
  assert.equal(client.queries.includes("begin"), false);
});

test("test and development migrations allow an explicit loopback-only override", async () => {
  for (const targetEnvironment of ["test", "development"]) {
    const client = fakeClient({ environmentLabel: null });
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

test("the unmarked local override refuses remote and production targets", async () => {
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
      /override/,
    );
    assert.equal(connected, false);
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

test("successful output exposes only safe labels and migration filenames", async () => {
  const messages = [];
  await runMigrations({
    connect: async () => fakeClient(),
    env: {
      ...productionEnvironment,
      DATABASE_URL: "postgresql://secret-host.invalid/release?credential=do-not-log",
    },
    logger: { log: (message) => messages.push(message) },
  });

  const output = messages.join("\n");
  assert.match(output, /Database identity verified: production/);
  assert.match(output, /008_founder_sales_packet\.sql/);
  assert.doesNotMatch(output, /password|secret-host|postgresql:\/\//);
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
  "an existing PostgreSQL schema containing migration 008 is accepted unchanged",
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
      const metadataClient = new pg.default.Client({ connectionString: databaseUrl });
      await metadataClient.connect();
      await metadataClient.query(
        `alter database postgres set "koinophobia.environment" to 'test'`,
      );
      await metadataClient.end();

      const env = {
        ALLOW_DATABASE_MIGRATIONS: "true",
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
