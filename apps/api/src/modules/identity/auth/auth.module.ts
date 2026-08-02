import { Module } from "@nestjs/common";

import { ScryptPasswordHasher } from "../security/password-hasher.js";
import { Hs256JwtTokenService } from "../security/jwt-token-service.js";
import { AuthAuditService } from "./auth-audit.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthAuditService,
    Hs256JwtTokenService,
    { provide: "PasswordHasher", useClass: ScryptPasswordHasher }
  ],
  exports: [AuthService, Hs256JwtTokenService, "PasswordHasher"]
})
export class AuthModule {}
