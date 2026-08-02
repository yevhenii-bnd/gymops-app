import { createHash, randomUUID } from "node:crypto";

import { Injectable } from "@nestjs/common";
import type { StaffRole } from "@prisma/client";
import type { Request } from "express";

import { PrismaService } from "../../database/prisma.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AuditStaffEventInput = {
  organizationId: string | null;
  branchId: string | null;
  staffUserId: string;
  staffRole: StaffRole;
  action: string;
  entityId: string;
  request: Request;
};

@Injectable()
export class AuthAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async recordStaffEvent(input: AuditStaffEventInput): Promise<void> {
    const correlationId = this.resolveCorrelationId(input.request);
    const requestId = correlationId.requestId ?? input.request.header("x-request-id") ?? null;

    await this.prisma.$executeRaw`
      INSERT INTO audit.audit_logs (
        organization_id,
        branch_id,
        actor_type,
        actor_staff_user_id,
        actor_role,
        action,
        entity_type,
        entity_id,
        correlation_id,
        request_id,
        ip_hash,
        user_agent
      )
      VALUES (
        ${input.organizationId}::uuid,
        ${input.branchId}::uuid,
        'STAFF_USER'::audit.audit_actor_type,
        ${input.staffUserId}::uuid,
        ${input.staffRole},
        ${input.action},
        'STAFF_SESSION',
        ${input.entityId}::uuid,
        ${correlationId.value}::uuid,
        ${requestId},
        ${this.hashNullable(this.resolveIp(input.request))},
        ${input.request.header("user-agent") ?? null}
      )
    `;
  }

  private resolveCorrelationId(request: Request): { value: string; requestId?: string } {
    const response = request.res;
    const locals = response?.locals as Record<string, unknown> | undefined;
    const candidate =
      typeof locals?.["correlationId"] === "string" ? locals["correlationId"] : null;

    if (candidate !== null && UUID_REGEX.test(candidate)) {
      return { value: candidate };
    }

    if (candidate === null) {
      return { value: randomUUID() };
    }

    return {
      value: randomUUID(),
      requestId: candidate
    };
  }

  private resolveIp(request: Request): string | null {
    const forwardedFor = request.header("x-forwarded-for");
    const forwardedIp = forwardedFor?.split(",")[0]?.trim();

    return forwardedIp !== undefined && forwardedIp.length > 0 ? forwardedIp : (request.ip ?? null);
  }

  private hashNullable(value: string | null): string | null {
    if (value === null || value.length === 0) {
      return null;
    }

    return `sha256:${createHash("sha256").update(value).digest("hex")}`;
  }
}
