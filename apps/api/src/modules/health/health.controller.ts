import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";

import { loadApiConfig } from "../../app-config.js";
import { DatabaseReadinessService } from "../database/database-readiness.service.js";

@Controller()
export class HealthController {
  constructor(private readonly readiness: DatabaseReadinessService) {}

  @Get("/health")
  health() {
    return {
      status: "ok",
      service: "gymops-api",
      timestamp: new Date().toISOString()
    };
  }

  @Get("/ready")
  async ready() {
    const checks = await this.readiness.check();
    const response = {
      status: checks.database === "ok" && checks.migrations === "ok" ? "ok" : "unavailable",
      checks,
      timestamp: new Date().toISOString()
    };

    if (response.status !== "ok") {
      throw new ServiceUnavailableException({
        code: "DATABASE_UNAVAILABLE",
        detail: "PostgreSQL or Prisma migrations are not ready.",
        ...response
      });
    }

    return response;
  }

  @Get("/version")
  version() {
    const config = loadApiConfig();

    return {
      service: "gymops-api",
      version: config.appVersion,
      commitSha: config.commitSha,
      buildTime: config.buildTime,
      environment: config.nodeEnv
    };
  }
}
