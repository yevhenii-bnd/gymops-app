import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  reporter: [["list"], ["html", { outputFolder: "../../playwright-report/ui", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        trace: "retain-on-failure"
      }
    }
  ]
});
