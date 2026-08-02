# Quality Strategy

This document describes how GymOps protects product quality from local development through pull requests, release readiness, and future post-deploy monitoring.

It is the canonical quality strategy document for:

- local verification commands;
- pull request quality gates;
- automated test levels;
- coverage policy;
- security and dependency checks;
- release evidence;
- future monitoring and post-deploy QA.

## Quality Model

GymOps quality is enforced in layers:

```text
Developer feedback
  -> local commands and focused tests
Pull request gates
  -> GitHub Actions required checks
Merge readiness
  -> branch rulesets and required status checks
Release readiness
  -> phase verify commands and release evidence
Post-deploy confidence
  -> smoke checks, scheduled tests, logs, metrics, and alerts
```

The goal is not to rely on one large test suite. Each layer should catch the type of risk it is best suited for.

## Quality Targets

Quality targets define the expected minimum bar. They are intentionally split by test level because code coverage is useful for unit-testable logic, while integration/API/UI quality is better measured by contract, scenario, and critical-flow coverage.

| Area                    | Current minimum                                                                            | MVP hardening target                                                                       | Mature target                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Unit code coverage      | `75/65/75/75` for statements/branches/functions/lines                                      | `80/75/80/80`                                                                              | `85/80/85/85` for stable business logic packages               |
| Critical business rules | 100% of implemented rules have at least one positive or negative test at the correct level | Positive, negative, and boundary coverage for every MVP rule                               | Mutation or defect-seeding evidence for critical rules         |
| Database migrations     | 100% of committed migrations run in CI against an empty PostgreSQL database                | Upgrade path evidence for MVP release candidates                                           | Rollback/forward-fix plan documented for release changes       |
| Database invariants     | Critical implemented constraints covered by integration tests                              | 100% of MVP critical invariants covered                                                    | Concurrency tests for all high-risk write flows                |
| API contract coverage   | System/auth endpoints covered where implemented                                            | 100% of MVP API endpoints covered by happy path, validation, and authorization/error tests | Contract tests for every public endpoint and stable error code |
| UI smoke coverage       | Current shell/auth/system routes covered where implemented                                 | 100% of MVP critical user journeys covered by smoke or E2E tests                           | Browser regression coverage for critical role-based journeys   |
| Security gate coverage  | 100% of PRs run dependency audit and Trivy scan                                            | 0 critical runtime dependency advisories accepted without documented risk                  | Scheduled security scan review and dependency update SLA       |
| Release evidence        | Commands and test results reported for meaningful changes                                  | Full phase verify evidence for MVP release candidates                                      | Automated artifacts for reports, traces, and post-deploy smoke |

The unit coverage target is a quality gate. The other percentages are coverage of requirements, contracts, scenarios, or release evidence, not line coverage.

## Current PR Quality Gates

The GitHub Actions pull request gates are documented in `.github/workflows/README.md`.

Current PR checks:

#### `PR Quality / static-quality`

Runs ESLint and TypeScript type checking after generating Prisma Client.

Purpose: catch unsafe TypeScript, bad imports, missing generated types, lint regressions, and strict typing issues before runtime tests.

#### `PR Quality / unit-tests`

Builds workspace packages and runs Jest unit tests with coverage thresholds.

Purpose: prove isolated config, policy, security, client, and business logic still behaves correctly from a clean checkout.

Current coverage gate: `75/65/75/75` for statements/branches/functions/lines.

Target after MVP hardening: `80/75/80/80`.

#### `PR Quality / build`

Runs the monorepo TypeScript build and the Next.js production build.

Purpose: prove the repository compiles from scratch and can produce production build output.

#### `PR Quality / api-integration`

Starts PostgreSQL, applies Prisma migrations, seeds deterministic data, builds packages, then runs integration and API tests.

Purpose: prove migrations, seed data, database-backed invariants, and public API/system endpoints work against real PostgreSQL.

#### `PR Quality / ui-smoke`

Installs Playwright Chromium, starts the web app, and runs browser smoke tests.

Purpose: prove critical routes render in a real browser and semantic accessibility locators remain stable.

#### `Security / dependency-audit`

Runs `npm audit --omit=dev --audit-level=critical`.

