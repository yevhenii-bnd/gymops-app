import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 10_000,
  reporter: [["list"], ["html", { outputFolder: "../../playwright-report/ui", open: "never" }]],
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
