# Архітектура GymOps

## 1. Призначення документа

Цей документ є технічним source of truth для AI-асистента та розробки GymOps.

Він визначає:

- технологічний стек;
- структуру repository;
- межі доменних модулів;
- database model;
- API principles;
- environments;
- Docker і CI/CD;
- AWS target architecture;
- test architecture;
- шлях від modular monolith до microservices.

Детальний physical data model, stable DB IDs, поля, constraints, indexes, migrations і story traceability визначені у `database-requirements.md`.

AI не повинен змінювати ці рішення мовчки. Перед суттєвою зміною він має описати проблему, альтернативи, вплив на код, дані, тести, deployment і підтримку.

---

## 2. Архітектурна мета

GymOps створюється як production-oriented portfolio application, але реалізується поступово.

Цільова еволюція:

```text
Phase A: Modular monolith
  -> Phase B: Event-driven reporting extraction
  -> Phase C: Independent services
  -> Phase D: Production deployment and observability
```

Ключове рішення:

> Visits і Locker Keys на першому та цільовому етапах належать одному Gym Operations bounded context, оскільки check-in/check-out мають бути атомарними бізнес-транзакціями.

---

## 3. Технологічний стек

| Область | Технологія |
|---|---|
| Мова | TypeScript |
| Frontend | Next.js, React, TypeScript |
| UI framework | HeroUI |
| Styling | Tailwind CSS |
| Backend | NestJS, TypeScript |
| API | REST + OpenAPI/Swagger |
| Database | PostgreSQL |
| ORM | Prisma |
| Backend unit/integration tests | Jest |
| API/UI automation | Playwright + TypeScript |
| Package manager | npm |
| Repository | GitHub monorepo |
| Local containers | Docker + Docker Compose |
| CI/CD | Jenkins Multibranch Pipeline + Jenkinsfile |
| Cloud runtime | AWS ECS Fargate |
| Container registry | AWS ECR |
| Managed database | AWS RDS PostgreSQL |
| Logs/metrics | AWS CloudWatch |
| Secrets | AWS Secrets Manager |
| Jenkins-to-AWS auth | IAM role / STS assume-role; no long-lived static AWS keys |
| Async messaging post-MVP | Amazon EventBridge або SNS/SQS з DLQ |

### Не додавати без окремого ADR

- Java/Spring/Maven;
- Python backend;
- MongoDB;
- Firebase/Supabase як заміну backend;
- GraphQL;
- Kubernetes/EKS;
- Kafka;
- другий ORM;
- другий UI framework;
- microservice на кожну таблицю;
- shared database між незалежними services у фінальній microservice-фазі.

---

## 4. Архітектурні принципи

1. **Modular first.** MVP реалізується modular monolith, а не distributed monolith.
2. **Business boundaries before infrastructure.** Модулі визначаються доменом.
3. **Operations remain transactional.** Visit і key assignment не розділяються на різні services.
4. **Backend is source of truth.** UI не визначає permissions або final state transitions.
5. **Database constraints protect invariants.** Конкурентність не вирішується лише кнопками UI.
6. **Same artifact promotion.** Одна Docker image переходить staging → production.
7. **Configuration outside code.** Усі environment-specific values через variables/secrets.
8. **Audit by design.** Critical operations мають actor, timestamp, correlation ID і reason.
9. **Testability by design.** Stable contracts, injectable time, idempotency, deterministic setup.
10. **Observability by design.** Structured logs, health/version, correlation IDs.
11. **No premature complexity.** Kubernetes і складна cloud automation не входять у MVP.

---

## 5. Domain bounded contexts

### 5.1. Platform Identity

Відповідає за:

- organizations;
- branches;
- staff users;
- roles;
- branch assignments;
- authentication;
- refresh tokens;
- platform access policies.

### 5.2. Client CRM & Membership

Відповідає за:

- clients;
- contact information;
- client status/blocking;
- membership plans;
- client memberships;
- freeze periods;
- remaining visits;
- eligibility decisions.

### 5.3. Gym Operations

Відповідає за:

- locker keys;
- key statuses;
- visit sessions;
- check-in;
- check-out;
- active visitors;
- manual corrections;
- incidents;
- idempotency records;
- concurrency protection.

