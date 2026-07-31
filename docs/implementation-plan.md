# План реалізації GymOps

## 1. Мета цього плану

Цей roadmap повертає проєкт до початкової мети: спочатку створити **невеликий, але повністю тестований MVP**, достатній для демонстрації QA engineering, а вже після нього побудувати повний delivery pipeline через Docker, Jenkins і AWS.

Загальний product scope GymOps не змінюється. Змінюється лише порядок поставки:

```text
Lean functional MVP
  -> local automated quality evidence
  -> full Docker runtime
  -> Jenkins CI
  -> AWS staging
  -> Jenkins CD
  -> post-deploy and nightly QA
  -> remaining product scope
```

Canonical documents:

- `requirements.md` — user stories та acceptance criteria;
- `ui-contract.md` — UI IDs, Figma roots, routes і React components;
- `figma-make-prompts.md` — prompts і normalization rules;
- `api-requirements.md` — request/response/error/token contracts;
- `database-requirements.md` — tables, fields, constraints та indexes;
- `architecture.md` — target technical architecture.

---

## 2. Delivery stages

### Stage A — Lean MVP

```text
Phase 0 — MVP boundary and backlog
Phase 1 — Monorepo and local QA foundation
Phase 2 — PostgreSQL, Prisma and API skeleton
Phase 3 — HeroUI shell and normalized Figma designs
Phase 4 — Authentication, roles and branch context
Phase 5 — Employee and client CRM core
Phase 6 — Membership and locker-key core
Phase 7 — Check-in/check-out vertical slice
Phase 8 — MVP QA hardening and release candidate
```

MVP завершується після Phase 8.

### Stage B — CI/CD після MVP

```text
Phase 9  — Full Docker runtime
Phase 10 — Jenkins Pull Request CI
Phase 11 — AWS staging infrastructure
Phase 12 — Jenkins Continuous Delivery to staging
Phase 13 — Post-deploy, nightly regression and quality evidence
```

Початкова ціль проєкту завершується після Phase 13: існує working MVP, automated QA і production-like staging pipeline.

### Stage C — Product expansion після CI/CD

```text
Phase 14 — Platform administration: organizations and branches
Phase 15 — Staff and client lifecycle
Phase 16 — Advanced membership and key lifecycle
Phase 17 — Visit corrections and incidents
Phase 18 — Audit UI and reports
Phase 19 — Optional client portal
Phase 20 — Events and first microservice extraction
Phase 21 — AWS production infrastructure
Phase 22 — Production release, observability and incident simulations
Phase 23 — Portfolio packaging
```

---

## 3. Lean MVP boundary

### 3.1. Що входить у MVP

MVP доводить один завершений бізнес-флоу:

```text
GYM_ADMIN logs in
  -> creates an EMPLOYEE
  -> creates a client
  -> creates a membership plan
  -> assigns a membership
  -> adds locker keys

EMPLOYEE logs in
  -> searches the client
  -> validates membership eligibility
  -> checks the client in with an available key
  -> sees the active visit
  -> checks the client out by key number
  -> sees the visit in client history
```

MVP user stories:

- `AUTH-01..04`;
- technical single-branch authorization guard; full `AUTH-05` is post-MVP;
- `STAFF-02`;
- `CLIENT-01..02`;
- core profile foundation for `CLIENT-03`, completed in Phase 7;
- `PLAN-01`;
- `MEMBERSHIP-01`, `MEMBERSHIP-02`, `MEMBERSHIP-04`;
- `KEY-01`, `KEY-02`;
- `VISIT-01..08`;
- `AUDIT-01` — backend audit evidence, без audit UI;
- MVP baseline для `NFR-03`, `NFR-05`, `NFR-07`.

### 3.2. Bootstrap замість зайвого admin scope

Щоб не блокувати MVP platform-administration функціоналом, Phase 2 створює seed/bootstrap data:

- одну organization;
- одну active branch;
- одного `SUPER_ADMIN`;
- одного `GYM_ADMIN`;
- test credentials лише для local/CI;
- базові roles і permissions.

Тому створення organization, branch та Gym Admin через UI/API не є частиною MVP. Вони залишаються у загальному scope і реалізуються у Phase 14.

### 3.3. Що не входить у MVP

Ці stories не видаляються, а переносяться після CI/CD:

- `ORG-01..03`;
- `BRANCH-01..02`;
- `AUTH-05`;
- `STAFF-01`, `STAFF-03..04`;
- `CLIENT-04..05`;
- `MEMBERSHIP-03`;
- `KEY-03`;
- `VISIT-09..10`;
- `INCIDENT-01..03`;
- `AUDIT-02`;
- `REPORT-01..03`;
- `PORTAL-01..02`;
- `EVENT-01..02`;
- microservices;
- AWS production.

### 3.4. MVP не вимагає

До завершення Phase 8 не потрібні:

- Docker images для web та api;
- full Docker Compose application runtime;
- Jenkins;
- ECR/ECS/RDS;
- AWS deployment;
- nightly cross-browser regression;
- microservices;
- production monitoring.

Допускається PostgreSQL у локальному Docker container як development dependency. Це не вважається full application containerization.

---

## 4. MVP implementation inventory

## 4.1. MVP UI

