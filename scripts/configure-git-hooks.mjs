import { chmodSync } from "node:fs";
import { execFileSync } from "node:child_process";

execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
  stdio: "inherit"
});

chmodSync(".githooks/pre-commit", 0o755);
chmodSync(".githooks/pre-push", 0o755);
