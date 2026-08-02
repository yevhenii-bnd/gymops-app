import type { StaffRole } from "@prisma/client";

import type { StaffIdentityResponse } from "./auth.types.js";

const ROLE_RANK: Record<StaffRole, number> = {
  SUPER_ADMIN: 3,
  GYM_ADMIN: 2,
  EMPLOYEE: 1
};

export function hasMinimumRole(role: StaffRole, minimumRole: StaffRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimumRole];
}

export function canAccessBranch(session: StaffIdentityResponse, branchId: string): boolean {
  if (session.role === "SUPER_ADMIN") {
    return true;
  }

  return session.branches.some((branch) => branch.id === branchId);
}
