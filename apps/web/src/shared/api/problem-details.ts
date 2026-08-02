export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  correlationId?: string;
};

export type ApiClientError = {
  status: number;
  title: string;
  detail: string;
  code: string;
  correlationId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function mapProblemDetails(status: number, body: unknown): ApiClientError {
  if (!isRecord(body)) {
    return {
      status,
      title: "Request failed",
      detail: "The API returned an unexpected error response.",
      code: "UNEXPECTED_ERROR"
    };
  }

  const title = readString(body["title"]) ?? "Request failed";
  const detail = readString(body["detail"]) ?? title;
  const code = readString(body["code"]) ?? "UNEXPECTED_ERROR";
  const correlationId = readString(body["correlationId"]);

  return {
    status,
    title,
    detail,
    code,
    ...(correlationId === undefined ? {} : { correlationId })
  };
}
