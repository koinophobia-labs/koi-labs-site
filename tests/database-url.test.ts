import test from "node:test";
import assert from "node:assert/strict";
import {
  applicationDatabaseConfigured,
  applicationDatabaseUrl,
} from "../lib/database-url";

test("Preview uses the explicit isolated database override", () => {
  const environment = {
    VERCEL_ENV: "preview",
    DATABASE_URL: "postgresql://project-wide-integration/database",
    KOINOPHOBIA_PREVIEW_DATABASE_URL:
      "postgresql://isolated-preview/database",
  };
  assert.equal(
    applicationDatabaseUrl(environment),
    "postgresql://isolated-preview/database",
  );
  assert.equal(applicationDatabaseConfigured(environment), true);
});

test("Production cannot consume the Preview database override", () => {
  const environment = {
    VERCEL_ENV: "production",
    DATABASE_URL: "postgresql://production/database",
    KOINOPHOBIA_PREVIEW_DATABASE_URL:
      "postgresql://isolated-preview/database",
  };
  assert.equal(
    applicationDatabaseUrl(environment),
    "postgresql://production/database",
  );
});

test("branch variables cannot redirect local or undeclared environments", () => {
  const previewOverride = {
    KOINOPHOBIA_PREVIEW_DATABASE_URL:
      "postgresql://isolated-preview/database",
  };
  assert.equal(applicationDatabaseUrl(previewOverride), "");
  assert.equal(
    applicationDatabaseUrl({
      ...previewOverride,
      VERCEL_ENV: "development",
      DATABASE_URL: "postgresql://local/database",
    }),
    "postgresql://local/database",
  );
});