| Phase | UI ID | Route / opened from | React component |
|---|---|---|---|
| 3–4 | `SCR-AUTH-001` | `/login` | `StaffLoginPage` |
| 3–4 | `SCR-SYS-403` | `/403` | `ForbiddenPage` |
| 3–4 | `SCR-SYS-404` | `/404` | `NotFoundPage` |
| 4 | `SCR-PLATFORM-001` | `/super-admin/dashboard` | Minimal `PlatformDashboardPage`; no organization CRUD |
| 5 | `SCR-STAFF-001` | `/app/staff` | `StaffPage` |
| 5 | `OVL-STAFF-002` | `SCR-STAFF-001` | `CreateEmployeeModal` |
| 5 | `SCR-CLIENT-001` | `/app/clients` | `ClientsPage` |
| 5 | `SCR-CLIENT-002` | `/app/clients/[clientId]` | `ClientProfilePage` |
| 5 | `OVL-CLIENT-001` | clients/reception | `CreateClientModal` |
| 5 | `OVL-CLIENT-003` | create client | `PossibleDuplicateClientModal` |
| 6 | `SCR-PLAN-001` | `/app/membership-plans` | `MembershipPlansPage` |
| 6 | `OVL-PLAN-001` | plans | `CreateMembershipPlanModal` |
| 6 | `OVL-PLAN-002` | plans | `EditMembershipPlanModal` |
| 6 | `OVL-MEM-001` | client profile | `AssignMembershipModal` |
| 6 | `OVL-MEM-003` | client profile | `CancelMembershipAlertDialog` |
| 6 | `SCR-KEY-001` | `/app/locker-keys` | `LockerKeysPage` |
| 6 | `OVL-KEY-001` | locker keys | `AddLockerKeyModal` |
| 6 | `OVL-KEY-002` | locker keys | `EditLockerKeyModal` |
| 6 | `DRW-KEY-001` | locker keys | `LockerKeyDetailsDrawer` |
| 7 | `SCR-REC-001` | `/app/reception` | `ReceptionPage` |
| 7 | `SCR-VISIT-001` | `/app/active-visits` | `ActiveVisitsPage` |
| 7 | `OVL-VISIT-001` | reception | `CheckInModal` |
| 7 | `OVL-VISIT-002` | check-in | `CheckInSuccessModal` |
| 7 | `OVL-VISIT-003` | reception/active visits | `CheckoutByKeyModal` |
| 7 | `DRW-VISIT-001` | active visits/client profile | `VisitDetailsDrawer` |

Required states for every MVP screen:

- default;
- loading;
- empty;
- validation error where applicable;
- API error;
- permission denied;
- concurrency/conflict state for check-in/check-out.

## 4.2. MVP API

### System

- `GET /health` — `API-SYS-001`;
- `GET /ready` — `API-SYS-002`;
- `GET /version` — `API-SYS-003`.

### Authentication

- `POST /api/v1/auth/login` — `API-AUTH-001`;
- `POST /api/v1/auth/refresh` — `API-AUTH-002`;
- `POST /api/v1/auth/logout` — `API-AUTH-003`;
- `GET /api/v1/auth/me` — `API-AUTH-004`.

### Employee core

- `GET /api/v1/organizations/{organizationId}/staff` — `API-STAFF-001`;
- `POST /api/v1/organizations/{organizationId}/staff` — `API-STAFF-002`.

For MVP, `POST staff` permits Gym Admin to create only `EMPLOYEE`. Gym Admin and organization creation remain post-MVP.

### Client core

- `GET /api/v1/organizations/{organizationId}/clients` — `API-CLIENT-001`;
- `POST /api/v1/organizations/{organizationId}/clients/duplicate-check` — `API-CLIENT-002`;
- `POST /api/v1/organizations/{organizationId}/clients` — `API-CLIENT-003`;
- `GET /api/v1/clients/{clientId}` — `API-CLIENT-004`.

### Membership plan and membership core

- `GET /api/v1/organizations/{organizationId}/membership-plans` — `API-PLAN-001`;
- `POST /api/v1/organizations/{organizationId}/membership-plans` — `API-PLAN-002`;
- `GET /api/v1/membership-plans/{membershipPlanId}` — `API-PLAN-003`;
- `PATCH /api/v1/membership-plans/{membershipPlanId}` — `API-PLAN-004`;
- `POST /api/v1/membership-plans/{membershipPlanId}/deactivate` — `API-PLAN-005`;
- `GET /api/v1/clients/{clientId}/memberships` — `API-MEM-001`;
- `POST /api/v1/clients/{clientId}/memberships` — `API-MEM-002`;
- `GET /api/v1/memberships/{membershipId}` — `API-MEM-003`;
- `GET /api/v1/clients/{clientId}/membership-eligibility` — `API-MEM-004`;
- `POST /api/v1/memberships/{membershipId}/cancel` — `API-MEM-007`.

### Locker-key core

- `GET /api/v1/branches/{branchId}/locker-keys` — `API-KEY-001`;
- `POST /api/v1/branches/{branchId}/locker-keys` — `API-KEY-002`;
- `GET /api/v1/locker-keys/{lockerKeyId}` — `API-KEY-003`;
- `PATCH /api/v1/locker-keys/{lockerKeyId}` — `API-KEY-004`.

### Visit core