### 5.4. Audit & Reporting

Відповідає за:

- audit records;
- reporting read models;
- daily visit summaries;
- key status reports;
- employee activity reports;
- eventual-consistency status post-MVP.

---

## 6. Phase A — Modular monolith architecture

```text
Browser
   |
   | HTTPS / REST
   v
Next.js Frontend
   |
   v
NestJS Modular Monolith
   |
   +-- Identity Module
   +-- CRM/Membership Module
   +-- Operations Module
   +-- Audit/Reporting Module
   |
   v
PostgreSQL
```

### Причини почати з modular monolith

- одна deployment unit;
- простіший debugging;
- atomic database transactions;
- швидше створення MVP;
- простіші integration tests;
- зрозумілий CI/CD;
- модулі вже формують майбутні service boundaries.

### Обмеження модулів

1. Модуль не імпортує внутрішні repositories іншого модуля.
2. Взаємодія відбувається через public application services/interfaces.
3. Таблиці групуються логічними Prisma models і service boundaries.
4. Operations не змінює membership tables напряму; використовує Membership application service.
5. Reporting не бере участі в critical transaction, окрім мінімального local audit у MVP.

---

## 7. Phase B/C — Target microservice architecture

```text
                         +-------------------+
Browser ----------------> API Gateway / BFF |
                         +---------+---------+
                                   |
               +-------------------+-------------------+
               |                   |                   |
               v                   v                   v
       Identity Service   CRM/Membership Service  Gym Operations Service
               |                   |                   |
         identity_db          membership_db        operations_db
                                                       |
                                                       | domain events
                                                       v
                                             Event Bus / Queues
                                                       |
                                                       v
                                             Reporting & Audit Service
                                                       |
                                                  reporting_db
```

### Service boundaries

#### Identity Service

- organization;
- branches;
- staff users;
- roles;
- authentication;
- staff permissions.

#### CRM/Membership Service

- clients;
- plans;
- memberships;
- eligibility;
- visit balance.

#### Gym Operations Service

- locker keys;
- visits;
- check-in/out;
- incidents;
- correction;
- idempotency.

#### Reporting & Audit Service

- event consumers;
- audit trail;
- report projections;
- read-optimized views.

### Порядок extraction

1. Reporting/Audit worker/service.
2. Identity Service.
3. CRM/Membership Service.
4. Operations залишається cohesive service.

Reporting виділяється першим, бо його тимчасова недоступність не повинна блокувати check-in.

---

## 8. Synchronous та asynchronous communication

### Synchronous REST

Використовується, коли відповідь потрібна для поточної дії:

- login;
- client search;
- membership eligibility;
- check-in;
- check-out;
- active visits;
- admin commands.

### Asynchronous events

Використовуються для:

- audit projections;
- reports;
- notifications;
- analytics;
- non-critical side effects.

### Основні events

```text
OrganizationCreated
StaffUserCreated
ClientCreated
MembershipAssigned
MembershipFrozen
ClientCheckedIn
ClientCheckedOut
VisitCorrected
LockerKeyIssued
LockerKeyReturned
LockerKeyReportedLost
IncidentCreated
```

### Event envelope

```json
{
  "eventId": "uuid",
  "eventType": "ClientCheckedIn",
  "eventVersion": 1,
  "occurredAt": "2026-07-31T16:00:00.000Z",
  "correlationId": "uuid",
  "causationId": "uuid",
  "organizationId": "uuid",
  "branchId": "uuid",
  "payload": {}
}
```

### Event requirements

- globally unique event ID;
- versioned schema;
- idempotent consumer;
- retry policy;
- DLQ;
- no sensitive secrets;
- correlation ID propagation;
- contract tests.

---

## 9. Repository structure

