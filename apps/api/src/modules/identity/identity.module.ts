import { Module } from "@nestjs/common";

import { ScryptPasswordHasher } from "./security/password-hasher.js";

@Module({
  providers: [{ provide: "PasswordHasher", useClass: ScryptPasswordHasher }],
  exports: ["PasswordHasher"]
})
export class IdentityModule {}
