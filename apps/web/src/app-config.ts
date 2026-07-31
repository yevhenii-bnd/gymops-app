import { validateEnv, type EnvSchema } from "@gymops/contracts";

const webEnvSchema = {
  NEXT_PUBLIC_API_URL: { required: true, defaultValue: "http://localhost:4000/api/v1" },
  APP_VERSION: { required: true, defaultValue: "local" }
} satisfies EnvSchema;

export function loadWebConfig(source: NodeJS.ProcessEnv = process.env) {
  const result = validateEnv(webEnvSchema, source);

  if (result.missing.length > 0) {
    throw new Error(`Missing web environment variables: ${result.missing.join(", ")}`);
  }

  return {
    apiUrl: result.values["NEXT_PUBLIC_API_URL"],
    appVersion: result.values["APP_VERSION"]
  };
}
