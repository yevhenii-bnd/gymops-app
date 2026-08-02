import type { NextFunction, Request, Response } from "express";

export class JsonRequestLoggerMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on("finish", () => {
      const locals = response.locals as Record<string, unknown>;
      const correlationId =
        typeof locals["correlationId"] === "string" ? locals["correlationId"] : null;
      const log = {
        level: "info",
        message: "http_request",
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
        correlationId,
        timestamp: new Date().toISOString()
      };

      process.stdout.write(`${JSON.stringify(log)}\n`);
    });

    next();
  }
}
