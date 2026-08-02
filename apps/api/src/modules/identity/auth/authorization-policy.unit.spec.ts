import { canAccessBranch, hasMinimumRole } from "./authorization-policy.js";
import type { StaffIdentityResponse } from "./auth.types.js";

const gymAdminSession: StaffIdentityResponse = {
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
};

describe("authorization policy", () => {
  it("orders staff roles for API and route guards", () => {
    expect(hasMinimumRole("SUPER_ADMIN", "GYM_ADMIN")).toBe(true);
    expect(hasMinimumRole("GYM_ADMIN", "GYM_ADMIN")).toBe(true);
    expect(hasMinimumRole("EMPLOYEE", "GYM_ADMIN")).toBe(false);
  });

  it("allows only assigned branches for branch-scoped staff", () => {
    expect(canAccessBranch(gymAdminSession, "22222222-2222-4222-8222-222222222222")).toBe(true);
    expect(canAccessBranch(gymAdminSession, "99999999-9999-4999-8999-999999999999")).toBe(false);
  });

  it("allows super admins across branches", () => {
    expect(
      canAccessBranch(
        { ...gymAdminSession, role: "SUPER_ADMIN" },
        "99999999-9999-4999-8999-999999999999"
      )
    ).toBe(true);
  });
});
