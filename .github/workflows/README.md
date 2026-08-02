# GitHub Workflows

This folder contains pull request and scheduled automation used as merge gates for GymOps.

## PR Quality

File: `pr-quality.yml`

Runs on:

- pull requests
- pushes to `main`
- manual `workflow_dispatch`

Jobs:

- `static-quality` generates the Prisma client, then runs ESLint and TypeScript type checking.
- `unit-tests` generates the Prisma client, builds workspace packages, then runs Jest unit tests.
- `build` generates the Prisma client, runs the TypeScript build, and runs the Next.js production build.
- `api-integration` starts PostgreSQL as a GitHub Actions service, generates the Prisma client, applies migrations, seeds deterministic data, builds workspace packages, then runs integration and API tests.
- `ui-smoke` generates the Prisma client, builds workspace packages, installs Playwright Chromium, starts the web app through the existing UI test runner, runs browser smoke tests, and uploads the UI Playwright report artifact.

### PR Quality Checks

#### `PR Quality / static-quality`

What it verifies: generates Prisma Client, runs ESLint, and runs TypeScript project type checking.

Why it exists: catches unsafe TypeScript, missing generated Prisma types, bad imports, dead code patterns, and strict typing regressions before runtime tests start.

#### `PR Quality / unit-tests`

What it verifies: generates Prisma Client, builds workspace packages so `@gymops/*` imports resolve from a clean checkout, then runs Jest unit tests.

Why it exists: proves isolated business/config/client logic still behaves correctly and that tests do not depend on local `dist` artifacts left from a previous developer build.

#### `PR Quality / build`

What it verifies: generates Prisma Client, runs the monorepo TypeScript build, then runs the Next.js production build.

Why it exists: confirms the repo can compile from scratch, package references produce publishable `dist` output, and the web app can be built in production mode.

#### `PR Quality / api-integration`

What it verifies: starts PostgreSQL 16, generates Prisma Client, applies Prisma migrations, seeds deterministic data, builds workspace packages, then runs integration and Playwright API tests.

Why it exists: proves migrations apply on an empty database, seeded data is valid, database-backed invariants work, and public API/system endpoints behave against real PostgreSQL instead of mocks.

#### `PR Quality / ui-smoke`

What it verifies: generates Prisma Client, builds workspace packages, installs Playwright Chromium, starts the Next.js app, and runs browser smoke tests.

Why it exists: proves critical routes render in a real browser, accessible locators remain stable, and the frontend shell works from a clean CI machine.

Recommended first required checks:

- `static-quality`
- `unit-tests`
- `build`

Recommended required checks after the first green CI run:

- `api-integration`
- `ui-smoke`

## Security

File: `security.yml`

Runs on:

- pull requests
- pushes to `main`
- weekly schedule
- manual `workflow_dispatch`

Jobs:

- `dependency-audit` runs `npm audit --omit=dev --audit-level=critical` against production dependencies. High advisories are still visible in logs, but only critical advisories block the workflow at the current project stage.
- `trivy-scan` runs Trivy filesystem scanning for critical vulnerabilities, secrets, and misconfigurations, then uploads SARIF results to GitHub code scanning. The job is advisory and does not fail the workflow on findings; GitHub code scanning rules should decide whether new alerts in changed code block a pull request.

### Security Checks

#### `Security / dependency-audit`

What it verifies: runs `npm audit --omit=dev --audit-level=critical` against runtime dependencies.

Why it exists: blocks merges only for critical production dependency advisories while still showing high advisories in logs for follow-up triage.

#### `Security / trivy-scan`

What it verifies: runs Trivy filesystem scanning for vulnerabilities, secrets, and misconfigurations, then uploads SARIF results.

Why it exists: produces GitHub Code Scanning evidence and keeps security findings visible in the PR without duplicating the dedicated code scanning gate.

#### `Code scanning results / Trivy`

What it verifies: evaluates uploaded Trivy SARIF results against GitHub code scanning rules for the pull request.

Why it exists: blocks only when GitHub detects relevant code scanning alerts in changed code, avoiding noisy failures from existing or unrelated scan output.

Recommended first required check:

- `dependency-audit`

Recommended code scanning gate after the first green security run:

- `Code scanning results / Trivy`

## Related Automation

File: `.github/dependabot.yml`

Dependabot is not a workflow file, but GitHub runs it as repository automation. It checks dependency manifests and GitHub Actions references on a weekly schedule and opens pull requests when updates are available.

Configured ecosystems:

- `npm` for package updates from `package.json` and `package-lock.json`.
- `github-actions` for updates to action versions used in workflow files.

Dependabot PRs should go through the same required checks as regular pull requests.
