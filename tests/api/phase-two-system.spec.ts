import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";

import { request, expect, test } from "@playwright/test";

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
  databaseUrl: string
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
      CORS_ORIGIN: "http://localhost:3000"
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

test.describe("Phase 2 system API", () => {
  const databaseUrl =
    process.env["DATABASE_URL"] ??
    "postgresql://gymops:gymops@localhost:54329/gymops?schema=public";
  let apiProcess: ChildProcess;
  let baseURL: string;

  test.beforeAll(async () => {
    const server = await startApiServer(databaseUrl);
    apiProcess = server.process;
    baseURL = server.baseURL;
  });

  test.afterAll(async () => {
    await stopApiServer(apiProcess);
  });

  test("GET /health returns liveness and correlation ID", async () => {
    const api = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        "x-correlation-id": "phase2-api-correlation"
      }
    });
    const response = await api.get("/health");

    expect(response.status()).toBe(200);
    expect(response.headers()["x-correlation-id"]).toBe("phase2-api-correlation");
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ status: "ok", service: "gymops-api" })
    );
    await api.dispose();
  });

  test("GET /version returns public build metadata", async () => {
    const api = await request.newContext({ baseURL });
    const response = await api.get("/version");

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        service: "gymops-api",
        version: "local",
        commitSha: "local",
        buildTime: "local",
        environment: "development"
      })
    );
    await api.dispose();
  });

  test("GET /ready returns healthy database checks after migration", async () => {
    const api = await request.newContext({ baseURL });
    const response = await api.get("/ready");

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        status: "ok",
        checks: {
          database: "ok",
          migrations: "ok"
        }
      })
    );
    await api.dispose();
  });

  test("GET /ready returns Problem Details when database is unavailable", async () => {
    const unavailable = await startApiServer(
      "postgresql://gymops:gymops@127.0.0.1:1/missing?schema=public"
    );
    const api = await request.newContext({ baseURL: unavailable.baseURL });
    const response = await api.get("/ready");

    expect(response.status()).toBe(503);
    expect(response.headers()["content-type"]).toContain("application/problem+json");
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        status: 503,
        code: "DATABASE_UNAVAILABLE"
      })
    );
    await api.dispose();
    await stopApiServer(unavailable.process);
  });
});
