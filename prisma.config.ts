import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "apps/api/prisma/schema.prisma",
  migrations: {
    path: "apps/api/prisma/migrations",
    seed: "node apps/api/prisma/seed.mjs"
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