```text
gymops/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── api/
│   │   ├── src/
│   │   │   ├── identity/
│   │   │   ├── crm/
│   │   │   ├── memberships/
│   │   │   ├── operations/
│   │   │   ├── audit/
│   │   │   ├── reporting/
│   │   │   ├── health/
│   │   │   └── common/
│   │   ├── prisma/
│   │   ├── test/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── reporting-worker/          # додається під час extraction
│
├── packages/
│   ├── contracts/
│   │   ├── http/
│   │   └── events/
│   ├── shared-types/
│   ├── test-utils/
│   └── eslint-config/
│
├── tests/
│   └── e2e/
│       ├── tests/
│       │   ├── api/
│       │   ├── ui/
│       │   ├── contract/
│       │   ├── concurrency/
│       │   └── production-safe/
│       ├── fixtures/
│       ├── helpers/
│       └── playwright.config.ts
│
├── infrastructure/
│   ├── docker/
│   ├── aws/
│   └── scripts/
│
├── docs/
│   ├── architecture.md
│   ├── requirements.md
│   ├── implementation-plan.md
│   ├── ui-flows.md
│   ├── test-strategy.md
│   ├── quality-gates.md
│   ├── failure-triage.md
│   └── rollback-plan.md
│
├── .github/workflows/
├── docker-compose.yml
├── package.json
└── .env.example
```

Використовуються npm workspaces.

---

## 10. Backend layering

```text
Controller / Transport
        |
        v
Application Service / Use Case
        |
        v
Domain Rules / Policies
        |
        v
Repository Interface
        |
        v
Prisma Repository / PostgreSQL
```

### Rules

- controllers не містять business logic;
- DTO validation на transport boundary;
- authorization перевіряється до виконання command;
- domain rules тестуються ізольовано;
- Prisma виклики не розкидані по controllers;
- transaction boundary визначена application service;
- errors мають stable machine-readable codes.

### Standard error response

```json
{
  "statusCode": 409,
  "code": "KEY_ALREADY_ISSUED",
  "message": "Locker key is already assigned to an active visit",
  "details": {
    "keyId": "uuid"
  },
  "correlationId": "uuid",
  "timestamp": "2026-07-31T16:00:00.000Z"
}
```

---

## 11. Data model

`database-requirements.md` є canonical source of truth для physical schema. У цьому документі фіксуються лише bounded-context ownership та архітектурні межі.

### Identity / Tenancy

```text
DB-ORG-001 identity.organizations
DB-ORG-002 identity.branches
DB-IDN-001 identity.staff_users
DB-IDN-002 identity.staff_branch_assignments
DB-IDN-003 identity.refresh_tokens
DB-PORTAL-001 identity.client_accounts # optional Phase 19
```

### CRM

```text
DB-CRM-001 crm.clients
```

### Membership

```text
DB-MEM-001 membership.membership_plans
DB-MEM-002 membership.membership_plan_branches
DB-MEM-003 membership.memberships
DB-MEM-004 membership.membership_freeze_periods
DB-MEM-005 membership.membership_usage_ledger
```

### Operations

```text
DB-OPS-001 operations.locker_keys
DB-OPS-002 operations.visit_sessions
DB-OPS-003 operations.visit_corrections
DB-OPS-004 operations.incidents
```

### Platform, Audit та Integration

```text
DB-COM-001 platform.idempotency_records
DB-AUD-001 audit.audit_logs
DB-EVT-001 integration.outbox_events       # Phase 20
DB-EVT-002 integration.processed_events    # Phase 20
```

### Reporting read models

```text
DB-RPT-001 reporting.reporting_visit_facts
DB-RPT-002 reporting.reporting_daily_branch_metrics
DB-RPT-003 reporting.reporting_employee_daily_metrics
DB-RPT-004 reporting.reporting_sync_state
```

### Important statuses

```text
Organization: ACTIVE, SUSPENDED, DEACTIVATED
Branch: ACTIVE, DEACTIVATED
StaffUser: ACTIVE, INVITED, DEACTIVATED, LOCKED
Client: ACTIVE, BLOCKED, ARCHIVED
Membership: ACTIVE, FROZEN, EXPIRED, BLOCKED, CANCELLED
LockerKey: AVAILABLE, ISSUED, LOST, DAMAGED, MAINTENANCE, DEACTIVATED
Visit: ACTIVE, COMPLETED, CANCELLED, AUTO_CLOSED, INCIDENT, CORRECTED
Incident: OPEN, IN_PROGRESS, RESOLVED, CANCELLED
```

### Rules