- `GET /api/v1/branches/{branchId}/visits` — `API-VISIT-001`;
- `POST /api/v1/branches/{branchId}/visits/check-in` — `API-VISIT-002`;
- `POST /api/v1/branches/{branchId}/visits/checkout-by-key` — `API-VISIT-003`;
- `GET /api/v1/visits/{visitId}` — `API-VISIT-004`;
- `POST /api/v1/visits/{visitId}/checkout` — `API-VISIT-005`;
- `GET /api/v1/clients/{clientId}/visits` — `API-VISIT-006`;
- `GET /api/v1/branches/{branchId}/dashboard/reception` — `API-REPORT-002`.

### Test support — local/CI only

- `POST /api/test-support/seed` — `API-TEST-001`;
- `DELETE /api/test-support/test-runs/{testRunId}` — `API-TEST-002`.

Canonical bodies, responses, Problem Details errors, headers, JWT claims, refresh cookies and idempotency rules залишаються у `api-requirements.md`.

## 4.3. MVP database objects

| DB ID | Physical object | MVP role |
|---|---|---|
| `DB-ORG-001` | `identity.organizations` | Bootstrap organization and tenant boundary |
| `DB-ORG-002` | `identity.branches` | Bootstrap branch and branch scope |
| `DB-IDN-001` | `identity.staff_users` | Staff accounts and roles |
| `DB-IDN-002` | `identity.staff_branch_assignments` | Branch access |
| `DB-IDN-003` | `identity.refresh_tokens` | Refresh rotation/revocation |
| `DB-CRM-001` | `crm.clients` | Client CRM/search |
| `DB-MEM-001` | `membership.membership_plans` | Plan definition |
| `DB-MEM-002` | `membership.membership_plan_branches` | Allowed branches |
| `DB-MEM-003` | `membership.memberships` | Assigned memberships/snapshot |
| `DB-MEM-005` | `membership.membership_usage_ledger` | Atomic visit consumption |
| `DB-OPS-001` | `operations.locker_keys` | Locker-key inventory |
| `DB-OPS-002` | `operations.visit_sessions` | Active/completed visits |
| `DB-COM-001` | `platform.idempotency_records` | Safe command retries |
| `DB-AUD-001` | `audit.audit_logs` | Backend audit evidence |

Deferred database objects:

- `DB-MEM-004` freeze periods — Phase 16;
- `DB-OPS-003..004` corrections/incidents — Phase 17;
- `DB-PORTAL-001` — Phase 19;
- `DB-EVT-*`, `DB-RPT-*` — Phase 20.

---

# Stage A — Lean MVP

# Phase 0 — MVP boundary and backlog

## Goal

Зафіксувати, що саме означає Done для Lean MVP і що свідомо відкладено.

## Scope

- узгодити MVP story list із Section 3;
- позначити решту stories як post-MVP без зміни acceptance criteria;
- перевірити UI/API/DB traceability;
- створити implementation backlog у порядку Phase 1–8;
- визначити severity model і MVP release criteria;
- підтвердити, що Docker/Jenkins/AWS не блокують MVP.

## Deliverables

- актуальні `implementation-plan.md` і `requirements.md`;
- canonical docs без contradictory phase references;
- MVP test matrix;
- список test users і seed data;
- documented Definition of Done.

## Exit criteria

- кожна MVP story має phase, UI/API/DB contracts і dependencies;
- кожна deferred story має post-MVP phase;
- немає mandatory dependency від MVP story до post-MVP story;
- MVP boundary погоджена.

## Unlocks

Phase 1 може створити repository без ризику будувати зайву функціональність.

---

# Phase 1 — Monorepo and local QA foundation

## Goal

Створити мінімальну engineering foundation, на якій кожна наступна story одразу отримує tests.

## Scope

Repository:

```text
apps/
  web/
  api/
packages/
  contracts/
  test-data/
tests/
  api/
  ui/
  integration/
```

Налаштувати:

- npm workspaces;
- TypeScript strict mode;
- ESLint and formatting;
- shared environment validation;
- Jest runner для backend unit/integration tests;
- Playwright runner для API/UI tests;
- scripts:
  - `npm run lint`;
  - `npm run typecheck`;
  - `npm run test:unit`;
  - `npm run test:integration`;
  - `npm run test:api`;
  - `npm run test:ui`;
  - `npm run build`.

MVP ще не використовує Jenkins. Допускається простий local verification script або необов’язковий lightweight GitHub check, але він не є цільовою CI system.

## Tests/checks

- sample unit test;
- sample integration test bootstrap;
- sample Playwright test;
- all scripts return non-zero on failure.

## Exit criteria

- clean clone installs and builds;
- all test runners execute;
- no application functionality required yet;
- structure supports independent test layers.

## Unlocks

Phase 2 може реалізувати database/API foundation із tests у тому ж commit.

---

# Phase 2 — PostgreSQL, Prisma and API skeleton

## Goal

Створити real PostgreSQL foundation, backend skeleton і bootstrap tenant data.

## Scope

PostgreSQL/Prisma:

- local PostgreSQL, optionally in a DB-only Docker container;
- schemas: `identity`, `crm`, `membership`, `operations`, `platform`, `audit`;
- initial migrations for `DB-ORG-001..002`, `DB-IDN-001..003`;
- seed one organization, one branch, SUPER_ADMIN and GYM_ADMIN;
- deterministic seed reset for local/test.