Purpose: block merges for critical runtime dependency advisories while leaving high advisories visible for triage.

#### `Security / trivy-scan`

Runs Trivy filesystem scanning and uploads SARIF results.

Purpose: keep vulnerability, secret, and misconfiguration findings visible in GitHub Code Scanning.

#### `Code scanning results / Trivy`

Evaluates uploaded Trivy SARIF results through GitHub code scanning rules.

Purpose: block only relevant code scanning alerts for changed code.

## Local Quality Gates

Developers should run the phase verification command before opening or updating a pull request.

Current phase gate:

```powershell
npm run verify:phase4
```

Focused commands:

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:unit:coverage
npm run test:integration
npm run test:api
npm run test:ui
```

Database-backed checks require local PostgreSQL:

```powershell
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Local Commands And Focused Tests

Local verification should be fast while code is changing and complete before a pull request is opened or updated.

#### Default Local Flow

Use focused commands while developing:

```powershell
npm run lint
npm run typecheck
npm run test:unit:coverage
```

Run the current phase gate before opening or updating a PR:

```powershell
npm run verify:phase4
```

#### Focused Test Selection

Use the smallest command that covers the risk of the change.

| Change type                                                     | Focused local command                                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Pure TypeScript, policy, config, security helper, or API client | `npm run test:unit -- --runTestsByPath <path-to-unit-spec>`                                         |
| Unit-testable logic plus coverage risk                          | `npm run test:unit:coverage`                                                                        |
| Type or package boundary change                                 | `npm run typecheck && npm run build`                                                                |
| Prisma schema, migration, seed, or DB invariant                 | `npm run db:generate && npm run db:migrate && npm run db:seed && npm run test:integration`          |
| API route, validation, auth, or error contract                  | `npm run db:generate && npm run build && npm run test:api`                                          |
| Browser route, layout shell, auth UI, or accessibility locator  | `npm run test:ui`                                                                                   |
| Workflow, Dependabot, or security config                        | Review YAML plus run the closest affected local command; final validation happens in GitHub Actions |

Focused tests are not a replacement for required PR checks. They are developer feedback loops.

#### Planned Local Hooks

Local hooks should catch cheap mistakes before they reach CI. They must stay fast enough that developers do not bypass them.

Recommended first hook set:

```text
pre-commit
  -> run Prettier/ESLint only on staged files

pre-push
  -> npm run typecheck
  -> npm run test:unit:coverage
```

Pre-commit should not run the full database, API, or UI suite. Those belong in pre-push, local phase verification, or CI.

Recommended implementation:

- `husky` for Git hook wiring;
- `lint-staged` for staged-file formatting/lint checks;
- staged `*.ts`, `*.tsx`, `*.js`, `*.mjs`, `*.cjs` files: ESLint;
- staged supported text files: Prettier check or write;
- pre-push: `npm run typecheck && npm run test:unit:coverage`.

Because the repository still has formatting baseline debt, repository-wide `prettier . --check` should not be used as a hook until a separate formatting baseline PR has been merged.

## Test Strategy

GymOps uses different test levels for different risks.

#### Unit Tests

Use for:

- domain rules;
- authorization policies;
- config parsing;
- pure business logic;
- security helpers;
- frontend/API client helpers.

Unit tests must assert observable behavior. A unit test that only executes code without meaningful assertions does not provide quality evidence.

#### Integration Tests

Use for:

- Prisma/PostgreSQL behavior;
- database constraints;
- transactions;
- migrations;
- repository-level invariants.

Integration tests must use controlled local/CI PostgreSQL. They must not run against dev, staging, or production databases.

#### API Tests

Use for:

- HTTP contract behavior;
- validation;
- authorization;
- authentication/session flows;
- error codes and Problem Details responses;
- public health/readiness/version endpoints.

API tests should treat the application as a client would: through HTTP, not through private implementation details.

#### UI Smoke Tests

Use for:

- critical routes;
- authentication shell behavior;
- role-aware navigation;
- accessible locators;
- system pages such as forbidden and not-found routes.

UI smoke tests should stay focused and stable. Deep end-to-end business journeys should be added only when the underlying feature reaches the correct roadmap phase.

