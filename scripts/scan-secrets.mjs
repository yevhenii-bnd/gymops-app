import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename } from "node:path";

const mode = process.argv.includes("--tracked")
  ? "tracked"
  : process.argv.includes("--staged")
    ? "staged"
    : null;

if (!mode) {
  console.error("Usage: node scripts/scan-secrets.mjs --staged|--tracked");
  process.exit(2);
}

const MAX_SCAN_BYTES = 1024 * 1024;

const blockedFilePatterns = [
  {
    name: "environment file",
    test: (filePath) =>
      basename(filePath).startsWith(".env") && basename(filePath) !== ".env.example"
  },
  {
    name: "private key file",
    test: (filePath) =>
      /\.(pem|p12|pfx|key)$/i.test(filePath) || /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i.test(filePath)
  },
  {
    name: "browser auth state",
    test: (filePath) => /(^|\/)storage-state\.json$/i.test(filePath)
  },
  {
    name: "npm config file",
    test: (filePath) => basename(filePath) === ".npmrc"
  }
];

const ignoredPathPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)\.next\//,
  /(^|\/)coverage\//,
  /(^|\/)playwright-report\//,
  /(^|\/)test-results\//,
  /(^|\/)package-lock\.json$/
];

const secretPatterns = [
  {
    name: "private key block",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g
  },
  {
    name: "GitHub token",
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{20,})\b/g
  },
  {
    name: "AWS access key id",
    pattern: /\b(?:AKIA|ASIA|A3T[A-Z0-9])[A-Z0-9]{16}\b/g
  },
  {
    name: "Google API key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g
  },
  {
    name: "Slack token",
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/g
  },
  {
    name: "Stripe live secret key",
    pattern: /\bsk_live_[0-9A-Za-z]{16,}\b/g
  },
  {
    name: "JWT",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g
  },
  {
    name: "npm auth token",
    pattern: /\/\/[^\s:]+\/?:_authToken\s*=\s*[^\s]+/g
  },
  {
    name: "generic secret assignment",
    pattern:
      /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key)\b\s*[:=]\s*["'][^"'\s]{20,}["']/gi
  }
];

const allowMarker = "secret-scan: allow";
const safePlaceholderValues = [
  "changeme",
  "dummy",
  "example",
  "fake",
  "fixture",
  "gymops",
  "local",
  "localhost",
  "mock",
  "placeholder",
  "sample",
  "test"
];

function gitListFiles() {
  const args =
    mode === "staged"
      ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]
      : ["ls-files", "-z"];

  const output = execFileSync("git", args, { encoding: "utf8" });

  return output
    .split("\0")
    .map((filePath) => filePath.trim())
    .filter(Boolean)
    .filter((filePath) => !ignoredPathPatterns.some((pattern) => pattern.test(toPosix(filePath))));
}

function readFileFromGitIndex(filePath) {
  try {
    return execFileSync("git", ["show", `:${filePath}`], {
      encoding: "utf8",
      maxBuffer: MAX_SCAN_BYTES + 1
    });
  } catch {
    return null;
  }
}

function readTrackedFile(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  const stats = statSync(filePath);
  if (!stats.isFile() || stats.size > MAX_SCAN_BYTES) {
    return null;
  }

  return readFileSync(filePath, "utf8");
}

function toPosix(filePath) {
  return filePath.replaceAll("\\", "/");
}

function isBinary(content) {
  return content.includes("\0");
}

function redact(value) {
  if (value.length <= 12) {
    return "[redacted]";
  }

  return `${value.slice(0, 4)}...[redacted]...${value.slice(-4)}`;
}

function isAllowedPlaceholder(value) {
  const normalized = value.toLowerCase();

  return safePlaceholderValues.some((placeholder) => normalized.includes(placeholder));
}

const findings = [];

for (const filePath of gitListFiles()) {
  const normalizedPath = toPosix(filePath);
  const blocked = blockedFilePatterns.find((entry) => entry.test(normalizedPath));

  if (blocked) {
    findings.push({
      filePath: normalizedPath,
      lineNumber: 1,
      rule: blocked.name,
      match: "[blocked file path]"
    });
    continue;
  }

  const content = mode === "staged" ? readFileFromGitIndex(filePath) : readTrackedFile(filePath);

  if (!content || isBinary(content)) {
    continue;
  }

  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.includes(allowMarker)) {
      continue;
    }

    for (const { name, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);

      if (match && !isAllowedPlaceholder(match[0])) {
        findings.push({
          filePath: normalizedPath,
          lineNumber: index + 1,
          rule: name,
          match: redact(match[0])
        });
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Secret scan failed. Remove the secret or rotate it before committing/pushing.");
  console.error("");

  for (const finding of findings) {
    console.error(`${finding.filePath}:${finding.lineNumber} ${finding.rule}: ${finding.match}`);
  }

  process.exit(1);
}

console.log(`Secret scan passed (${mode} files).`);