NestJS:

- application modules and dependency boundaries;
- global validation;
- RFC 9457 Problem Details filter;
- correlation ID middleware;
- structured logging;
- OpenAPI skeleton;
- versioned REST prefix `/api/v1`;
- endpoints:
  - `GET /health`;
  - `GET /ready`;
  - `GET /version`.

Security foundation:

- password hashing abstraction;
- JWT signer/verifier abstraction;
- refresh-token repository;
- CORS and cookie configuration by environment;
- no hard-coded secrets.

## Required tests

- clean migration;
- seed idempotency;
- readiness returns 503 without DB and 200 with DB;
- Problem Details schema;
- correlation ID propagation;
- repository integration against real PostgreSQL.

## Exit criteria

- clean database can migrate and seed;
- API starts locally;
- health/readiness/version work;
- OpenAPI is generated;
- test database can be recreated deterministically.

## Unlocks

Phase 4 receives a valid tenant, branch and admin identity context. Phase 3 can consume stable design tokens/routes independently.

---

# Phase 3 — HeroUI shell and normalized Figma designs

## Goal

Підготувати тільки ті designs і frontend foundations, які потрібні Lean MVP.

## Scope

Figma:

- run prompts only for MVP UI IDs from Section 4.1;
- run normalization pass;
- verify semantic node names, Auto Layout, variables and states;
- move approved frames to `95 — Ready for Development`.

Next.js/HeroUI:

- route groups for auth, staff app and super-admin landing;
- AppShell, sidebar, page header and role-aware navigation;
- HeroUI wrappers and GymOps reusable components;
- typed API client foundation;
- global Problem Details mapping;
- loading/error/empty/forbidden patterns;
- semantic accessibility and responsive baseline.

No business page is considered complete in this phase. Routes may render skeletons until their owning feature phase.

## Required tests

- component smoke for AppShell;
- route guard placeholder tests;
- 404 and 403 rendering;
- API client error mapping unit tests.

## Exit criteria

- all MVP frames normalized;
- shared HeroUI components exist;
- routes compile;
- frontend can call `/health` and `/version`;
- no page duplicates primitive HeroUI components.

## Unlocks

Feature phases can implement page-by-page without redefining layout, naming or error behavior.

---

# Phase 4 — Authentication, roles and branch context

## Goal

Дати всім MVP flows real staff authentication and authorization.

## Stories

- `AUTH-01..04`;
- technical single-branch authorization guard; full `AUTH-05` is post-MVP;
- foundation extension of `AUDIT-01`.

## UI

- `SCR-AUTH-001 /login`;
- `SCR-SYS-403 /403`;
- `SCR-SYS-404 /404`;
- minimal `SCR-PLATFORM-001 /super-admin/dashboard`;
- `OVL-AUTH-001` session-expired modal.

Super Admin dashboard у MVP лише підтверджує role landing, current session і bootstrap organization. Organization management не реалізується.

## API

- `POST /api/v1/auth/login`;
- `POST /api/v1/auth/refresh`;
- `POST /api/v1/auth/logout`;
- `GET /api/v1/auth/me`.

## Database

- finalize `DB-IDN-001..003`;
- use bootstrap `DB-ORG-001..002`;
- start `DB-AUD-001` for auth/admin security events.

## Ordered implementation

1. password verification and session service;
2. access JWT;
3. refresh cookie rotation/replay detection;
4. role/branch guards;
5. login UI and route protection;
6. negative authorization suite.

## Required tests

- valid/invalid login;
- access expiry and refresh rotation;
- reuse of old refresh token;
- logout revocation;
- role-based route/API denial;
- branch mismatch denial;
- token claim validation;
- audit event creation.

## Exit criteria

- SUPER_ADMIN, GYM_ADMIN and EMPLOYEE sessions can be tested;
- single bootstrap branch is enforced on protected data;
- invalid role/branch access returns stable error codes;
- frontend restores or expires sessions correctly;
- protected routes cannot render protected data before auth is resolved.

## Unlocks

Phase 5 can safely expose staff and client data. Full branch-assignment management remains deferred with `AUTH-05`.

---

# Phase 5 — Employee and client CRM core

## Goal

Дати Gym Admin можливість створити receptionist і створити/знайти клієнта.

## Stories

- `STAFF-02`;
- `CLIENT-01..02`;
- base implementation of `CLIENT-03`, completed after memberships/visits in Phase 7.

## UI

- `SCR-STAFF-001 /app/staff`;
- `OVL-STAFF-002 CreateEmployeeModal`;
- `SCR-CLIENT-001 /app/clients`;
- `SCR-CLIENT-002 /app/clients/[clientId]`;
- `OVL-CLIENT-001 CreateClientModal`;
- `OVL-CLIENT-003 PossibleDuplicateClientModal`.

## API

- `GET /api/v1/organizations/{organizationId}/staff`;
- `POST /api/v1/organizations/{organizationId}/staff`;
- `GET /api/v1/organizations/{organizationId}/clients`;
- `POST /api/v1/organizations/{organizationId}/clients/duplicate-check`;
- `POST /api/v1/organizations/{organizationId}/clients`;
- `GET /api/v1/clients/{clientId}`.

