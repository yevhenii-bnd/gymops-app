import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env["DATABASE_URL"] ?? "postgresql://gymops:gymops@localhost:54329/gymops?schema=public";
process.env["DATABASE_URL"] = databaseUrl;

describe("Phase 4 authentication database foundation", () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl })
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("has audit log storage and deterministic employee seed data", async () => {
    const [auditTables, employee] = await Promise.all([
      prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'audit' AND table_name = 'audit_logs'
      `,
      prisma.staffUser.findUnique({
        where: { emailNormalized: "employee@gymops.local" },
        include: {
          branchAssignments: {
            where: { revokedAt: null }
          }
        }
      })
    ]);

    expect(auditTables).toEqual([{ table_name: "audit_logs" }]);
    expect(employee).toEqual(
      expect.objectContaining({
        id: "66666666-6666-4666-8666-666666666666",
        role: "EMPLOYEE",
        status: "ACTIVE"
      })
    );
    expect(employee?.branchAssignments).toHaveLength(1);
  });

  it("rejects audit rows that include password or token hash snapshots", async () => {
    await expect(
      prisma.$executeRaw`
        INSERT INTO audit.audit_logs (
          organization_id,
          actor_type,
          actor_staff_user_id,
          actor_role,
          action,
          entity_type,
          entity_id,
          new_values,
          correlation_id
        )
        VALUES (
          '11111111-1111-4111-8111-111111111111'::uuid,
          'STAFF_USER'::audit.audit_actor_type,
          '44444444-4444-4444-8444-444444444444'::uuid,
          'GYM_ADMIN',
          'TEST_SENSITIVE_AUDIT_REJECTION',
          'STAFF_SESSION',
          '44444444-4444-4444-8444-444444444444'::uuid,
          '{"password_hash":"secret"}'::jsonb,
          '88888888-8888-4888-8888-888888888888'::uuid
        )
      `
    ).rejects.toThrow();
  });
});
