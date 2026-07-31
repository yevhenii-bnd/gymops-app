import { loadWebConfig } from "./app-config.js";

describe("loadWebConfig", () => {
  it("uses Phase 1 local defaults", () => {
    expect(loadWebConfig({})).toEqual({
      apiUrl: "http://localhost:4000/api/v1",
      appVersion: "local"
    });
  });
});
