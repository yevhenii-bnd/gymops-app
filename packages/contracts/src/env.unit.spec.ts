import { validateEnv, type EnvSchema } from "./env.js";

describe("validateEnv", () => {
  it("collects missing required variables and applies defaults", () => {
    const schema: EnvSchema = {
      REQUIRED_VALUE: { required: true },
      DEFAULTED_VALUE: { required: true, defaultValue: "local" }
    };

    const result = validateEnv(schema, {});

    expect(result.missing).toEqual(["REQUIRED_VALUE"]);
    expect(result.values).toEqual({ DEFAULTED_VALUE: "local" });
  });
});
