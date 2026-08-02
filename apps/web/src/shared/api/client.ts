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

export function createGymOpsApiClient(options: ClientOptions): GymOpsApiClient {
  const fetcher = options.fetcher ?? fetch;

  async function request<TResponse>(path: string): Promise<TResponse> {
    const response = await fetcher(joinUrl(options.apiOrigin, path), {
      headers: {
        accept: "application/json"
      }
    });
    const body = await readJson(response);

    if (!response.ok) {
      throw new GymOpsApiError(mapProblemDetails(response.status, body));
    }

    return body as TResponse;
  }

  return {
    health: () => request<HealthResponse>("/health"),
    version: () => request<VersionResponse>("/version")
  };
}