## Database

- finalize relevant staff writes in `DB-IDN-001..002`;
- introduce `DB-CRM-001`;
- append create actions to `DB-AUD-001`.

## Ordered implementation

1. create/list EMPLOYEE only;
2. create client and duplicate detection;
3. client search;
4. client profile base data;
5. tenant/branch negative tests;
6. UI flows.

## Required tests

- employee branch assignment validation;
- duplicate employee email;
- create client validation;
- phone/email normalization;
- duplicate warning/override;
- case-insensitive search and pagination;
- cross-organization IDOR denial;
- create employee and client UI smoke.

## Exit criteria

- Gym Admin creates an EMPLOYEE;
- authorized staff creates, searches and opens a client;
- no edit/block/deactivate functionality is required yet;
- all data remains tenant-scoped.

## Unlocks

Phase 6 can assign commercial access and physical keys to real clients/branches.

---

# Phase 6 — Membership and locker-key core

## Goal

Підготувати всі prerequisites для check-in, не додаючи advanced lifecycle management.

## Stories

- `PLAN-01`;
- `MEMBERSHIP-01`;
- `MEMBERSHIP-02`;
- technical foundation for `MEMBERSHIP-04`;
- `KEY-01`;
- `KEY-02`.

## UI

- `SCR-PLAN-001 /app/membership-plans`;
- `OVL-PLAN-001`, `OVL-PLAN-002`;
- membership section in `SCR-CLIENT-002`;
- `OVL-MEM-001`, `OVL-MEM-003`;
- `SCR-KEY-001 /app/locker-keys`;
- `OVL-KEY-001`, `OVL-KEY-002`, `DRW-KEY-001`.

## API

Membership plans:

- `API-PLAN-001..005`.

Memberships:

- `API-MEM-001..004`;
- `API-MEM-007`.

Locker keys:

- `API-KEY-001..004`.

## Database

- `DB-MEM-001..003`;
- `DB-MEM-005` ledger foundation;
- `DB-OPS-001`;
- audit writes in `DB-AUD-001`.

`DB-MEM-004 membership_freeze_periods` is explicitly deferred to Phase 16.

## Ordered implementation

1. membership plan CRUD needed by `PLAN-01`;
2. assign/list/cancel membership;
3. eligibility policy and reason codes;
4. usage-ledger primitive without consuming a visit yet;
5. add/list/edit locker keys;
6. UI integration on client profile and locker-key page.

## Required tests

- plan validation and snapshot behavior;
- overlapping membership policy;
- eligibility date and visit-limit boundaries;
- branch restriction;
- cancel membership;
- unique key number per branch;
- only AVAILABLE keys returned for check-in selection;
- authorization and tenant isolation.

## Exit criteria

- an eligible membership can be created for a client;
- machine-readable eligibility works;
- available keys exist;
- no freeze, lost/damaged, maintenance or incident flow is required yet.

## Unlocks

Phase 7 can execute the entire transactional business flow.

---

# Phase 7 — Check-in/check-out vertical slice

## Goal

Реалізувати головну цінність продукту та головний QA case.

## Stories

- completion of `MEMBERSHIP-04`;
- completion of `CLIENT-03`;
- `VISIT-01..08`;
- completion of MVP part of `AUDIT-01`.

## UI

- `SCR-REC-001 /app/reception`;
- `SCR-VISIT-001 /app/active-visits`;
- visit history section in `SCR-CLIENT-002`;
- `OVL-VISIT-001..003`;
- `DRW-VISIT-001`.

## API

- `API-VISIT-001..006`;
- `API-REPORT-002` reception dashboard;
- reuse `API-CLIENT-001`, `API-MEM-004`, `API-KEY-001`.

## Database

- `DB-OPS-002`;
- `DB-COM-001`;
- transactional use of `DB-MEM-005`, `DB-OPS-001`, `DB-AUD-001`.

## Required database invariants

- one ACTIVE visit per client;
- one active assignment per locker key;
- key and visit branch match;
- check-in creates visit, issues key and consumes visit atomically;
- check-out completes visit and releases key atomically;
- retry with the same idempotency key cannot duplicate changes;
- rollback leaves no partial visit/key/membership state.

## Ordered implementation

1. check-in command transaction;
2. same-client concurrency protection;
3. same-key concurrency protection;
4. idempotent retry;
5. reception search/eligibility/key selection;
6. active visits list/details;
7. checkout by key and direct checkout;
8. client visit history;
9. audit/correlation completeness.

## Required unit tests

- eligibility orchestration;
- state transitions;
- duration calculation;
- idempotency request hash;
- error mapping.

## Required integration tests

- atomic check-in;
- rollback on ineligible membership;
- rollback on unavailable key;
- parallel same-client requests;
- parallel same-key requests;
- atomic check-out;
- retry without duplicate usage/audit.

## Required API tests

- successful check-in/out;
- every stable eligibility error;
- branch isolation;
- duplicate/idempotent requests;
- concurrency conflicts;
- client history.

## Required UI tests

- employee login;
- find client;
- check-in with key;
- active visit appears;
- checkout by key;
- history updates;
- conflict is understandable and recoverable.

## Exit criteria

- complete business flow works locally through UI and API;
- race conditions cannot create inconsistent data;
- all P0 tests are green;
- audit contains actor, action, entity, organization/branch, timestamp and correlation ID.