- DB IDs are stable and are referenced from every user story.
- Physical field definitions are not duplicated here; they live in `database-requirements.md`.
- A module cannot write another module’s tables directly except through an explicit transaction/application-service contract in the modular monolith.
- During microservice extraction, each service becomes the only writer of its own database.

---

## 12. Database constraints та concurrency

Canonical details: `database-requirements.md`.

Business invariants повинні бути захищені не лише application code.

### Required protections

1. Unique staff email.
2. Unique branch code in organization.
3. Unique locker key number in branch.
4. Не більше одного ACTIVE visit на client.
5. Не більше одного active assignment на key.
6. `finishedAt >= startedAt`.
7. Branch/organization consistency.
8. Foreign keys.
9. Optimistic locking/version field або row locking для critical updates.

### Check-in transaction

```text
BEGIN
  validate employee branch access
  validate client and membership
  lock/check client active visit
  lock/check key status
  create ACTIVE visit
  set key = ISSUED
  consume membership visit if policy requires
  create local audit/outbox record
COMMIT
```

Будь-який failure викликає rollback.

### Check-out transaction

```text
BEGIN
  find and lock key
  find ACTIVE visit
  set visit = COMPLETED
  set finishedAt
  set key = AVAILABLE
  create local audit/outbox record
COMMIT
```

### Idempotency

Critical commands приймають `Idempotency-Key`.

`idempotency_records` містить:

- key;
- operation;
- actor/client scope;
- request hash;
- response snapshot/reference;
- status;
- expiration.

---

## 13. Audit architecture

### MVP

Audit record пишеться в тій самій database transaction для critical operation або через transactional outbox.

### Post-MVP

Transactional outbox:

```text
Business transaction
  -> update domain data
  -> write outbox event
COMMIT

Outbox publisher
  -> publish event
  -> mark published
```

Reporting/Audit consumer будує окремий read model.

### Audit rules

- append-only;
- no regular edit/delete endpoint;
- actor, role, organization, branch;
- old/new values або change summary;
- correlation ID;
- reason для correction/deactivation/incident.

---

## 14. Frontend architecture

### Route groups

```text
/login

/super-admin/
  dashboard
  organizations
  organizations/[id]
  system-audit

/app/
  dashboard
  reception
  active-visits
  clients
  clients/[id]
  memberships
  locker-keys
  incidents
  staff
  reports
  audit
  settings
```

### Feature folders

```text
features/
├── auth/
├── organizations/
├── staff/
├── clients/
├── memberships/
├── locker-keys/
├── visits/
├── incidents/
├── reports/
└── audit/
```


<!-- BEGIN GENERATED FIGMA FRONTEND CONTRACT -->
### UI contract, Figma MCP та frontend naming

Canonical mapping зберігається в `ui-contract.md`:

```text
Story ID
  -> UI ID
  -> exact Figma root node
  -> route
  -> React page/component
  -> target frontend file
```

Правила:

1. UI ID є стабільним integration key і не залежить від видимого заголовка сторінки.
2. Figma screen roots використовують `Screen/<UI-ID>/<Role>/<Feature>/<Viewport>/<State>`.
3. Modal, Drawer та AlertDialog roots використовують `Overlay/<UI-ID>/<Domain>/<Action>/<State>`.
4. Reusable domain components використовують `Component/GymOps/<ComponentName>` і відповідний React PascalCase name.
5. HeroUI primitives не дублюються власними реалізаціями.
6. Exact target paths у `ui-contract.md` є planned contract до моменту створення codebase.
7. Figma Make output проходить normalization pass перед статусом Ready for Development.
8. UI IDs не використовуються як visible copy або автоматично як `data-testid`; Playwright віддає перевагу role, label та accessible name.
9. Коли з’явиться production component library, Code Connect може прив’язати Figma components до React components без зміни UI IDs.

Target shared frontend structure:

```text
apps/frontend/src/
├── app/                       # route-level pages
├── features/                  # domain features and overlays
├── shared/layout/             # AppShell and layouts
└── shared/ui/                 # reusable GymOps wrappers over HeroUI
```
<!-- END GENERATED FIGMA FRONTEND CONTRACT -->

### Frontend rules

