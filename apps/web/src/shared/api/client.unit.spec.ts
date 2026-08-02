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
    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/version", {
      headers: { accept: "application/json" }
    });
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
});