## Unlocks

Phase 8 can convert a working slice into a stable QA-ready MVP release candidate.

---

# Phase 8 — MVP QA hardening and release candidate

## Goal

Завершити MVP не додатковими features, а доказами якості.

## Scope

Test automation:

```text
tests/
  api/
  ui/
  integration/
  concurrency/
  fixtures/
  clients/
  helpers/
```

Add:

- role fixtures;
- deterministic factories;
- unique test-run IDs;
- cleanup;
- API setup for UI tests;
- smoke and regression tags;
- JUnit and HTML reports;
- traces/screenshots/videos on failure;
- no fixed waits;
- LOCAL/CI-only test-support endpoints;
- OpenAPI schema validation;
- DB migration tests from empty DB.

### MVP smoke

- health/readiness/version;
- login each staff role;
- Gym Admin creates employee;
- create/search client;
- create plan and assign membership;
- add key;
- check-in;
- active visit visible;
- checkout;
- history visible.

### MVP regression

- auth negative cases;
- tenant/branch IDOR;
- form validation;
- membership boundaries;
- key uniqueness;
- duplicate client handling;
- check-in/out errors;
- idempotency;
- same-client and same-key concurrency;
- migration and constraints.

### Local release command

```bash
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm run test:api -- --grep @mvp
npm run test:ui -- --grep @mvp-smoke
```

Provide a wrapper:

```bash
npm run verify:mvp
```

## MVP Definition of Done

- all MVP stories satisfy acceptance criteria;
- all MVP UI IDs have default/loading/empty/error states;
- all MVP endpoints exist in OpenAPI;
- all MVP DB constraints are tested against PostgreSQL;
- no open blocker/critical defects;
- no known flaky smoke tests;
- test data is isolated and cleaned;
- `npm run verify:mvp` is green on a clean machine with local PostgreSQL;
- known limitations list explicitly contains deferred features.

## Exit criteria

**Lean MVP is complete.**

Docker/Jenkins/AWS work may now begin without changing product behavior.

## Unlocks

Phase 9 packages the already-tested application instead of debugging unfinished business functionality inside containers.

---

# Stage B — CI/CD after MVP

Platform-story dependency chain:

```text
PLATFORM-01
  -> PLATFORM-02
  -> CICD-01
  -> CLOUD-01
  -> CICD-02
  -> CICD-03
  -> QAOPS-01
  -> REL-01
  -> QAOPS-02
```

No Platform/CI/CD story is part of Lean MVP Definition of Done. Each current story creates the reusable runtime, pipeline, infrastructure or evidence needed by the next story.

# Phase 9 — Full Docker runtime

**Platform stories completed:** `PLATFORM-01`, `PLATFORM-02`

## Goal

Package the green MVP into reproducible containers.

## Preconditions

- Phase 8 Done;
- `npm run verify:mvp` green;
- migrations and seed deterministic.

## Scope

Dockerfiles:

- `apps/web/Dockerfile`;
- `apps/api/Dockerfile`;
- optional `tests/Dockerfile` Playwright runner.

Docker Compose:

```text
web
api
database
migration
optional test-runner
```

Requirements:

- multi-stage builds;
- non-root runtime user;
- production build mode;
- health checks;
- controlled Prisma migration job;
- environment-based configuration;
- no secrets in images;
- stdout/stderr logs;
- graceful shutdown;
- named DB volume for local use;
- separate ephemeral profile for tests.

Commands:

```bash
docker compose build
docker compose up -d
docker compose run --rm migration
docker compose run --rm test-runner npm run test:smoke
```

## Required tests

- clean image build;
- compose boot from clean clone;
- migration against empty DB;
- health/readiness;
- API/UI smoke from test-runner;
- shutdown/restart without corruption.

## Exit criteria

- application starts through Docker Compose without local Node processes;
- same MVP smoke is green inside containers;
- image tags include Git commit SHA locally;
- documented troubleshooting exists.

## Unlocks

Phase 10 can use the exact same Docker commands on Jenkins agents.

---

# Phase 10 — Jenkins Pull Request CI

**Platform story completed:** `CICD-01`

## Goal

Run deterministic automated quality gates before merge.

## Preconditions

- Phase 9 Done;
- Jenkins controller and Docker-capable agents available;
- GitHub webhook/credentials configured.

## Scope

Repository:

- root `Jenkinsfile`;
- `ci/` scripts reusable locally and in Jenkins;
- Jenkins Multibranch Pipeline;
- GitHub webhook on PR/branch updates;
- pipeline status reported back to GitHub.

PR pipeline:

```text
Checkout
  -> Validate environment
  -> npm ci
  -> Lint
  -> Typecheck
  -> Unit tests
  -> Start PostgreSQL / integration environment
  -> Migrations
  -> Integration tests
  -> Build web/api
  -> Build Docker images
  -> Start Docker Compose test stack
  -> Health/version
  -> OpenAPI validation
  -> API MVP smoke
  -> UI MVP smoke
  -> Publish artifacts
  -> Cleanup
```

Blocking gates:

- lint/typecheck;
- unit/integration tests;
- migration;
- build;
- container health;
- critical API/UI smoke;
- OpenAPI contract validation.

