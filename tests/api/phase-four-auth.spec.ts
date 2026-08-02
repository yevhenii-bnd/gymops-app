import { spawn, type ChildProcess } from "node:child_process";
import { createHash, scryptSync } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { request, expect, test, type APIResponse } from "@playwright/test";

const seededPassword = "LocalOnly!ChangeMe123";
const databaseUrl =
  process.env["DATABASE_URL"] ?? "postgresql://gymops:gymops@localhost:54329/gymops?schema=public";
process.env["DATABASE_URL"] = databaseUrl;

function hashLocalPassword(password: string): string {
  const derived = scryptSync(password, "phase2-local-seed", 64);
  return `scrypt:phase2-local-seed:${derived.toString("hex")}`;
}

async function getFreePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  server.close();

  if (typeof address === "string" || address === null) {
    throw new Error("Expected a TCP port.");
  }

  return address.port;
}

async function startApiServer(
  envOverrides: Record<string, string> = {}
): Promise<{ process: ChildProcess; baseURL: string }> {
  const port = await getFreePort();
  const child = spawn("node", ["apps/api/dist/main.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      NODE_ENV: "development",
      APP_VERSION: "local",
      COMMIT_SHA: "local",
      BUILD_TIME: "local",
      CORS_ORIGIN: "http://localhost:3000",
      AUTH_JWT_SECRET: "phase-four-api-test-secret",
      ACCESS_TOKEN_TTL_SECONDS: "900",
      REFRESH_TOKEN_TTL_DAYS: "30",
      AUTH_COOKIE_SECURE: "false",
      ...envOverrides
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const baseURL = `http://127.0.0.1:${String(port)}`;
  const api = await request.newContext({ baseURL });

  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (child.exitCode !== null) {
        throw new Error(`API process exited before readiness check: ${String(child.exitCode)}`);
      }

      try {
        const response = await api.get("/health", { timeout: 1_000 });
        if (response.status() === 200) {
          return { process: child, baseURL };
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    throw new Error("API process did not become healthy.");
  } finally {
    await api.dispose();
  }
}

async function stopApiServer(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }

  child.kill();
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => {
      setTimeout(resolve, 2_000);
    })
  ]);
}

function cookieHeader(response: APIResponse): string {
  return response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value.split(";")[0])
    .join("; ");
}

function cookieValue(cookies: string, name: string): string {
  const match = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (match === undefined) {
    throw new Error(`Missing cookie: ${name}`);
  }

  return decodeURIComponent(match.slice(name.length + 1));
}

function hashRefreshToken(rawToken: string): string {
  return `sha256:${createHash("sha256").update(rawToken).digest("hex")}`;
}

