import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export class CorrelationIdMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const header = request.header(CORRELATION_ID_HEADER);
    const correlationId = header && header.length > 0 ? header : randomUUID();

    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    response.locals["correlationId"] = correlationId;
    next();
  }
}
