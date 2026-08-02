import { createHmac, timingSafeEqual } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { loadApiConfig } from "../../../app-config.js";
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  ACCESS_TOKEN_USE
} from "../auth/auth.constants.js";
import type { AccessTokenClaims, StaffIdentityResponse } from "../auth/auth.types.js";

export type JwtClaims = Record<string, string | number | boolean | string[] | null>;

export type JwtSigner = {
  sign(claims: JwtClaims): Promise<string>;
};

export type JwtVerifier = {
  verify(token: string): Promise<JwtClaims>;
};

export class JwtVerificationError extends Error {
  constructor(readonly reason: "expired" | "invalid") {
    super(`JWT verification failed: ${reason}`);
  }
}

@Injectable()
export class Hs256JwtTokenService implements JwtSigner, JwtVerifier {
  private readonly config = loadApiConfig();

  sign(claims: JwtClaims): Promise<string> {
    return Promise.resolve(this.signPayload(claims));
  }

  verify(token: string): Promise<JwtClaims> {
    return Promise.resolve(this.verifyPayload(token));
  }

  signAccessToken(staff: StaffIdentityResponse): { token: string; expiresAt: Date } {
    const issuedAtSeconds = Math.floor(Date.now() / 1000);
    const expiresAtSeconds = issuedAtSeconds + this.config.accessTokenTtlSeconds;
    const claims: AccessTokenClaims = {
      sub: staff.id,
      role: staff.role,
      organizationId: staff.organizationId,
      branchIds: staff.branches.map((branch) => branch.id),
      primaryBranchId: staff.primaryBranchId,
      tokenUse: ACCESS_TOKEN_USE,
      iss: ACCESS_TOKEN_ISSUER,
      aud: ACCESS_TOKEN_AUDIENCE,
      iat: issuedAtSeconds,
      exp: expiresAtSeconds
    };

    return {
      token: this.signPayload(claims),
      expiresAt: new Date(expiresAtSeconds * 1000)
    };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    const claims = this.verifyPayload(token);

    if (!this.isAccessTokenClaims(claims)) {
      throw new JwtVerificationError("invalid");
    }

    return claims;
  }

  private signPayload(claims: JwtClaims): string {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = this.encodeJson(header);
    const encodedPayload = this.encodeJson(claims);
    const signature = this.signSegments(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyPayload(token: string): JwtClaims {
    const [encodedHeader, encodedPayload, signature, extra] = token.split(".");

    if (
      encodedHeader === undefined ||
      encodedPayload === undefined ||
      signature === undefined ||
      extra !== undefined
    ) {
      throw new JwtVerificationError("invalid");
    }

    const expectedSignature = this.signSegments(encodedHeader, encodedPayload);
    if (!this.safeEquals(signature, expectedSignature)) {
      throw new JwtVerificationError("invalid");
    }

    const header = this.decodeJson(encodedHeader);
    if (header["alg"] !== "HS256" || header["typ"] !== "JWT") {
      throw new JwtVerificationError("invalid");
    }

    const claims = this.decodeJson(encodedPayload);
    const exp = claims["exp"];

    if (typeof exp !== "number") {
      throw new JwtVerificationError("invalid");
    }

    if (exp <= Math.floor(Date.now() / 1000)) {
      throw new JwtVerificationError("expired");
    }

    return claims;
  }

  private signSegments(encodedHeader: string, encodedPayload: string): string {
    return createHmac("sha256", this.config.authJwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
  }

  private encodeJson(value: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
  }

  private decodeJson(value: string): JwtClaims {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new JwtVerificationError("invalid");
    }

    return parsed as JwtClaims;
  }

  private safeEquals(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);

    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  }

  private isAccessTokenClaims(claims: JwtClaims): claims is AccessTokenClaims {
    return (
      claims["tokenUse"] === ACCESS_TOKEN_USE &&
      claims["iss"] === ACCESS_TOKEN_ISSUER &&
      claims["aud"] === ACCESS_TOKEN_AUDIENCE &&
      typeof claims["sub"] === "string" &&
      typeof claims["role"] === "string" &&
      (typeof claims["organizationId"] === "string" || claims["organizationId"] === null) &&
      Array.isArray(claims["branchIds"]) &&
      claims["branchIds"].every((branchId) => typeof branchId === "string") &&
      (typeof claims["primaryBranchId"] === "string" || claims["primaryBranchId"] === null) &&
      typeof claims["iat"] === "number" &&
      typeof claims["exp"] === "number"
    );
  }
}
