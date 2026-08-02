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
