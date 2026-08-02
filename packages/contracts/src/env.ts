export type EnvSchema = Record<string, { required: boolean; defaultValue?: string }>;

export type EnvValidationResult = {
  values: Record<string, string>;
  missing: string[];
};

export function validateEnv(
  schema: EnvSchema,
  source: Record<string, string | undefined> = process.env
): EnvValidationResult {
  const values: Record<string, string> = {};
  const missing: string[] = [];

  for (const [key, rule] of Object.entries(schema)) {
    const rawValue = source[key] ?? rule.defaultValue;

    if (rawValue === undefined || rawValue.length === 0) {
      if (rule.required) {
        missing.push(key);
      }
      continue;
    }

    values[key] = rawValue;
  }

  return { values, missing };
}
