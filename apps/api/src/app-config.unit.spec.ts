import { loadApiConfig } from "./app-config.js";

describe("loadApiConfig", () => {
  it("uses Phase 2 local defaults", () => {
    expect(loadApiConfig({})).toEqual({
      nodeEnv: "development",
      port: 4000,
      databaseUrl: undefined,
      appVersion: "local",
      commitSha: "local",
      buildTime: "local",
      corsOrigin: "http://localhost:3000",
      defaultTimezone: "Europe/Kyiv"
    });
  });
});
