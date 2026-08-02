import { createHash, randomBytes, randomUUID } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import type { Prisma, RefreshToken, StaffUser } from "@prisma/client";
import type { Request, Response } from "express";

import { loadApiConfig } from "../../../app-config.js";
import { PrismaService } from "../../database/prisma.service.js";
import type { PasswordHasher } from "../security/password-hasher.js";
import { Hs256JwtTokenService, JwtVerificationError } from "../security/jwt-token-service.js";
import {
  AUTH_COOKIE_PATH,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  LOCKOUT_MINUTES,
  MAX_FAILED_LOGIN_ATTEMPTS,
  REFRESH_COOKIE_NAME
} from "./auth.constants.js";
import {
  csrfFailed,
  invalidCredentials,
  lockedOut,
  refreshExpired,
  refreshInvalid,
  refreshMissing,
  refreshReused,
  sessionStale,
  tokenExpired,
  tokenInvalid,
  tokenMissing
} from "./auth.errors.js";
import type { AuthRefreshResponse, AuthSessionResponse, StaffIdentityResponse } from "./auth.types.js";
import { AuthAuditService } from "./auth-audit.service.js";
import { parseCookies, serializeCookie, serializeExpiredCookie } from "./cookie-utils.js";
import type { StaffLoginDto } from "./staff-login.dto.js";

type DbClient = PrismaService | Prisma.TransactionClient;

type StaffWithBranches = Prisma.StaffUserGetPayload<{
  include: {
    branchAssignments: {
      include: {
        branch: true;
      };
    };
  };
}>;

type RefreshTokenWithStaff = RefreshToken & {
  staffUser: StaffUser | null;
};

@Injectable()
export class AuthService {
  private readonly config = loadApiConfig();

  constructor(
    private readonly prisma: PrismaService,
    @Inject("PasswordHasher") private readonly passwordHasher: PasswordHasher,
    private readonly jwtTokens: Hs256JwtTokenService,
    private readonly audit: AuthAuditService
  ) {}

  async login(dto: StaffLoginDto, request: Request, response: Response): Promise<AuthSessionResponse> {
    const emailNormalized = dto.email.trim().toLowerCase();
    const staff = await this.findStaffByEmail(emailNormalized);

    if (staff === null || staff.status === "DEACTIVATED") {
      throw invalidCredentials();
    }

    if (this.isLocked(staff)) {
      throw lockedOut();
    }

    if (staff.status !== "ACTIVE") {
      throw invalidCredentials();
    }

    const passwordMatches = await this.passwordHasher.verify(dto.password, staff.passwordHash);
    if (!passwordMatches) {
      await this.recordFailedLogin(staff);
      throw invalidCredentials();
    }

    await this.prisma.staffUser.update({
      where: { id: staff.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    const session = await this.buildStaffSession(this.prisma, staff.id);
    const refresh = await this.issueRefreshToken(this.prisma, staff.id, request);
    const authResponse = this.createAuthResponse(session, refresh.csrfToken);
    this.setAuthCookies(response, refresh.rawToken, refresh.csrfToken);

    await this.audit.recordStaffEvent({
      organizationId: session.organizationId,
      branchId: session.primaryBranchId,
      staffUserId: session.id,
      staffRole: session.role,
      action: "STAFF_LOGIN_SUCCEEDED",
      entityId: refresh.id,
      request
    });

    return authResponse;
  }

  async me(authorizationHeader: string | undefined): Promise<StaffIdentityResponse> {
    const token = this.extractBearerToken(authorizationHeader);
    const claims = this.verifyAccessToken(token);

    return this.buildStaffSession(this.prisma, claims.sub);
  }

  async refresh(request: Request, response: Response): Promise<AuthRefreshResponse> {
    const refreshToken = this.requireRefreshTokenWithCsrf(request);
    const tokenHash = this.hashRefreshToken(refreshToken);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { staffUser: true }
      });

      if (current === null || current.staffUserId === null || current.staffUser === null) {
        throw refreshInvalid();
      }

      if (current.revokedAt !== null) {
        if (current.replacedByTokenId !== null) {
          await tx.refreshToken.updateMany({
            where: {
              familyId: current.familyId,
              revokedAt: null
            },
            data: {
              revokedAt: now,
              revokeReason: "REUSED"
            }
          });
          throw refreshReused();
        }

        throw refreshInvalid();
      }

      if (current.expiresAt <= now) {
        await tx.refreshToken.update({
          where: { id: current.id },
          data: {
            revokedAt: now,
            revokeReason: "EXPIRED"
          }
        });
        throw refreshExpired();
      }

      const session = await this.buildStaffSession(tx, current.staffUserId);
      const next = await this.issueRefreshToken(tx, current.staffUserId, request, current.familyId);

      await tx.refreshToken.update({
        where: { id: current.id },
        data: {
          revokedAt: now,
          revokeReason: "ROTATED",
          replacedByTokenId: next.id
        }
      });

      return { session, next, current };
    });