1. HeroUI — єдиний UI framework.
2. Backend визначає permissions; frontend лише адаптує UX.
3. API URLs через environment variables.
4. Немає secrets у browser bundle.
5. Server state не дублюється без потреби.
6. Loading, empty, error, permission denied і stale-data states обов’язкові.
7. Semantic HTML і accessible labels.
8. Playwright використовує role/text locators; `data-testid` лише за потреби.
9. Reception flow оптимізований для desktop/tablet і мінімальної кількості кліків.

---

## 15. API architecture and source of truth

Canonical endpoint, request/response, error, token, idempotency and OpenAPI requirements are defined in:

```text
api-requirements.md
```

Base path:

```text
/api/v1
```

System endpoints:

```text
/health
/ready
/version
```

### Core rules

- REST/JSON for synchronous frontend/backend communication;
- OpenAPI 3.1 generated from NestJS code;
- every operation has a stable `API-*` ID;
- RFC 9457-compatible `application/problem+json` errors;
- staff/client access token is short-lived JWT;
- opaque refresh token is rotated and stored only in Secure HttpOnly cookie;
- Bearer access token is sent only in `Authorization` header;
- organization/branch scope is authorized server-side;
- `Idempotency-Key` is mandatory for critical operational commands;
- `ETag`/`If-Match` protects versioned updates;
- correlation ID is propagated through HTTP, audit and future events;
- timestamps are ISO 8601 UTC; business dates use branch timezone;
- public API and future internal events have separate contracts;
- frontend API wrappers must use generated/typed OpenAPI definitions without bypassing domain adapters.

### Resource groups

```text
/auth
/organizations
/branches
/staff
/clients
/membership-plans
/memberships
/locker-keys
/visits
/incidents
/reports
/audit-events
/portal
```

### Critical command boundaries

The following are command endpoints, not generic CRUD:

- check-in;
- checkout by key/visit;
- visit correction;
- auto-close;
- locker-key state transition;
- incident resolution;
- membership freeze/cancel.

Their transaction, idempotency and error behavior is defined in `api-requirements.md` and `database-requirements.md`.

---

## 16. Environment strategy

```text
LOCAL
CI
STAGING
PRODUCTION
```

Optional later:

```text
PREVIEW
```

### Local

- PostgreSQL in Docker;
- frontend/backend via npm during early development;
- full Docker Compose after first working vertical slice.

### CI

Temporary local/CI environment before Jenkins; after MVP the canonical CI environment runs on Jenkins Docker-capable agents:

```text
runner
├── PostgreSQL service
├── API
├── Web
└── Playwright
```

### Staging

- production-like;
- separate database/secrets;
- test data only;
- full regression;
- incident simulations;
- microservice/event testing post-MVP.

### Production

- separate database/secrets/runtime;
- same tested images;
- production-safe smoke only;
- monitoring and rollback.

---

## 17. Configuration

Files/examples:

```text
.env.example
.env.local
.env.test
.env.staging.example
.env.production.example
```

Backend variables:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
APP_VERSION=local
DEFAULT_TIMEZONE=Europe/Kyiv
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Rules:

- required variables validated at startup;
- fail fast;
- no `.env` inside image;
- staging/prod secrets in Secrets Manager;
- frontend public variables never contain secrets.

---

## 18. Docker strategy

### Early stage

PostgreSQL only:

```bash
docker compose up database
npm run dev:api
npm run dev:web
```

### Full local environment

```text
web
api
database
optional playwright
optional reporting-worker post-MVP
```

```bash
docker compose up --build
```

### Image strategy

```text
gymops-api:local
gymops-api:git-a7312fb
gymops-web:git-a7312fb
gymops-reporting:git-a7312fb
```

Не покладатися лише на `latest`.

### Docker requirements

- multi-stage build;
- non-root runtime where practical;
- health check;
- stdout logs;
- graceful shutdown;
- no secrets;
- pinned Node base version;
- `.dockerignore`;
- reproducible `npm ci`.

---

## 19. Test architecture

### Unit tests

Перевіряють:

- membership eligibility;
- state transitions;
- permission policies;
- duration/validation;
- idempotency logic;
- event mapping;
- error mapping.

Не використовують реальну database/network.

### Integration tests

Перевіряють real PostgreSQL/Prisma:

- migrations;
- constraints;
- transactions;
- check-in rollback;
- concurrent key/client protection;
- membership visit consumption;
- audit/outbox write;
- report aggregations.

Використовують окрему test database або Testcontainers пізніше.

### API tests — Playwright

Перевіряють:

- endpoints;
- status/error codes;
- authorization;
- tenant isolation;
- business behavior;
- idempotency;
- concurrency requests;
- contracts.

### UI tests — Playwright

Critical flows:

- login;
- create/search client;
- assign membership;
- add key;
- check-in;
- active visits;
- checkout by key;
- client history;
- manual correction;
- role isolation.

### Contract tests post-MVP

- Gateway ↔ services;
- Operations ↔ Membership;
- event schemas;
- backward compatibility;
- consumer-driven expectations за потреби.

### Resilience/event tests post-MVP

- reporting unavailable;
- duplicate/out-of-order event;
- retry/DLQ;
- timeout;
- no duplicate visit on retry;
- eventual consistency SLA.

---

## 20. CI/CD architecture

Canonical platform requirements are defined in `requirements.md` through these stories:

- `PLATFORM-01`, `PLATFORM-02` — Docker images and Docker Compose runtime;
- `CICD-01` — Jenkins Pull Request quality pipeline;
- `CLOUD-01` — AWS staging infrastructure;
- `CICD-02`, `CICD-03` — immutable ECR publication and Jenkins deployment;
- `QAOPS-01`, `QAOPS-02` — post-deploy smoke and scheduled regression;
- `REL-01` — exercised staging rollback.

`implementation-plan.md` defines their execution order and completion phases. This section defines the architecture used to satisfy those acceptance criteria.

### Lean MVP boundary for delivery

The application MVP is completed and verified locally before full containerization. PostgreSQL may run in a development container, but web/api Docker images, Jenkins and AWS are post-MVP delivery stages. This prevents infrastructure work from blocking the first testable business slice.

Canonical sequence:

```text
Local MVP -> Docker Compose -> Jenkins PR CI -> AWS staging -> Jenkins CD -> post-deploy/nightly QA
```


### Jenkins Pull Request workflow

```text
Install
  -> Lint
  -> Typecheck
  -> Unit tests
  -> Integration tests
  -> Build
  -> Start test environment
  -> Migrations
  -> API smoke
  -> UI smoke
  -> Contract checks
  -> Reports/artifacts
```

Blocking:

- lint/typecheck/build;
- unit/integration;
- migration;
- critical API/UI smoke.

### Jenkins merge-to-main / Staging

```text
Build images
  -> tag commit SHA
  -> push ECR
  -> deploy staging
  -> controlled migrations
  -> health/version
  -> post-deploy API/UI smoke
  -> publish result
```

### Nightly

- full API regression;
- UI regression;
- cross-browser;
- concurrency;
- data integrity;
- event/resilience post-MVP;
- basic performance baseline.

### Production

```text
approved staging image
  -> manual approval
  -> deploy same image
  -> health/version
  -> production-safe smoke
  -> monitoring
```

---

## 21. AWS architecture

### Modular monolith staging/production

```text
CloudFront / Amplify
        |
        v
Next.js Web
        |
        v
ALB / API endpoint
        |
        v
ECS Fargate API
        |
        v
RDS PostgreSQL

ECR             - images
Secrets Manager - secrets
CloudWatch      - logs/metrics
GitHub OIDC     - deployment auth
```

### Microservice phase

```text
API Gateway / ALB
  -> Identity ECS Service
  -> Membership ECS Service
  -> Operations ECS Service
  -> Reporting Worker ECS Service

EventBridge or SNS/SQS
  -> Reporting queue
  -> DLQ

Separate RDS databases or schemas during transitional extraction
```

### AWS isolation

Staging і production мають окремі:

- databases;
- ECS services/task definitions;
- secrets;
- URLs;
- logs/alarms;
- environment approvals.

---

## 22. Logging, metrics та tracing

### Structured log

```json
{
  "level": "info",
  "message": "Client checked in",
  "service": "gymops-api",
  "environment": "staging",
  "version": "git-a7312fb",
  "correlationId": "uuid",
  "actorId": "uuid",
  "organizationId": "uuid",
  "branchId": "uuid",
  "visitId": "uuid",
  "timestamp": "2026-07-31T16:00:00.000Z"
}
```

