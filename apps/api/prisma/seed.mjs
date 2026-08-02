import { createHash, scryptSync } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const organizationId = "11111111-1111-4111-8111-111111111111";
const branchId = "22222222-2222-4222-8222-222222222222";
const superAdminId = "33333333-3333-4333-8333-333333333333";
const gymAdminId = "44444444-4444-4444-8444-444444444444";
const gymAdminBranchAssignmentId = "55555555-5555-4555-8555-555555555555";
const employeeId = "66666666-6666-4666-8666-666666666666";
const employeeBranchAssignmentId = "77777777-7777-4777-8777-777777777777";

function hashLocalPassword(password, salt) {
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Phase 2 seed is local/CI only and cannot run in production.");
  }

  const localPassword = process.env.GYMOPS_SEED_PASSWORD ?? "LocalOnly!ChangeMe123";
  const passwordHash = hashLocalPassword(localPassword, "phase2-local-seed");

  await prisma.organization.upsert({
    where: { id: organizationId },
    update: {
      code: "NORTHSTAR",
      name: "Northstar Fitness",
      legalName: "Northstar Fitness LLC",
      status: "ACTIVE",
      defaultTimezone: "Europe/Kyiv"
    },
    create: {
      id: organizationId,
      code: "NORTHSTAR",
      name: "Northstar Fitness",
      legalName: "Northstar Fitness LLC",
      status: "ACTIVE",
      defaultTimezone: "Europe/Kyiv"
    }
  });

  await prisma.branch.upsert({
    where: { id: branchId },
    update: {
      organizationId,
      code: "PODIL",
      name: "Podil",
      timezone: "Europe/Kyiv",
      status: "ACTIVE"
    },
    create: {
      id: branchId,
      organizationId,
      code: "PODIL",
      name: "Podil",
      timezone: "Europe/Kyiv",
      status: "ACTIVE"
    }
  });

  await prisma.staffUser.upsert({
    where: { id: superAdminId },
    update: {
      email: "super.admin@gymops.local",
      emailNormalized: "super.admin@gymops.local",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    },
    create: {
      id: superAdminId,
      email: "super.admin@gymops.local",
      emailNormalized: "super.admin@gymops.local",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    }
  });

  await prisma.staffUser.upsert({
    where: { id: gymAdminId },
    update: {
      organizationId,
      email: "gym.admin@gymops.local",
      emailNormalized: "gym.admin@gymops.local",
      passwordHash,
      firstName: "Dmytro",
      lastName: "Shevchenko",
      role: "GYM_ADMIN",
      status: "ACTIVE"
    },
    create: {
      id: gymAdminId,
      organizationId,
      email: "gym.admin@gymops.local",
      emailNormalized: "gym.admin@gymops.local",
      passwordHash,
      firstName: "Dmytro",
      lastName: "Shevchenko",
      role: "GYM_ADMIN",
      status: "ACTIVE",
      createdByStaffUserId: superAdminId
    }
  });

  await prisma.staffBranchAssignment.upsert({
    where: { id: gymAdminBranchAssignmentId },
    update: {
      organizationId,
      staffUserId: gymAdminId,
      branchId,
      isPrimary: true,
      assignedByStaffUserId: superAdminId,
      revokedAt: null
    },
    create: {
      id: gymAdminBranchAssignmentId,
      organizationId,
      staffUserId: gymAdminId,
      branchId,
      isPrimary: true,
      assignedByStaffUserId: superAdminId
    }
  });

  await prisma.staffUser.upsert({
    where: { id: employeeId },
    update: {
      organizationId,
      email: "employee@gymops.local",
      emailNormalized: "employee@gymops.local",
      passwordHash,
      firstName: "Olena",
      lastName: "Koval",
      role: "EMPLOYEE",
      status: "ACTIVE"
    },
    create: {
      id: employeeId,
      organizationId,
      email: "employee@gymops.local",
      emailNormalized: "employee@gymops.local",
      passwordHash,
      firstName: "Olena",
      lastName: "Koval",
      role: "EMPLOYEE",
      status: "ACTIVE",
      createdByStaffUserId: gymAdminId
    }
  });

  await prisma.staffBranchAssignment.upsert({
    where: { id: employeeBranchAssignmentId },
    update: {
      organizationId,
      staffUserId: employeeId,
      branchId,
      isPrimary: true,
      assignedByStaffUserId: gymAdminId,
      revokedAt: null
    },
    create: {
      id: employeeBranchAssignmentId,
      organizationId,
      staffUserId: employeeId,
      branchId,
      isPrimary: true,
      assignedByStaffUserId: gymAdminId
    }
  });

  const seedFingerprint = createHash("sha256")
    .update(`${organizationId}:${branchId}:${superAdminId}:${gymAdminId}:${employeeId}`)
    .digest("hex");

  console.log(
    JSON.stringify({
      organizationId,
      branchId,
      superAdminId,
      gymAdminId,
      employeeId,
      seedFingerprint,
      localCredentialUsers: [
        "super.admin@gymops.local",
        "gym.admin@gymops.local",
        "employee@gymops.local"
      ]
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
