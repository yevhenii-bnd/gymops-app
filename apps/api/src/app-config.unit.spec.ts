import { loadApiConfig } from "./app-config.js";

describe("loadApiConfig", () => {
  it("uses Phase 1 local defaults", () => {
    expect(loadApiConfig({})).toEqual({
      nodeEnv: "development",
      appVersion: "local",
      defaultTimezone: "Europe/Kyiv"
    });
  });
});
