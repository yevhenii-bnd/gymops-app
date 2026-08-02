import { loadWebConfig } from "./app-config.js";

describe("loadWebConfig", () => {
  it("uses Phase 1 local defaults", () => {
    expect(loadWebConfig({})).toEqual({
      apiOrigin: "http://localhost:4000",
      appVersion: "local"
    });
  });
});
