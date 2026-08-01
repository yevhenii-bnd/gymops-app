import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Request, Response } from "express";

type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  correlationId: string | null;
  timestamp: string;
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = this.resolveCode(exception, status);
    const locals = response.locals as Record<string, unknown>;
    const correlationId = typeof locals["correlationId"] === "string" ? locals["correlationId"] : null;
    const problem: ProblemDetails = {
      type: `https://api.gymops.example/problems/${code.toLowerCase().replaceAll("_", "-")}`,
      title: this.resolveTitle(exception, status),
      status,
      detail: this.resolveDetail(exception, status),
      instance: request.originalUrl,
      code,
      correlationId,
      timestamp: new Date().toISOString()
    };

    response.status(status).type("application/problem+json").json(problem);
  }

  private resolveCode(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (this.hasProblemField(response, "code")) {
        return String(response.code);
      }
    }

    if (status === 503) {
      return "DEPENDENCY_UNAVAILABLE";
    }

    return status >= 500 ? "INTERNAL_ERROR" : "REQUEST_VALIDATION_FAILED";
  }

  private resolveTitle(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      return exception.message;
    }

    return status >= 500 ? "Internal server error" : "Request failed";
  }

  private resolveDetail(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (this.hasProblemField(response, "detail")) {
        return String(response.detail);
      }
      return exception.message;
    }

    return status >= 500 ? "An unexpected error occurred." : "The request could not be processed.";
  }

  private hasProblemField(value: unknown, field: "code" | "detail"): value is Record<typeof field, unknown> {
    return typeof value === "object" && value !== null && field in value;
  }
}