Artifacts:

- JUnit reports;
- Playwright HTML report;
- traces/screenshots/videos;
- container logs;
- migration output;
- image metadata;
- test summary by layer.

Jenkins security:

- secrets only in Jenkins Credentials Store;
- least-privilege credentials;
- no secret echo;
- no permanent AWS keys yet;
- cleanup always executes in `post` section.

## Exit criteria

- every PR automatically triggers Jenkins;
- failed blocking gate prevents merge through GitHub branch protection;
- a failure has enough evidence for initial triage;
- rerun does not rely on stale containers or data;
- median PR pipeline is practical for daily development.

## Unlocks

Phase 11 can create staging knowing every candidate image passed local-equivalent gates.

---

# Phase 11 — AWS staging infrastructure

**Platform story completed:** `CLOUD-01`

## Goal

Create one production-like staging environment for the Dockerized MVP.

## Preconditions

- Phase 10 Done;
- Docker images reproducible;
- AWS account/budget/region selected.

## Target resources

- ECR repositories for web/api;
- ECS Fargate services/tasks;
- Application Load Balancer;
- RDS PostgreSQL;
- private subnets/security groups as required;
- Secrets Manager or Parameter Store;
- CloudWatch logs and basic alarms;
- IAM roles for ECS tasks and Jenkins deployment;
- DNS/TLS when available.

Preferred source layout:

```text
infra/
  terraform/
    staging/
```

Keep IaC minimal: no EKS, Kubernetes, multi-region or complex shared platform framework.

## Requirements

- staging has separate DB and secrets;
- no production/user data;
- DB not publicly accessible;
- API and web expose health/version;
- image tags use immutable commit SHA;
- Jenkins agent authenticates through an IAM role/STS mechanism, not hard-coded long-lived keys;
- CloudWatch receives structured logs with correlation IDs;
- rollback target is identifiable.

## Exit criteria

- infrastructure can be recreated from documented steps/IaC;
- RDS migrations can run from a controlled task;
- placeholder or manually deployed images become healthy;
- network access follows least privilege;
- cost-sensitive resources documented.

## Unlocks

Phase 12 can automate deployment without inventing infrastructure during the pipeline.

---

# Phase 12 — Jenkins Continuous Delivery to AWS staging

**Platform stories completed:** `CICD-02`, `CICD-03`, `QAOPS-01`, `REL-01`

## Goal

Deploy a tested immutable image to staging after merge to `main`.

## Preconditions

- Phase 11 infrastructure healthy;
- Phase 10 PR pipeline green on merged commit.

## Main-branch pipeline

```text
Checkout exact commit
  -> Re-run required fast gates
  -> Build web/api images once
  -> Tag with commit SHA
  -> Push to ECR
  -> Run controlled migration task
  -> Update ECS task definitions/services
  -> Wait for service stability
  -> GET /health
  -> GET /ready
  -> GET /version and verify commit SHA
  -> API post-deploy smoke
  -> UI post-deploy smoke
  -> Publish deployment evidence
```

Failure behavior:

- migration failure stops deployment;
- service stability timeout fails deployment;
- smoke failure marks deployment failed;
- rollback procedure redeploys the previous tested task definition/image;
- no automatic destructive DB rollback;
- Jenkins retains deployed image SHA, task revision and logs.

Required smoke on staging:

- authentication;
- create isolated test client/member/key data;
- check-in;
- active visit;
- checkout;
- visit history;
- cleanup test data.

## Exit criteria

- merge to `main` deploys staging through Jenkins;
- only images produced from a green commit are deployed;
- version endpoint proves deployed SHA;
- failed deployment is visible and recoverable;
- rollback has been exercised at least once.

## Unlocks

Phase 13 can schedule larger regression against a stable environment.

---

# Phase 13 — Post-deploy, nightly regression and quality evidence

**Platform story completed:** `QAOPS-02`

## Goal

Turn staging into a repeatable QA/CI/CD portfolio case.

## Jenkins jobs

### Post-deploy

- API smoke;
- UI smoke;
- health/readiness/version;
- migration status;
- environment cleanup.

### Nightly

- full MVP API regression;
- full MVP UI regression;
- Chromium plus one additional browser;
- concurrency tests;
- DB integrity checks;
- OpenAPI compatibility;
- basic response-time baseline;
- stale test-data cleanup.

### Scheduled security/quality checks

- dependency vulnerability scan;
- image scan;
- secret scan;
- migration drift check;
- flaky-test trend.

## Evidence

- Jenkins build history;
- test pass rate by layer;
- flaky rate;
- duration trend;
- failure screenshots/traces;
- deployment SHA and ECS revision;
- rollback record;
- defect examples found by API/integration/concurrency tests.

## Exit criteria

- post-deploy smoke is mandatory for successful staging deployment;
- nightly regression runs without manual setup;
- failures preserve actionable evidence;
- test data cleanup is reliable;
- one documented CI failure and one deployment/rollback scenario exist;
- MVP + Docker + Jenkins + AWS staging form a complete demonstrable QA/CI/CD case.

## Milestone reached

Початкова мета проєкту виконана. Подальші phases розширюють product scope, але не є prerequisite для демонстрації QA automation і CI/CD.

---

# Stage C — Product expansion after CI/CD

