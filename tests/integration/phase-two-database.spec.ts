import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env["DATABASE_URL"] ?? "postgresql://gymops:gymops@localhost:54329/gymops?schema=public";
process.env["DATABASE_URL"] = databaseUrl;

describe("Phase 2 PostgreSQL foundation", () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl })
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("has a reproducible migrated identity schema", async () => {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'identity'
      ORDER BY table_name
    `;

    expect(tables.map((row) => row.table_name)).toEqual([
      "branches",
      "organizations",
      "refresh_tokens",
      "staff_branch_assignments",
      "staff_users"
    ]);
  });

  it("seeds organization, branch and staff users idempotently", async () => {
    const [organizationCount, branchCount, staffCount, assignmentCount] = await Promise.all([
      prisma.organization.count(),
      prisma.branch.count(),
      prisma.staffUser.count(),
      prisma.staffBranchAssignment.count()
    ]);

    expect(organizationCount).toBe(1);
    expect(branchCount).toBe(1);
    expect(staffCount).toBe(3);
    expect(assignmentCount).toBe(2);
  });

  it("enforces duplicate organization code at the database level", async () => {
    await expect(
      prisma.organization.create({
        data: {
          code: "northstar",
          name: "Duplicate Northstar",
          defaultTimezone: "Europe/Kyiv"
        }
      })
    ).rejects.toThrow();
  });

  it("keeps password hashes out of plaintext storage", async () => {
    const staff = await prisma.staffUser.findMany({
      select: {
        emailNormalized: true,
        passwordHash: true
      },
      orderBy: {
        emailNormalized: "asc"
      }
    });

    expect(staff).toHaveLength(3);
    expect(staff.every((user) => user.passwordHash.startsWith("scrypt:"))).toBe(true);
    expect(staff.some((user) => user.passwordHash.includes("LocalOnly!ChangeMe123"))).toBe(false);
  });
});
