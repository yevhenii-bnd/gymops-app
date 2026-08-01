import "reflect-metadata";

import { pathToFileURL } from "node:url";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { Request, Response } from "express";

import { loadApiConfig } from "./app-config.js";
import { AppModule } from "./modules/app.module.js";
import { CorrelationIdMiddleware } from "./modules/common/http/correlation-id.middleware.js";
import { ProblemDetailsFilter } from "./modules/common/http/problem-details.filter.js";
import { JsonRequestLoggerMiddleware } from "./modules/common/logging/json-request-logger.middleware.js";

type ApiConfig = ReturnType<typeof loadApiConfig>;

function createOpenApiDocument(config: ApiConfig) {
  return {
    openapi: "3.1.0",
    info: {
      title: "GymOps API",
      version: config.appVersion,
      description: "GymOps REST API skeleton for Phase 2."
    },
    servers: [
      {
        url: "/",
        description: "Current origin"
      }
    ],
    paths: {
      "/health": {
        get: {
          summary: "Liveness check",
          responses: {
            "200": {
              description: "The API process is running."
            }
          }
        }
      },
      "/ready": {
        get: {
          summary: "Database readiness check",
          responses: {
            "200": {
              description: "PostgreSQL and Prisma migrations are ready."
            },
            "503": {
              description: "PostgreSQL or Prisma migrations are unavailable."
            }
          }
        }
      },
      "/version": {
        get: {
          summary: "Build metadata",
          responses: {
            "200": {
              description: "Public service version metadata."
            }
          }
        }
      }
    }
  } as const;
}

const docsHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GymOps API Docs</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; }
      code { background: #f3f4f6; padding: 0.15rem 0.3rem; border-radius: 0.25rem; }
    </style>
  </head>
  <body>
    <h1>GymOps API Docs</h1>
    <p>Phase 2 exposes the OpenAPI skeleton at <code>/api/openapi.json</code>.</p>
  </body>
</html>`;

export async function createApiApplication() {
  const config = loadApiConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: config.corsOrigin,
    credentials: true
  });
  app.setGlobalPrefix("api/v1", {
    exclude: ["/health", "/ready", "/version", "/api/docs", "/api/openapi.json"]
  });

  const correlationIdMiddleware = new CorrelationIdMiddleware();
  const requestLoggerMiddleware = new JsonRequestLoggerMiddleware();
  app.use(correlationIdMiddleware.use.bind(correlationIdMiddleware));
  app.use(requestLoggerMiddleware.use.bind(requestLoggerMiddleware));
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const document = createOpenApiDocument(config);

  const httpAdapter = app.getHttpAdapter() as {
    get: (path: string, handler: (request: Request, response: Response) => void) => void;
  };
  httpAdapter.get("/api/openapi.json", (_request, response) => {
    response.json(document);
  });
  httpAdapter.get("/api/docs", (_request, response) => {
    response.type("html").send(docsHtml);
  });

  return app;
}

async function bootstrap() {
  const config = loadApiConfig();
  const app = await createApiApplication();

  await app.listen(config.port);
}

const entrypointUrl = process.argv[1] === undefined ? "" : pathToFileURL(process.argv[1]).href;

if (import.meta.url === entrypointUrl) {
  void bootstrap();
}
