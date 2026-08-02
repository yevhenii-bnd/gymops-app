import { Hs256JwtTokenService, JwtVerificationError } from "./jwt-token-service.js";
import type { StaffIdentityResponse } from "../auth/auth.types.js";

const staff: StaffIdentityResponse = {
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

describe("Hs256JwtTokenService", () => {
  const previousAccessTtl = process.env["ACCESS_TOKEN_TTL_SECONDS"];

  afterEach(() => {
    if (previousAccessTtl === undefined) {
      delete process.env["ACCESS_TOKEN_TTL_SECONDS"];
    } else {
      process.env["ACCESS_TOKEN_TTL_SECONDS"] = previousAccessTtl;
    }
  });

  it("signs and verifies access token claims", () => {
    const service = new Hs256JwtTokenService();
    const signed = service.signAccessToken(staff);
    const claims = service.verifyAccessToken(signed.token);

    expect(claims).toEqual(
      expect.objectContaining({
        sub: staff.id,
        role: "GYM_ADMIN",
        organizationId: staff.organizationId,
        branchIds: ["22222222-2222-4222-8222-222222222222"],
        primaryBranchId: staff.primaryBranchId,
        tokenUse: "access",
        iss: "gymops-api",
        aud: "gymops-staff"
      })
    );
  });

  it("rejects tampered tokens", () => {
    const service = new Hs256JwtTokenService();
    const signed = service.signAccessToken(staff);
    const tampered = `${signed.token.slice(0, -1)}x`;

    expect(() => service.verifyAccessToken(tampered)).toThrow(new JwtVerificationError("invalid"));
  });

  it("rejects expired tokens", () => {
    process.env["ACCESS_TOKEN_TTL_SECONDS"] = "-1";
    const service = new Hs256JwtTokenService();
    const signed = service.signAccessToken(staff);

    expect(() => service.verifyAccessToken(signed.token)).toThrow(new JwtVerificationError("expired"));
  });

  it("rejects tokens with non-access claims", async () => {
    const service = new Hs256JwtTokenService();
    const token = await service.sign({
      sub: staff.id,
      role: staff.role,
      organizationId: staff.organizationId,
      branchIds: ["22222222-2222-4222-8222-222222222222"],
      primaryBranchId: staff.primaryBranchId,
      tokenUse: "refresh",
      iss: "gymops-api",
      aud: "gymops-staff",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    expect(() => service.verifyAccessToken(token)).toThrow(new JwtVerificationError("invalid"));
  });

  it("rejects tokens with the wrong audience", async () => {
    const service = new Hs256JwtTokenService();
    const token = await service.sign({
      sub: staff.id,
      role: staff.role,
      organizationId: staff.organizationId,
      branchIds: ["22222222-2222-4222-8222-222222222222"],
      primaryBranchId: staff.primaryBranchId,
      tokenUse: "access",
      iss: "gymops-api",
      aud: "unexpected-audience",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    });

    expect(() => service.verifyAccessToken(token)).toThrow(new JwtVerificationError("invalid"));
  });
});
