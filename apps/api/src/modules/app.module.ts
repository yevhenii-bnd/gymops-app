import { Module } from "@nestjs/common";

import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { IdentityModule } from "./identity/identity.module.js";

@Module({
  imports: [DatabaseModule, HealthModule, IdentityModule]
})
export class AppModule {}