# Phase 14 — Platform administration: organizations and branches

Stories:

- `ORG-01..03`;
- `BRANCH-01..02`;
- `STAFF-01`.

UI:

- full `SCR-PLATFORM-001`;
- `SCR-ORG-001`, `SCR-ORG-002`;
- `SCR-SETTINGS-001`, `SCR-SETTINGS-002`;
- `OVL-ORG-001..003`;
- `OVL-BRANCH-001..003`;
- `OVL-STAFF-001`.

API:

- `API-ORG-*`;
- `API-BRANCH-*`;
- extend `API-STAFF-001..002` to create Gym Admin according to role policy;
- `API-STAFF-005` where branch replacement is required.

This phase replaces bootstrap-only tenant administration with product UI/API.

---

# Phase 15 — Staff and client lifecycle

Stories:

- `AUTH-05`;
- `STAFF-03..04`;
- `CLIENT-04..05`.

Add full branch-assignment management, employee edit/deactivation, client edit/block/unblock and related session invalidation rules.

---

# Phase 16 — Advanced membership and key lifecycle

Stories:

- `MEMBERSHIP-03`;
- `KEY-03`.

Add freeze/end-freeze, advanced key status transitions, maintenance/lost/damaged states without incident workflow yet.

---

# Phase 17 — Visit corrections and incidents

Stories:

- `VISIT-09..10`;
- `INCIDENT-01..03`.

Add corrections, auto-close, lost/damaged incidents, resolution and complete override auditing.

---

# Phase 18 — Audit UI and reports

Stories:

- `AUDIT-02`;
- `REPORT-01..03`.

Add audit search/details, dashboard and daily/key/employee reports. Initially read modular-monolith source tables.

---

# Phase 19 — Optional client portal

Stories:

- `PORTAL-01..02`.

Add separate client auth, dashboard and own visit history. This phase remains optional.

---

# Phase 20 — Events and first microservice extraction

Stories:

- `EVENT-01..02`.

Add transactional outbox, consumer idempotency, reporting read models, reporting/audit service, retry/DLQ, contract tests and consistency indicator.

Operations, visits and locker keys remain in one cohesive service.

---

# Phase 21 — AWS production infrastructure

Create isolated production ECR/ECS/RDS/secrets/networking, approvals and backup/restore policy. Promote the same tested image; do not rebuild for production.

---

# Phase 22 — Production release, observability and incident simulations

Add manual approval, production-safe smoke, rollback, alarms, dashboards, trace/log correlation and documented incident simulations.

---

# Phase 23 — Portfolio packaging

Prepare:

- architecture and flow diagrams;
- test strategy and traceability;
- Jenkins pipeline screenshots/logs;
- Docker/AWS deployment evidence;
- concurrency/idempotency case study;
- defect examples;
- rollback/RCA case;
- README and demo script.

---

## 5. Product and platform story-to-phase traceability

| Phase | Stories completed |
|---|---|
| 0–3 | No product stories; technical/design foundation |
| 4 | `AUTH-01..04`; technical branch guard foundation |
| 5 | `STAFF-02`, `CLIENT-01..02`; foundation for `CLIENT-03` |
| 6 | `PLAN-01`, `MEMBERSHIP-01..02`, `KEY-01..02`; foundation for `MEMBERSHIP-04` |
| 7 | `CLIENT-03`, `MEMBERSHIP-04`, `VISIT-01..08`, MVP completion of `AUDIT-01` |
| 8 | No new product story; MVP QA hardening and release candidate |
| 9 | `PLATFORM-01`, `PLATFORM-02` |
| 10 | `CICD-01` |
| 11 | `CLOUD-01` |
| 12 | `CICD-02`, `CICD-03`, `QAOPS-01`, `REL-01` |
| 13 | `QAOPS-02` |
| 14 | `ORG-01..03`, `BRANCH-01..02`, `STAFF-01` |
| 15 | `AUTH-05`, `STAFF-03..04`, `CLIENT-04..05` |
| 16 | `MEMBERSHIP-03`, `KEY-03` |
| 17 | `VISIT-09..10`, `INCIDENT-01..03` |
| 18 | `AUDIT-02`, `REPORT-01..03` |
| 19 | `PORTAL-01..02` optional |
| 20 | `EVENT-01..02` |
| 21–23 | No new product stories |

---

## 6. Dependency rules

A phase can start only when:

1. the previous mandatory phase exit criteria are Done;
2. all listed story dependencies are Done or explicitly replaced by documented bootstrap infrastructure;
3. required Figma frames are normalized before frontend implementation;
4. DB schema exists before repository/service/API work;
5. API/OpenAPI exists before final frontend integration;
6. unit/integration/API/UI tests are committed with the feature;
7. Docker work starts only after local MVP is green;
8. Jenkins CI starts only after Docker runtime is reproducible;
9. AWS CD starts only after AWS infrastructure is healthy;
10. nightly regression starts only after repeatable staging deployment exists.

Mandatory path:

```text
0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8
  -> 9 -> 10 -> 11 -> 12 -> 13
  -> 14 -> 15 -> 16 -> 17 -> 18 -> 20 -> 21 -> 22 -> 23
```

Optional branch:

```text
Phase 18 -> Phase 19 Client Portal
```

Phase 19 never blocks Phase 20 or production work.
