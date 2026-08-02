import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testDir, "../..");
const nextBin = path.join(rootDir, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = path.join(rootDir, "node_modules", "@playwright", "test", "cli.js");
const webDir = path.join(rootDir, "apps", "web");
const baseUrl = "http://127.0.0.1:3100";

function stopProcessTree(child) {
  if (child.pid === undefined) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  child.kill("SIGTERM");
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/login`, { cache: "no-store" });

      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  throw new Error(`Timed out waiting for ${baseUrl}/login: ${String(lastError)}`);
}

const server = spawn(
  process.execPath,
  [nextBin, "dev", webDir, "--hostname", "127.0.0.1", "--port", "3100"],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1"
    },
    stdio: "inherit"
  }
);

let isStopping = false;

function shutdown(code = 0) {
  if (isStopping) {
    return;
  }

  isStopping = true;
  stopProcessTree(server);
  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

try {
  await waitForServer();

  const tests = spawn(
    process.execPath,
    [playwrightCli, "test", "--config", "tests/ui/playwright.config.ts"],
    {
      cwd: rootDir,
      env: process.env,
      stdio: "inherit"
    }
  );

  tests.on("exit", (code, signal) => {
    shutdown(code ?? (signal === null ? 0 : 1));
  });
} catch (error) {
  console.error(error);
  shutdown(1);
}
