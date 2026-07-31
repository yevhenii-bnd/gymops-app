import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 10_000,
  reporter: [["list"], ["html", { outputFolder: "../../playwright-report/api", open: "never" }]],
  use: {
    trace: "retain-on-failure"
  }
});
