import { validateEnv, type EnvSchema } from "@gymops/contracts";

const webEnvSchema = {
  NEXT_PUBLIC_API_ORIGIN: { required: true, defaultValue: "http://localhost:4000" },
  APP_VERSION: { required: true, defaultValue: "local" }
} satisfies EnvSchema;

function requiredValue(values: Record<string, string>, key: string): string {
  const value = values[key];

  if (value === undefined || value.length === 0) {
    throw new Error(`Missing web environment variable: ${key}`);
  }

  return value;
}

export function loadWebConfig(source: Record<string, string | undefined> = process.env) {
  const result = validateEnv(webEnvSchema, source);

  if (result.missing.length > 0) {
    throw new Error(`Missing web environment variables: ${result.missing.join(", ")}`);
  }

  return {
    apiOrigin: requiredValue(result.values, "NEXT_PUBLIC_API_ORIGIN"),
    appVersion: requiredValue(result.values, "APP_VERSION")
  };
}
