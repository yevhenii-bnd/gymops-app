import { createGymOpsApiClient } from "./client.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init
  });
}

describe("createGymOpsApiClient", () => {
  it("calls system endpoints from the configured API origin", async () => {
    const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockResolvedValue(
      jsonResponse({
        service: "gymops-api",
        version: "local",
        commitSha: "local",
        buildTime: "local",
        environment: "test"
      })
    );
    const client = createGymOpsApiClient({ apiOrigin: "http://localhost:4000/", fetcher });

    await expect(client.version()).resolves.toMatchObject({ service: "gymops-api" });
    const [, init] = fetcher.mock.calls[0] ?? [];
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:4000/version",
      expect.objectContaining({ method: "GET" })
    );
    expect(init?.credentials).toBe("include");
    expect(init?.headers).toBeInstanceOf(Headers);
    expect((init?.headers as Headers).get("accept")).toBe("application/json");
  });

  it("maps Problem Details responses to a stable client error", async () => {
    const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockResolvedValue(
      jsonResponse(
        {
          title: "Service Unavailable",
          detail: "PostgreSQL or Prisma migrations are not ready.",
          code: "DATABASE_UNAVAILABLE",
          correlationId: "request-1"
        },
        { status: 503 }
      )
    );
    const client = createGymOpsApiClient({ apiOrigin: "http://localhost:4000", fetcher });

    await expect(client.health()).rejects.toMatchObject({
      name: "GymOpsApiError",
      problem: {
        status: 503,
        title: "Service Unavailable",
        detail: "PostgreSQL or Prisma migrations are not ready.",
        code: "DATABASE_UNAVAILABLE",
        correlationId: "request-1"
      }
    });
  });

  it("posts staff login credentials to the auth API", async () => {
    const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>().mockResolvedValue(
      jsonResponse({
        accessToken: "access-token",
        expiresAt: "2026-08-02T12:00:00.000Z",
        csrfToken: "csrf-token",
        staff: {
          id: "44444444-4444-4444-8444-444444444444",
          email: "gym.admin@gymops.local",
          firstName: "Dmytro",
          lastName: "Shevchenko",
          role: "GYM_ADMIN",
          organizationId: "11111111-1111-4111-8111-111111111111",
          status: "ACTIVE",
          branches: [],
          primaryBranchId: null
        }
      })
    );
    const client = createGymOpsApiClient({ apiOrigin: "http://localhost:4000", fetcher });

    await expect(
      client.login({ email: "gym.admin@gymops.local", password: "secret" })
    ).resolves.toMatchObject({
      accessToken: "access-token",
      csrfToken: "csrf-token"
    });

    const [, init] = fetcher.mock.calls[0] ?? [];
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "gym.admin@gymops.local", password: "secret" })
      })
    );
    expect((init?.headers as Headers).get("content-type")).toBe("application/json");
  });
});