#### Manual and Exploratory QA

Automated checks do not replace manual QA. Manual QA is still needed for:

- UX judgment;
- visual polish;
- edge cases not yet automated;
- release candidate walkthroughs;
- exploratory testing around risky changes.

Manual QA evidence should list the tested routes, roles, data setup, browser, and observed result.

## Coverage Policy

Coverage is a guardrail, not the final definition of quality.

Current policy:

- coverage gate is scoped to unit-testable runtime logic;
- current required threshold is `75/65/75/75`;
- long-term target is `80/75/80/80`;
- mature target for stable business logic packages is `85/80/85/85`;
- coverage must not be raised by adding meaningless tests;
- code that is better covered by integration/API/UI tests should not be forced into artificial unit tests.

The coverage scope intentionally excludes files that are better validated elsewhere, such as:

- application entrypoints;
- Nest modules;
- HTTP controllers;
- generated artifacts;
- UI route shells where Playwright is the stronger signal.

When adding new business, policy, config, security, or client code, the same change set should add or update the relevant test level.

## Branch Protection And Merge Policy

Important branches should use GitHub rulesets or branch protection.

Recommended required checks at the current stage:

- `PR Quality / static-quality`;
- `PR Quality / unit-tests`;
- `PR Quality / build`;
- `Security / dependency-audit`.

Recommended checks after the first stable green runs:

- `PR Quality / api-integration`;
- `PR Quality / ui-smoke`;
- `Code scanning results / Trivy`.

Pull requests should not be merged while required checks are failing.

## Dependency Maintenance

Dependabot is configured for:

- `npm` package updates;
- `github-actions` version updates.

Dependabot pull requests must pass the same quality gates as regular pull requests.

Dependency update PRs should be reviewed for:

- changelog breaking changes;
- security impact;
- generated lockfile changes;
- CI runtime impact;
- test failures caused by dependency behavior changes.

## Security QA

Security quality is enforced through:

- critical production dependency audit;
- Trivy filesystem scan;
- GitHub Code Scanning SARIF upload;
- no secrets in repository, Docker images, logs, or generated artifacts;
- least-privilege secrets and tokens for future deployment automation.

Security findings should be triaged by severity, exploitability, affected runtime surface, and whether the alert touches changed code.

## Release Evidence

Every meaningful change set should report:

- implemented story IDs or platform IDs;
- changed files/modules;
- migrations or OpenAPI changes, if applicable;
- commands executed;
- test results;
- known limitations;
- deferred scope.

For release candidates, evidence should include:

- full phase verify command result;
- migration result on an empty database;
- API smoke result;
- UI smoke result;
- security audit result;
- known open defects and accepted risks.

## Future QA Roadmap

The quality system should evolve with the roadmap.

#### MVP Hardening

- expand unit coverage for business logic;
- raise coverage target toward `80/75/80/80`;
- add more negative API tests;
- add migration rollback/upgrade evidence where applicable;
- add deterministic MVP journey smoke tests.

#### Post-MVP CI/CD

- Docker image build checks;
- Docker Compose test stack;
- OpenAPI schema validation;
- artifact upload for test reports;
- Jenkins pull request pipeline after the roadmap reaches the CI/CD phase.

#### Staging And Post-Deploy QA

- deploy smoke tests for health/readiness/version;
- API smoke tests against staging;
- UI smoke tests against staging;
- release evidence artifacts;
- rollback verification.

#### Monitoring And Observability

Future production/staging monitoring should include:

- health and readiness endpoint monitoring;
- structured application logs;
- request correlation IDs;
- error rate metrics;
- latency metrics;
- database connectivity/readiness signals;
- authentication failure signals;
- scheduled smoke tests;
- alert rules for availability and critical regressions.

Monitoring should answer two questions:

1. Is the system available?
2. Is the system behaving correctly for critical user flows?

## Non-Goals

Current quality gates do not yet provide:

- full end-to-end business regression coverage;
- load testing;
- chaos testing;
- production observability;
- full compliance/security program;
- guaranteed absence of defects.

Those capabilities should be introduced deliberately when the roadmap phase requires them.
