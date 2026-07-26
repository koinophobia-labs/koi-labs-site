type DatabaseEnvironment = {
  DATABASE_URL?: string;
  KOINOPHOBIA_DATABASE_ENVIRONMENT?: string;
  KOINOPHOBIA_PREVIEW_DATABASE_URL?: string;
};

/**
 * Vercel-managed database integrations can take precedence over branch-scoped
 * DATABASE_URL values. An exact, Preview-scoped environment marker and URL
 * keep E2E traffic isolated without changing the Production integration.
 */
export function applicationDatabaseUrl(
  environment: DatabaseEnvironment = process.env as DatabaseEnvironment,
) {
  if (environment.KOINOPHOBIA_DATABASE_ENVIRONMENT === "preview") {
    const previewUrl = environment.KOINOPHOBIA_PREVIEW_DATABASE_URL?.trim();
    if (previewUrl) return previewUrl;
  }
  return environment.DATABASE_URL?.trim() || "";
}

export function applicationDatabaseConfigured(
  environment: DatabaseEnvironment = process.env as DatabaseEnvironment,
) {
  return Boolean(applicationDatabaseUrl(environment));
}
