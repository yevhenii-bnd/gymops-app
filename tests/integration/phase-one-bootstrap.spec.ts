import { validateEnv } from "@gymops/contracts";
import { phaseOneSeed } from "@gymops/test-data";

describe("Phase 1 integration bootstrap", () => {
  it("can combine shared contracts with deterministic test data", () => {
    const result = validateEnv(
      {
        DEFAULT_TIMEZONE: { required: true }
      },
      {
        DEFAULT_TIMEZONE: phaseOneSeed.timezone
      }
    );

    expect(result).toEqual({
      values: { DEFAULT_TIMEZONE: "Europe/Kyiv" },
      missing: []
    });
  });
});
