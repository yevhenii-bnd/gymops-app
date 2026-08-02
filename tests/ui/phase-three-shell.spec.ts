import { expect, test } from "@playwright/test";

const staffSession = {
  accessToken: "ui-test-access-token",
  csrfToken: "ui-test-csrf-token",
  staff: {
    id: "44444444-4444-4444-8444-444444444444",
    email: "gym.admin@gymops.local",
    firstName: "Dmytro",
    lastName: "Shevchenko",
    role: "GYM_ADMIN",
    organizationId: "11111111-1111-4111-8111-111111111111",
    status: "ACTIVE",
    branches: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        organizationId: "11111111-1111-4111-8111-111111111111",
        name: "Podil",
        isPrimary: true
      }
    ],
    primaryBranchId: "22222222-2222-4222-8222-222222222222"
  }
};

test.describe("Phase 3 frontend shell", () => {
  test("renders the staff login route and API status panel", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "GymOps" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("region", { name: "System status" })).toBeVisible();
  });

  test("renders the staff AppShell with role-aware navigation", async ({ page }) => {
    await page.route("http://localhost:4000/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(staffSession.staff)
      });
    });
    await page.addInitScript((session) => {
      window.localStorage.setItem("gymops_access_token", session.accessToken);
      window.localStorage.setItem("gymops_csrf_token", session.csrfToken);
      window.localStorage.setItem("gymops_staff", JSON.stringify(session.staff));
    }, staffSession);
    await page.goto("/app/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reception" })).toBeVisible();
    await expect(page.getByText("Dmytro Shevchenko", { exact: true })).toBeVisible();
  });

  test("renders forbidden and not-found system routes", async ({ page }) => {
    await page.goto("/403");
    await expect(page.getByRole("heading", { name: "Forbidden" })).toBeVisible();

    await page.goto("/missing-route");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
