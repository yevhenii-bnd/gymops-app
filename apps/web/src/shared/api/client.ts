import { mapProblemDetails, type ApiClientError } from "./problem-details";

export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
};

export type VersionResponse = {
  service: string;
  version: string;
  commitSha: string;
  buildTime: string;
  environment: string;
};

export type StaffRole = "SUPER_ADMIN" | "GYM_ADMIN" | "EMPLOYEE";

export type StaffBranch = {
  id: string;
  organizationId: string;
  name: string;
  isPrimary: boolean;
};

export type StaffIdentity = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  organizationId: string | null;
  status: "INVITED" | "ACTIVE" | "DEACTIVATED" | "LOCKED";
  branches: StaffBranch[];
  primaryBranchId: string | null;
};

export type AuthSessionResponse = {
  accessToken: string;
  expiresAt: string;
  csrfToken: string;
  staff: StaffIdentity;
};

export type AccessTokenResponse = {
  accessToken: string;
  expiresAt: string;
  csrfToken: string;
};

export class GymOpsApiError extends Error {
  readonly problem: ApiClientError;

  constructor(problem: ApiClientError) {
    super(problem.detail);
    this.name = "GymOpsApiError";
    this.problem = problem;
  }
}

export type GymOpsApiClient = {
  health: () => Promise<HealthResponse>;
  version: () => Promise<VersionResponse>;
  login: (input: { email: string; password: string }) => Promise<AuthSessionResponse>;
  refresh: (csrfToken: string) => Promise<AccessTokenResponse>;
  logout: (csrfToken: string) => Promise<void>;
  me: (accessToken: string) => Promise<StaffIdentity>;
};

type FetchLike = typeof fetch;

type ClientOptions = {
  apiOrigin: string;
  fetcher?: FetchLike;
};

function joinUrl(apiOrigin: string, path: string): string {
  return `${apiOrigin.replace(/\/$/, "")}${path}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.length === 0) {
    return undefined;
  }

  return JSON.parse(text) as unknown;
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  accessToken?: string;
  csrfToken?: string;
};

export function createGymOpsApiClient(options: ClientOptions): GymOpsApiClient {
  const fetcher = options.fetcher ?? fetch;

  async function request<TResponse>(path: string, requestOptions: RequestOptions = {}): Promise<TResponse> {
    const headers = new Headers({
      accept: "application/json"
    });

    if (requestOptions.body !== undefined) {
      headers.set("content-type", "application/json");
    }

    if (requestOptions.accessToken !== undefined) {
      headers.set("authorization", `Bearer ${requestOptions.accessToken}`);
    }

    if (requestOptions.csrfToken !== undefined) {
      headers.set("x-csrf-token", requestOptions.csrfToken);
    }

    const init: RequestInit = {
      method: requestOptions.method ?? "GET",
      headers,
      credentials: "include"
    };

    if (requestOptions.body !== undefined) {
      init.body = JSON.stringify(requestOptions.body);
    }

    const response = await fetcher(joinUrl(options.apiOrigin, path), init);
    const body = await readJson(response);

    if (!response.ok) {
      throw new GymOpsApiError(mapProblemDetails(response.status, body));
    }

    return body as TResponse;
  }

  return {
    health: () => request<HealthResponse>("/health"),
    version: () => request<VersionResponse>("/version"),
    login: (input) =>
      request<AuthSessionResponse>("/api/v1/auth/login", {
        method: "POST",
        body: input
      }),
    refresh: (csrfToken) =>
      request<AccessTokenResponse>("/api/v1/auth/refresh", {
        method: "POST",
        csrfToken
      }),
    logout: async (csrfToken) => {
      await request<unknown>("/api/v1/auth/logout", {
        method: "POST",
        csrfToken
      });
    },
    me: (accessToken) =>
      request<StaffIdentity>("/api/v1/auth/me", {
        accessToken
      })
  };
}
