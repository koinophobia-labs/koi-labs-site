type DatabaseEnvironment = {
  DATABASE_URL?: string;
  KOINOPHOBIA_PREVIEW_DATABASE_URL?: string;
  VERCEL_ENV?: string;
};

/**
 * Vercel-managed database integrations can take precedence over branch-scoped
 * DATABASE_URL values. A Preview-only override keeps E2E traffic on its
 * isolated database without changing the Production integration binding.
 */
export function applicationDatabaseUrl(
  environment: DatabaseEnvironment = process.env as DatabaseEnvironment,
) {
  if (environment.VERCEL_ENV === "preview") {
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
