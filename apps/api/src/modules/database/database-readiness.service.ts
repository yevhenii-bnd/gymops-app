import { Injectable } from "@nestjs/common";

import { PrismaService } from "./prisma.service.js";

export type ReadinessCheck = "ok" | "unavailable";

@Injectable()
export class DatabaseReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<{ database: ReadinessCheck; migrations: ReadinessCheck }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      await this.prisma.$queryRaw`SELECT 1 FROM "_prisma_migrations" LIMIT 1`;
      return { database: "ok", migrations: "ok" };
    } catch {
      return { database: "unavailable", migrations: "unavailable" };
    }
  }
}