    const authResponse = this.createAccessTokenResponse(result.session, result.next.csrfToken);
    this.setAuthCookies(response, result.next.rawToken, result.next.csrfToken);

    await this.audit.recordStaffEvent({
      organizationId: result.session.organizationId,
      branchId: result.session.primaryBranchId,
      staffUserId: result.session.id,
      staffRole: result.session.role,
      action: "STAFF_REFRESH_ROTATED",
      entityId: result.next.id,
      request
    });

    return authResponse;
  }

  async logout(request: Request, response: Response): Promise<void> {
    const cookies = parseCookies(request.headers.cookie);
    const rawRefreshToken = cookies[REFRESH_COOKIE_NAME];

    if (rawRefreshToken !== undefined) {
      this.assertCsrf(request, cookies);

      const existing = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: this.hashRefreshToken(rawRefreshToken) },
        include: { staffUser: true }
      });

      if (existing !== null && existing.revokedAt === null) {
        await this.prisma.refreshToken.update({
          where: { id: existing.id },
          data: {
            revokedAt: new Date(),
            revokeReason: "LOGOUT"
          }
        });

        if (existing.staffUser !== null) {
          await this.auditLogout(existing, request);
        }
      }
    }

    this.clearAuthCookies(response);
  }

  private async findStaffByEmail(emailNormalized: string): Promise<StaffWithBranches | null> {
    return this.prisma.staffUser.findUnique({
      where: { emailNormalized },
      include: {
        branchAssignments: {
          where: {
            revokedAt: null,
            branch: { status: "ACTIVE" }
          },
          include: { branch: true },
          orderBy: { assignedAt: "asc" }
        }
      }
    });
  }

  private async buildStaffSession(db: DbClient, staffUserId: string): Promise<StaffIdentityResponse> {
    const staff = await db.staffUser.findUnique({
      where: { id: staffUserId },
      include: {
        branchAssignments: {
          where: {
            revokedAt: null,
            branch: { status: "ACTIVE" }
          },
          include: { branch: true },
          orderBy: { assignedAt: "asc" }
        }
      }
    });

    if (staff === null || staff.status !== "ACTIVE" || this.isLocked(staff)) {
      throw sessionStale();
    }

    const branches = staff.branchAssignments.map((assignment) => ({
      id: assignment.branchId,
      organizationId: assignment.organizationId,
      name: assignment.branch.name,
      isPrimary: assignment.isPrimary
    }));
    const primaryBranch = branches.find((branch) => branch.isPrimary) ?? branches[0] ?? null;

    return {
      id: staff.id,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      organizationId: staff.organizationId,
      status: staff.status,
      branches,
      primaryBranchId: primaryBranch?.id ?? null
    };
  }

  private async recordFailedLogin(staff: StaffWithBranches): Promise<void> {
    const failedLoginCount = staff.failedLoginCount + 1;
    const lockedUntil =
      failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

    await this.prisma.staffUser.update({
      where: { id: staff.id },
      data: {
        failedLoginCount,
        lockedUntil
      }
    });
  }

  private async issueRefreshToken(
    db: DbClient,
    staffUserId: string,
    request: Request,
    familyId: string = randomUUID()
  ): Promise<{ id: string; rawToken: string; csrfToken: string }> {
    const rawToken = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
    const token = await db.refreshToken.create({
      data: {
        staffUserId,
        tokenHash: this.hashRefreshToken(rawToken),
        familyId,
        expiresAt,
        ipHash: this.hashNullable(this.resolveIp(request)),
        userAgent: request.header("user-agent") ?? null
      }
    });

    return {
      id: token.id,
      rawToken,
      csrfToken
    };
  }

  private createAuthResponse(
    staff: StaffIdentityResponse,
    csrfToken: string
  ): AuthSessionResponse {
    const access = this.jwtTokens.signAccessToken(staff);

    return {
      accessToken: access.token,
      expiresAt: access.expiresAt.toISOString(),
      csrfToken,
      staff
    };
  }

  private createAccessTokenResponse(
    staff: StaffIdentityResponse,
    csrfToken: string
  ): AuthRefreshResponse {
    const access = this.jwtTokens.signAccessToken(staff);

    return {
      accessToken: access.token,
      expiresAt: access.expiresAt.toISOString(),
      csrfToken
    };
  }

  private extractBearerToken(authorizationHeader: string | undefined): string {
    if (authorizationHeader === undefined) {
      throw tokenMissing();
    }

    const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader);
    if (match?.[1] === undefined) {
      throw tokenMissing();
    }

    return match[1];
  }

  private verifyAccessToken(token: string) {
    try {
      return this.jwtTokens.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof JwtVerificationError && error.reason === "expired") {
        throw tokenExpired();
      }

      throw tokenInvalid();
    }
  }

  private requireRefreshTokenWithCsrf(request: Request): string {
    const cookies = parseCookies(request.headers.cookie);
    const rawRefreshToken = cookies[REFRESH_COOKIE_NAME];

    if (rawRefreshToken === undefined) {
      throw refreshMissing();
    }

    this.assertCsrf(request, cookies);

    return rawRefreshToken;
  }

  private assertCsrf(request: Request, cookies: Record<string, string>): void {
    const csrfCookie = cookies[CSRF_COOKIE_NAME];
    const csrfHeader = request.header(CSRF_HEADER_NAME);

    if (csrfCookie === undefined || csrfHeader === undefined || csrfCookie !== csrfHeader) {
      throw csrfFailed();
    }
  }

  private setAuthCookies(response: Response, refreshToken: string, csrfToken: string): void {
    const maxAgeSeconds = this.config.refreshTokenTtlDays * 24 * 60 * 60;
    const cookies = [
      serializeCookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        maxAgeSeconds,
        path: AUTH_COOKIE_PATH,
        sameSite: "Lax",
        secure: this.config.authCookieSecure
      }),
      serializeCookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        maxAgeSeconds,
        path: AUTH_COOKIE_PATH,
        sameSite: "Lax",
        secure: this.config.authCookieSecure
      })
    ];

    response.setHeader("Set-Cookie", cookies);
  }

  private clearAuthCookies(response: Response): void {
    response.setHeader("Set-Cookie", [
      serializeExpiredCookie(REFRESH_COOKIE_NAME, AUTH_COOKIE_PATH, this.config.authCookieSecure),
      serializeExpiredCookie(CSRF_COOKIE_NAME, AUTH_COOKIE_PATH, this.config.authCookieSecure)
    ]);
  }

  private hashRefreshToken(rawToken: string): string {
    return `sha256:${createHash("sha256").update(rawToken).digest("hex")}`;
  }

  private isLocked(staff: Pick<StaffUser, "lockedUntil" | "status">): boolean {
    return staff.status === "LOCKED" || (staff.lockedUntil !== null && staff.lockedUntil > new Date());
  }

  private async auditLogout(existing: RefreshTokenWithStaff, request: Request): Promise<void> {
    const session = await this.buildStaffSession(this.prisma, existing.staffUserId ?? "");

    await this.audit.recordStaffEvent({
      organizationId: session.organizationId,
      branchId: session.primaryBranchId,
      staffUserId: session.id,
      staffRole: session.role,
      action: "STAFF_LOGOUT",
      entityId: existing.id,
      request
    });
  }

  private resolveIp(request: Request): string | null {
    const forwardedFor = request.header("x-forwarded-for");
    const forwardedIp = forwardedFor?.split(",")[0]?.trim();

    return forwardedIp !== undefined && forwardedIp.length > 0 ? forwardedIp : request.ip ?? null;
  }

  private hashNullable(value: string | null): string | null {
    if (value === null || value.length === 0) {
      return null;
    }

    return `sha256:${createHash("sha256").update(value).digest("hex")}`;
  }
}
