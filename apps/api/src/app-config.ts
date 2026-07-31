import { validateEnv, type EnvSchema } from "@gymops/contracts";

const apiEnvSchema = {
  NODE_ENV: { required: true, defaultValue: "development" },
  APP_VERSION: { required: true, defaultValue: "local" },
  DEFAULT_TIMEZONE: { required: true, defaultValue: "Europe/Kyiv" }
} satisfies EnvSchema;

export function loadApiConfig(source: NodeJS.ProcessEnv = process.env) {
  const result = validateEnv(apiEnvSchema, source);

  if (result.missing.length > 0) {
    throw new Error(`Missing API environment variables: ${result.missing.join(", ")}`);
  }

  return {
    nodeEnv: result.values["NODE_ENV"],
    appVersion: result.values["APP_VERSION"],
    defaultTimezone: result.values["DEFAULT_TIMEZONE"]
  };
}