### Health

```text
GET /health
GET /ready
GET /version
```

### Metrics

- request count/errors/latency;
- check-in success/conflict rate;
- check-out success/conflict rate;
- active visits;
- long-running visits;
- event lag post-MVP;
- DLQ messages;
- deployment failures;
- test pass/flaky rate.

### Tracing post-MVP

Correlation ID обов’язковий з MVP. Distributed tracing додається після service extraction.

---

## 23. Security architecture

1. Password hashing.
2. Short-lived access token + rotated refresh tokens.
3. Backend RBAC і tenant/branch scoping.
4. Least-privilege AWS IAM.
5. GitHub OIDC, без long-lived keys.
6. Secrets Manager.
7. HTTPS.
8. Rate limiting.
9. Input validation.
10. No sensitive logs.
11. Audit critical actions.
12. CORS by environment.
13. Protection from IDOR by authenticated scope.

---

## 24. Rollback та migrations

### Application rollback

Повернення попередньої image revision:

```text
gymops-api:git-a7312fb -> gymops-api:git-c81d111
```

### Migration principles

- backward-compatible expand/contract;
- destructive changes не в одному release;
- migration — окремий visible deployment step;
- staging validation before production;
- rollback plan документується;
- backup/snapshot strategy для production.

### Rollback triggers

- health/readiness failed;
- critical post-deploy smoke failed;
- DB migration incompatibility;
- significant error rate;
- check-in/check-out critical defect.

---

## 25. AI implementation rules

AI повинен:

1. Прочитати всі чотири документи.
2. Визначити phase і bounded context.
3. Не генерувати весь продукт одним prompt.
4. Не створювати microservices до відповідної фази.
5. Не розділяти Visits і Locker Keys.
6. Додавати tests разом із feature.
7. Не mock-ати database в integration tests.
8. Не використовувати shared dev/staging DB для integration tests.
9. Не hardcode organization/branch/user IDs.
10. Не довіряти organizationId з request body.
11. Додавати idempotency для critical commands.
12. Додавати audit для critical changes.
13. Оновлювати Swagger і docs.
14. Після зміни надавати commands, tests, migrations і known limitations.
15. Не додавати dependency без пояснення.
16. Не використовувати fixed waits у Playwright.
17. Не вважати UI-hidden action достатнім authorization.

---

## 26. Architecture Decision Records

### ADR-001 — TypeScript across application and tests

Next.js, NestJS і Playwright використовують TypeScript для єдиного ecosystem.

### ADR-002 — Modular monolith first

MVP не починається з microservices, щоб зберегти швидкість, транзакційність і керованість.

### ADR-003 — Operations owns visits and keys

Visit lifecycle і key lifecycle беруть участь в одній business transaction.

### ADR-004 — PostgreSQL + Prisma

Relational constraints, transactions, migrations і type-safe access.

### ADR-005 — Database constraints for concurrency

Unique active visit/key assignment захищаються database-level mechanisms.

### ADR-006 — Reporting extracted first

Reporting/Audit є найбезпечнішим першим asynchronous service.

### ADR-007 — REST for commands, events for side effects

Critical user response — synchronous; reports/audit/notifications — asynchronous post-MVP.

### ADR-008 — Docker and Jenkins

Reproducible local/CI runtime, multibranch PR gates and controlled AWS delivery from a repository-owned Jenkinsfile.

### ADR-009 — ECS Fargate instead of Kubernetes

Достатньо для portfolio та microservice deployment без керування cluster nodes.

### ADR-010 — Same image promotion

Staging-tested artifact переходить у production без rebuild.

---

## 27. Поточна ціль реалізації

Перший production-like vertical slice:

```text
Staff login
  -> create/search client
  -> assign active membership
  -> add available key
  -> employee check-in
  -> active visit visible
  -> checkout by key
  -> client history updated
  -> audit created
```

Спочатку цей flow реалізується в modular monolith локально, потім контейнеризується, проходить CI, deploy-иться у staging і лише після стабілізації розширюється до microservice/event architecture.
