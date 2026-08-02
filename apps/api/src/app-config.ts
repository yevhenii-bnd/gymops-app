import { validateEnv, type EnvSchema } from "@gymops/contracts";

const apiEnvSchema = {
  NODE_ENV: { required: true, defaultValue: "development" },
  PORT: { required: true, defaultValue: "4000" },
  DATABASE_URL: { required: false },
  APP_VERSION: { required: true, defaultValue: "local" },
  COMMIT_SHA: { required: true, defaultValue: "local" },
  BUILD_TIME: { required: true, defaultValue: "local" },
  CORS_ORIGIN: { required: true, defaultValue: "http://localhost:3000" },
  DEFAULT_TIMEZONE: { required: true, defaultValue: "Europe/Kyiv" },
  AUTH_JWT_SECRET: { required: true, defaultValue: "local-dev-auth-secret-change-me" },
  ACCESS_TOKEN_TTL_SECONDS: { required: true, defaultValue: "900" },
  REFRESH_TOKEN_TTL_DAYS: { required: true, defaultValue: "30" },
  AUTH_COOKIE_SECURE: { required: true, defaultValue: "false" }
} satisfies EnvSchema;

function requiredValue(values: Record<string, string>, key: string): string {
  const value = values[key];

  if (value === undefined || value.length === 0) {
    throw new Error(`Missing API environment variable: ${key}`);
  }

  return value;
}

export function loadApiConfig(source: Record<string, string | undefined> = process.env) {
  const result = validateEnv(apiEnvSchema, source);

  if (result.missing.length > 0) {
    throw new Error(`Missing API environment variables: ${result.missing.join(", ")}`);
  }

  return {
    nodeEnv: requiredValue(result.values, "NODE_ENV"),
    port: Number(requiredValue(result.values, "PORT")),
    databaseUrl: result.values["DATABASE_URL"],
    appVersion: requiredValue(result.values, "APP_VERSION"),
    commitSha: requiredValue(result.values, "COMMIT_SHA"),
    buildTime: requiredValue(result.values, "BUILD_TIME"),
    corsOrigin: requiredValue(result.values, "CORS_ORIGIN"),
    defaultTimezone: requiredValue(result.values, "DEFAULT_TIMEZONE"),
    authJwtSecret: requiredValue(result.values, "AUTH_JWT_SECRET"),
    accessTokenTtlSeconds: Number(requiredValue(result.values, "ACCESS_TOKEN_TTL_SECONDS")),
    refreshTokenTtlDays: Number(requiredValue(result.values, "REFRESH_TOKEN_TTL_DAYS")),
    authCookieSecure: requiredValue(result.values, "AUTH_COOKIE_SECURE") === "true"
  };
}
