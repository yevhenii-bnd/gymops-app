import { expect, test } from "@playwright/test";

test.describe("Phase 3 frontend shell", () => {
  test("renders the staff login route and API status panel", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "GymOps" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("System status")).toBeVisible();
  });

  test("renders the staff AppShell with role-aware navigation", async ({ page }) => {
    await page.goto("/app/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reception" })).toBeVisible();
    await expect(page.getByText("Gym Admin", { exact: true })).toBeVisible();
  });

  test("renders forbidden and not-found system routes", async ({ page }) => {
    await page.goto("/403");
    await expect(page.getByRole("heading", { name: "Forbidden" })).toBeVisible();

    await page.goto("/missing-route");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