test.describe("Phase 4 staff authentication API", () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl })
  });
  let apiProcess: ChildProcess;
  let baseURL: string;

  test.beforeAll(async () => {
    const server = await startApiServer();
    apiProcess = server.process;
    baseURL = server.baseURL;
  });

  test.afterAll(async () => {
    await stopApiServer(apiProcess);
    await prisma.$disconnect();
  });

  test("POST /api/v1/auth/login returns staff context, access token and refresh cookies", async () => {
    const api = await request.newContext({ baseURL });
    const auditCountBefore = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM audit.audit_logs
      WHERE action = 'STAFF_LOGIN_SUCCEEDED'
        AND actor_staff_user_id = '44444444-4444-4444-8444-444444444444'::uuid
    `;
    const response = await api.post("/api/v1/auth/login", {
      data: {
        email: "gym.admin@gymops.local",
        password: seededPassword
      },
      headers: {
        "x-correlation-id": "phase-four-login-correlation"
      }
    });

    expect(response.status()).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body["accessToken"]).toEqual(expect.any(String));
    expect(body["csrfToken"]).toEqual(expect.any(String));
    expect(body["staff"]).toEqual(
      expect.objectContaining({
        email: "gym.admin@gymops.local",
        role: "GYM_ADMIN",
        organizationId: "11111111-1111-4111-8111-111111111111",
        primaryBranchId: "22222222-2222-4222-8222-222222222222"
      })
    );
    expect(JSON.stringify(body)).not.toContain("passwordHash");
    expect(cookieHeader(response)).toContain("gymops_refresh=");
    expect(cookieHeader(response)).toContain("gymops_csrf=");

    const auditCountAfter = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM audit.audit_logs
      WHERE action = 'STAFF_LOGIN_SUCCEEDED'
        AND actor_staff_user_id = '44444444-4444-4444-8444-444444444444'::uuid
    `;
    expect(Number(auditCountAfter[0]?.count ?? 0n)).toBeGreaterThan(
      Number(auditCountBefore[0]?.count ?? 0n)
    );
    await api.dispose();
  });

  test("GET /api/v1/auth/me accepts valid access tokens and rejects missing ones", async () => {
    const api = await request.newContext({ baseURL });
    const login = await api.post("/api/v1/auth/login", {
      data: {
        email: "employee@gymops.local",
        password: seededPassword
      }
    });
    const loginBody = (await login.json()) as { accessToken: string };
    const me = await api.get("/api/v1/auth/me", {
      headers: {
        authorization: `Bearer ${loginBody.accessToken}`
      }
    });
    const missing = await api.get("/api/v1/auth/me");

    expect(me.status()).toBe(200);
    await expect(me.json()).resolves.toEqual(
      expect.objectContaining({
        email: "employee@gymops.local",
        role: "EMPLOYEE"
      })
    );
    expect(missing.status()).toBe(401);
    await expect(missing.json()).resolves.toEqual(
      expect.objectContaining({ code: "AUTH_TOKEN_MISSING" })
    );
    await api.dispose();
  });

  test("POST /api/v1/auth/login uses a generic error for invalid credentials", async () => {
    const api = await request.newContext({ baseURL });
    const response = await api.post("/api/v1/auth/login", {
      data: {
        email: "gym.admin@gymops.local",
        password: "wrong-password"
      }
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        code: "AUTH_INVALID_CREDENTIALS",
        detail: "Email or password is incorrect."
      })
    );
    await api.dispose();
  });

  test("POST /api/v1/auth/login temporarily locks staff after repeated failed attempts", async () => {
    const email = "lockout.api-test@gymops.local";
    await prisma.staffUser.deleteMany({ where: { emailNormalized: email } });
    await prisma.staffUser.create({
      data: {
        id: "99999999-9999-4999-8999-999999999997",
        organizationId: "11111111-1111-4111-8111-111111111111",
        email,
        emailNormalized: email,
        passwordHash: hashLocalPassword(seededPassword),
        firstName: "Lockout",
        lastName: "Staff",
        role: "EMPLOYEE",
        status: "ACTIVE"
      }
    });

    const api = await request.newContext({ baseURL });

    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const failed = await api.post("/api/v1/auth/login", {
          data: {
            email,
            password: "wrong-password"
          }
        });
        expect(failed.status()).toBe(401);
      }

      const locked = await api.post("/api/v1/auth/login", {
        data: {
          email,
          password: seededPassword
        }
      });
      const staff = await prisma.staffUser.findUniqueOrThrow({ where: { emailNormalized: email } });

      expect(locked.status()).toBe(429);
      await expect(locked.json()).resolves.toEqual(
        expect.objectContaining({ code: "AUTH_RATE_LIMITED" })
      );
      expect(staff.failedLoginCount).toBe(5);
      expect(staff.lockedUntil).toBeInstanceOf(Date);
    } finally {
      await api.dispose();
      await prisma.staffUser.deleteMany({ where: { emailNormalized: email } });
    }
  });

  test("POST /api/v1/auth/login denies deactivated staff", async () => {
    await prisma.staffUser.deleteMany({
      where: { emailNormalized: "deactivated.api-test@gymops.local" }
    });
    await prisma.staffUser.create({
      data: {
        id: "99999999-9999-4999-8999-999999999998",
        organizationId: "11111111-1111-4111-8111-111111111111",
        email: "deactivated.api-test@gymops.local",
        emailNormalized: "deactivated.api-test@gymops.local",
        passwordHash: hashLocalPassword(seededPassword),
        firstName: "Deactivated",
        lastName: "Staff",
        role: "EMPLOYEE",
        status: "DEACTIVATED",
        deactivatedAt: new Date()
      }
    });

    const api = await request.newContext({ baseURL });

    try {
      const response = await api.post("/api/v1/auth/login", {
        data: {
          email: "deactivated.api-test@gymops.local",
          password: seededPassword
        }
      });

      expect(response.status()).toBe(401);
      await expect(response.json()).resolves.toEqual(
        expect.objectContaining({ code: "AUTH_INVALID_CREDENTIALS" })
      );
    } finally {
      await prisma.staffUser.deleteMany({
        where: { emailNormalized: "deactivated.api-test@gymops.local" }
      });
      await api.dispose();
    }
  });

  test("GET /api/v1/auth/me rejects expired and malformed access tokens", async () => {
    const expiredServer = await startApiServer({ ACCESS_TOKEN_TTL_SECONDS: "-1" });
    const expiredApi = await request.newContext({ baseURL: expiredServer.baseURL });
    const api = await request.newContext({ baseURL });

    try {
      const login = await expiredApi.post("/api/v1/auth/login", {
        data: {
          email: "employee@gymops.local",
          password: seededPassword
        }
      });
      const loginBody = (await login.json()) as { accessToken: string };
      const expired = await expiredApi.get("/api/v1/auth/me", {
        headers: {
          authorization: `Bearer ${loginBody.accessToken}`
        }
      });
      const malformed = await api.get("/api/v1/auth/me", {
        headers: {
          authorization: "Bearer not-a-jwt"
        }
      });

      expect(expired.status()).toBe(401);
      await expect(expired.json()).resolves.toEqual(
        expect.objectContaining({ code: "AUTH_TOKEN_EXPIRED" })
      );
      expect(malformed.status()).toBe(401);
      await expect(malformed.json()).resolves.toEqual(
        expect.objectContaining({ code: "AUTH_TOKEN_INVALID" })
      );
    } finally {
      await expiredApi.dispose();
      await api.dispose();
      await stopApiServer(expiredServer.process);
    }
  });

  test("POST /api/v1/auth/refresh rotates refresh cookies and rejects old token reuse", async () => {
    const api = await request.newContext({ baseURL });
    const login = await api.post("/api/v1/auth/login", {
      data: {
        email: "gym.admin@gymops.local",
        password: seededPassword
      }
    });
    const oldCookies = cookieHeader(login);
    const oldCsrf = cookieValue(oldCookies, "gymops_csrf");
    const refresh = await api.post("/api/v1/auth/refresh", {
      headers: {
        cookie: oldCookies,
        "x-csrf-token": oldCsrf
      }
    });
    const newCookies = cookieHeader(refresh);
    const reused = await api.post("/api/v1/auth/refresh", {
      headers: {
        cookie: oldCookies,
        "x-csrf-token": oldCsrf
      }
    });

    expect(refresh.status()).toBe(200);
    await expect(refresh.json()).resolves.toEqual(
      expect.objectContaining({ accessToken: expect.any(String) })
    );
    expect(newCookies).toContain("gymops_refresh=");
    expect(newCookies).not.toEqual(oldCookies);
    expect(reused.status()).toBe(401);
    await expect(reused.json()).resolves.toEqual(
      expect.objectContaining({ code: "AUTH_REFRESH_REUSED" })
    );
    await api.dispose();
  });

  test("POST /api/v1/auth/refresh rejects expired refresh tokens", async () => {
    const api = await request.newContext({ baseURL });
    const login = await api.post("/api/v1/auth/login", {
      data: {
        email: "gym.admin@gymops.local",
        password: seededPassword
      }
    });
    const cookies = cookieHeader(login);
    const rawRefreshToken = cookieValue(cookies, "gymops_refresh");
    const csrf = cookieValue(cookies, "gymops_csrf");

    await prisma.refreshToken.update({
      where: { tokenHash: hashRefreshToken(rawRefreshToken) },
      data: {
        issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    const expired = await api.post("/api/v1/auth/refresh", {
      headers: {
        cookie: cookies,
        "x-csrf-token": csrf
      }
    });
    const stored = await prisma.refreshToken.findUniqueOrThrow({
      where: { tokenHash: hashRefreshToken(rawRefreshToken) }
    });

    expect(expired.status()).toBe(401);
    await expect(expired.json()).resolves.toEqual(
      expect.objectContaining({ code: "AUTH_REFRESH_EXPIRED" })
    );
    expect(stored.revokeReason).toBe("EXPIRED");
    expect(stored.revokedAt).toBeInstanceOf(Date);
    await api.dispose();
  });

  test("POST /api/v1/auth/refresh and logout reject invalid CSRF tokens", async () => {
    const api = await request.newContext({ baseURL });
    const login = await api.post("/api/v1/auth/login", {
      data: {
        email: "gym.admin@gymops.local",
        password: seededPassword
      }
    });
    const cookies = cookieHeader(login);
    const refresh = await api.post("/api/v1/auth/refresh", {
      headers: {
        cookie: cookies,
        "x-csrf-token": "wrong-csrf-token"
      }
    });
    const logout = await api.post("/api/v1/auth/logout", {
      headers: {
        cookie: cookies,
        "x-csrf-token": "wrong-csrf-token"
      }
    });

    expect(refresh.status()).toBe(403);
    await expect(refresh.json()).resolves.toEqual(
      expect.objectContaining({ code: "CSRF_VALIDATION_FAILED" })
    );
    expect(logout.status()).toBe(403);
    await expect(logout.json()).resolves.toEqual(
      expect.objectContaining({ code: "CSRF_VALIDATION_FAILED" })
    );
    await api.dispose();
  });

  test("POST /api/v1/auth/logout revokes the current refresh token idempotently", async () => {
    const api = await request.newContext({ baseURL });
    const login = await api.post("/api/v1/auth/login", {
      data: {
        email: "gym.admin@gymops.local",
        password: seededPassword
      }
    });
    const cookies = cookieHeader(login);
    const csrf = cookieValue(cookies, "gymops_csrf");
    const firstLogout = await api.post("/api/v1/auth/logout", {
      headers: {
        cookie: cookies,
        "x-csrf-token": csrf
      }
    });
    const secondLogout = await api.post("/api/v1/auth/logout", {
      headers: {
        cookie: cookies,
        "x-csrf-token": csrf
      }
    });

    expect(firstLogout.status()).toBe(204);
    expect(secondLogout.status()).toBe(204);
    await api.dispose();
  });
});
