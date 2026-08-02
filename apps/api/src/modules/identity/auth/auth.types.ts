import type { StaffRole, StaffStatus } from "@prisma/client";

export type StaffBranchResponse = {
  id: string;
  organizationId: string;
  name: string;
  isPrimary: boolean;
};

export type StaffIdentityResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  organizationId: string | null;
  status: StaffStatus;
  branches: StaffBranchResponse[];
  primaryBranchId: string | null;
};

export type AuthSessionResponse = {
  accessToken: string;
  expiresAt: string;
  csrfToken: string;
  staff: StaffIdentityResponse;
};

export type AuthRefreshResponse = {
  accessToken: string;
  expiresAt: string;
  csrfToken: string;
};

export type AccessTokenClaims = {
  sub: string;
  role: StaffRole;
  organizationId: string | null;
  branchIds: string[];
  primaryBranchId: string | null;
  tokenUse: "access";
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};
