# GymOps — основна інструкція для AI-асистентів

## 1. Статус документа

Цей файл є **єдиною точкою входу** для Codex, Claude Code та інших AI-асистентів, які аналізують, проєктують, реалізують або тестують GymOps.

Перед будь-якою роботою AI повинен:

1. Прочитати цей файл повністю.
2. Визначити поточну delivery stage і phase у `implementation-plan.md`.
3. Знайти відповідні story IDs у `requirements.md`.
4. Відкрити лише ті layer contracts, яких стосується задача: UI, API, database, architecture або CI/CD.
5. Перевірити dependencies і exit criteria до зміни коду.

Цей файл не дублює всі контракти. Він пояснює **який документ для чого використовувати, у якому порядку їх читати та як підтримувати traceability**.

---

## 2. Мета проєкту

GymOps — навчальна mini-ERP/CRM система для спортзалів, створена як production-oriented portfolio application.

Початкова мета:

```text
Lean functional MVP
  -> local automated QA evidence
  -> full Docker runtime
  -> Jenkins Pull Request CI
  -> AWS staging infrastructure
  -> Jenkins Continuous Delivery
  -> post-deploy and nightly QA
```

Загальний product scope зберігається, але не повинен реалізовуватися раніше відповідної phase.

Критичний MVP-флоу:

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

---

## 3. Обов’язковий порядок delivery

### Stage A — Lean MVP

- Phase 0 — MVP boundary and backlog
- Phase 1 — Monorepo and local QA foundation
- Phase 2 — PostgreSQL, Prisma and API skeleton
- Phase 3 — HeroUI shell and normalized Figma designs
- Phase 4 — Authentication, roles and branch context
- Phase 5 — Employee and client CRM core
- Phase 6 — Membership and locker-key core
- Phase 7 — Check-in/check-out vertical slice
- Phase 8 — MVP QA hardening and release candidate

MVP завершений тільки після зеленого:

```bash
npm run verify:mvp
```

### Stage B — CI/CD після MVP

- Phase 9 — Full Docker runtime
- Phase 10 — Jenkins Pull Request CI
- Phase 11 — AWS staging infrastructure
- Phase 12 — Jenkins Continuous Delivery to staging
- Phase 13 — Post-deploy, nightly regression and quality evidence

### Stage C — Product expansion

- Phases 14–23 відповідно до `implementation-plan.md`.

AI не повинен:

- починати Docker/Jenkins/AWS до завершення Phase 8;
- починати microservices до Phase 20;
- підтягувати post-MVP functionality у Lean MVP без явної зміни roadmap;
- блокувати поточну phase функціональністю, запланованою у пізнішій phase.

---

## 4. Реєстр документів і їх призначення

| Файл                       | Для чого використовується       | Що в ньому є source of truth                                                     |
| -------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `AI-INSTRUCTIONS.md`       | Правила роботи AI               | Порядок читання, execution protocol, change control                              |
| `implementation-plan.md`   | Roadmap і dependency order      | Stage, phase, scope, prerequisites, exit criteria, unlocks                       |
| `requirements.md`          | Product і platform requirements | User stories, acceptance criteria, dependencies, release scope, verification     |
| `architecture.md`          | Технічні рішення                | Stack, boundaries, repository structure, layering, environments, CI/CD, AWS      |
| `ui-contract.md`           | Canonical UI registry           | Stable UI IDs, Figma roots, routes, React components, target files               |
| `ui-flows.md`              | UX specification                | Pages, dialogs, fields, actions, states, role flows, HeroUI minimum              |
| `figma-make-prompts.md`    | Figma Make generation           | Prompts, semantic node names, normalization rules                                |
| `api-requirements.md`      | HTTP contract                   | API IDs, methods, paths, request/response schemas, errors, tokens, authorization |
| `database-requirements.md` | Physical data contract          | DB IDs, tables, fields, PK/FK, constraints, indexes, migrations, retention       |
| `plan-audit.md`            | Consistency evidence            | Останній audit roadmap, dependencies і traceability                              |

### Не плутати призначення

- `implementation-plan.md` визначає **коли**, але не змінює acceptance criteria.
- `requirements.md` визначає **що і навіщо**, але не перевизначає physical API або DB schema без оновлення відповідного contract.
- `ui-flows.md` визначає UX, але не є джерелом backend business rules.
- `figma-make-prompts.md` допомагає згенерувати дизайн, але не має пріоритету над `ui-contract.md`.
- `architecture.md` визначає технічні обмеження, але не може мовчки змінити product scope.

---

## 5. Пріоритет джерел істини

Якщо документи суперечать один одному, використовувати такий порядок:

1. Явна актуальна інструкція користувача.
2. Acceptance criteria конкретної story у `requirements.md`.
3. Phase boundary, dependencies та exit criteria у `implementation-plan.md`.
4. Спеціалізований contract відповідного шару:
   - UI — `ui-contract.md`;
   - API — `api-requirements.md`;
   - DB — `database-requirements.md`.
5. `architecture.md`.
6. `ui-flows.md`.
7. `figma-make-prompts.md`.
8. Загальні припущення AI.

AI **не повинен мовчки примиряти конфлікт**.

При виявленні конфлікту:

1. Назвати документи та IDs, що конфліктують.
2. Не змінювати contract навмання.
3. Обрати найвужчу безпечну реалізацію, яка не ламає вищий за пріоритетом source of truth.
4. Оновити всі залежні документи одним change set або зафіксувати unresolved gap.
5. Для архітектурної зміни створити або запропонувати ADR.

---

## 6. Traceability model

У проєкті використовуються стабільні IDs:

| Тип           | Приклад               | Джерело                    |
| ------------- | --------------------- | -------------------------- |
| Story ID      | `VISIT-01`, `CICD-01` | `requirements.md`          |
| UI screen ID  | `SCR-REC-001`         | `ui-contract.md`           |
| UI overlay ID | `OVL-VISIT-001`       | `ui-contract.md`           |
| API ID        | `API-VISIT-001`       | `api-requirements.md`      |
| Database ID   | `DB-OPS-002`          | `database-requirements.md` |

Типовий ланцюг:

```text
VISIT-01
  -> SCR-REC-001 / OVL-VISIT-001
  -> ReceptionPage / CheckInModal
  -> API-VISIT-001
  -> DB-CRM-001 + DB-MEM-003 + DB-MEM-005 + DB-OPS-001 + DB-OPS-002
  -> unit + integration + API + UI + concurrency tests
```

Правила:

- Не перейменовувати stable IDs без міграції всіх references.
- Видимий UI text може змінитися, stable UI ID — ні.
- UI IDs не використовувати як `data-testid` за замовчуванням.
- API error handling прив’язувати до stable machine-readable error codes, а не до тексту повідомлення.
- Database physical table name не змінювати лише для зручності коду без оновлення DB contract і migration plan.

---

## 7. Що читати залежно від типу задачі

### Реалізація user story

Обов’язково прочитати:

1. Story у `requirements.md`.
2. Її phase у `implementation-plan.md`.
3. `Depends on`, `Required verification` та implementation contracts story.
4. Пов’язані sections у `api-requirements.md`, `database-requirements.md`, `ui-contract.md` і `ui-flows.md`.
5. Відповідний bounded context у `architecture.md`.

### Реалізація frontend page або dialog

Прочитати:

1. `ui-contract.md` — UI ID, route, component, target file.
2. `ui-flows.md` — fields, actions, states, HeroUI components.
3. Відповідний prompt у `figma-make-prompts.md`.
4. Пов’язані stories у `requirements.md`.
5. API contracts, які викликає UI.

### Реалізація backend endpoint

Прочитати:

1. Endpoint section у `api-requirements.md`.
2. Пов’язані stories.
3. Пов’язані DB IDs.
4. Authorization, branch scope, idempotency та errors.
5. Backend layering у `architecture.md`.

### Реалізація migration або repository

Прочитати:

1. Table section у `database-requirements.md`.
2. Пов’язані stories та API endpoints.
3. Required constraints, indexes і database tests.
4. Transaction і concurrency rules у `architecture.md`.

### Реалізація automation tests

Прочитати:

1. `Required verification` story.
2. Acceptance criteria.
3. API errors і status codes.
4. DB invariants.
5. UI states та semantic locators.
6. Phase quality gates у `implementation-plan.md`.

### Docker, Jenkins або AWS

Прочитати:

1. Platform story у `requirements.md`:
   - `PLATFORM-01..02`;
   - `CICD-01..03`;
   - `CLOUD-01`;
   - `QAOPS-01..02`;
   - `REL-01`.
2. Phases 9–13 у `implementation-plan.md`.
3. Sections Docker, CI/CD, AWS, security, rollback у `architecture.md`.
4. `plan-audit.md`.

---

## 8. Обов’язковий workflow реалізації story

### Step 1 — Select

- Взяти лише story, дозволену поточною phase.
- Перевірити `Depends on`.
- Не об’єднувати unrelated stories в один change set.

### Step 2 — Build implementation matrix

Перед кодом скласти коротку матрицю:

```text
Story ID:
Phase:
Dependencies:
UI IDs:
API IDs:
DB IDs:
Permissions:
Required tests:
Expected evidence:
```

### Step 3 — Design and data first

Якщо story змінює дані:

1. Оновити Prisma schema/migration відповідно до DB contract.
2. Додати constraints та indexes.
3. Додати migration/integration tests.
4. Не покладатися лише на application validation.

### Step 4 — Domain and backend

Порядок:

```text
Domain rules/policies
  -> application service/use case
  -> repository interface
  -> Prisma repository
  -> controller/transport
```

Controllers не повинні містити business logic.

### Step 5 — API contract

- Реалізувати exact method/path/schema із `api-requirements.md`.
- Оновити OpenAPI.
- Реалізувати authorization, tenant/branch checks.
- Використовувати canonical error model та error codes.
- Для critical commands реалізувати idempotency/concurrency requirements.

### Step 6 — Frontend

- Використовувати existing HeroUI і GymOps components.
- Не створювати дублікати Button/Input/Modal/Table primitives.
- Дотримуватися exact route, UI ID і React component mapping.
- Реалізувати required states: default, loading, empty, validation, error, conflict і success — де застосовно.
- Не переносити backend business rules у frontend як єдиний захист.

### Step 7 — Tests

Мінімум визначається story, але загальна модель:

- unit — domain rules та pure business logic;
- integration — NestJS/Prisma/PostgreSQL, transactions і constraints;
- API — HTTP contract, authorization, validation, errors, idempotency;
- UI — critical user behavior через browser;
- concurrency — duplicate client/key operations;
- migration — empty database та upgrade path.

### Step 8 — Evidence

До завершення change set надати:

- список реалізованих IDs;
- виконані команди;
- результати тестів;
- OpenAPI або migration diff, якщо застосовно;
- screenshots/traces/logs лише як допоміжні artifacts;
- відомі обмеження.

### Step 9 — Update documentation

Оновлювати лише ті canonical documents, чий contract реально змінився.

### Step 10 — Definition of Done

Story Done тільки коли виконані acceptance criteria, required verification і exit criteria поточної phase.

---

## 9. Lean MVP guardrails

### У MVP дозволено

- seeded organization і branch;
- seeded `SUPER_ADMIN` і `GYM_ADMIN` для local/CI;
- staff login/logout/refresh/RBAC;
- create employee;
- create/search/view client core;
- create membership plan;
- assign/validate/consume membership;
- add/list locker keys;
- check-in/check-out;
- active visits;
- client visit history;
- backend audit evidence;
- local unit/integration/API/UI automation.

### У MVP не додавати

- organization/branch CRUD;
- full staff lifecycle;
- client block/edit lifecycle beyond MVP contract;
- membership freeze;
- key incident statuses beyond MVP contract;
- visit correction/auto-close;
- incidents UI;
- audit UI та reports;
- client portal;
- events/microservices;
- Jenkins/AWS before Phase 9;
- production infrastructure.

Якщо реалізація MVP вимагає post-MVP story, це ознака неправильного dependency design. Спочатку перевірити `implementation-plan.md` і `plan-audit.md`.

---

## 10. Незмінні архітектурні рішення

Без окремого ADR не змінювати:

- TypeScript across frontend, backend and tests;
- Next.js + React;
- HeroUI + Tailwind CSS;
- NestJS;
- REST + OpenAPI;
- PostgreSQL + Prisma;
- Jest;
- Playwright + TypeScript;
- npm workspaces;
- modular monolith first;
- Jenkins як primary CI/CD після MVP;
- Docker Compose для local/CI runtime;
- AWS ECS Fargate, ECR, RDS PostgreSQL, CloudWatch, Secrets Manager;
- Visits і Locker Keys в одному Gym Operations bounded context;
- database constraints для critical invariants;
- same Docker artifact promotion.

Не додавати без ADR:

- Java/Spring/Maven;
- Python backend;
- MongoDB;
- GraphQL;
- Kubernetes/EKS;
- Kafka;
- другий ORM;
- другий UI framework;
- microservice на кожну table.

---

## 11. Frontend і Figma rules

- HeroUI є єдиним UI framework.
- `ui-contract.md` є canonical registry.
- Figma frame має бути normalized до реалізації.
- Використовувати Auto Layout, semantic node names і variables.
- Реальні React component names і routes повинні відповідати UI contract.
- Figma Make output не вважається Ready for Development автоматично.
- Після генерації виконувати normalization pass із `figma-make-prompts.md`.
- Для accessibility використовувати semantic HTML, labels, keyboard navigation і visible focus.
- Для Playwright віддавати перевагу:

```text
getByRole()
getByLabel()
getByText()
```

`data-testid` використовувати лише коли semantic locator об’єктивно неоднозначний.

---

## 12. API rules

Canonical details — у `api-requirements.md`.

Незмінний мінімум:

- API version prefix: `/api/v1` для business API;
- REST semantics;
- OpenAPI актуальний у тому ж change set;
- UTC timestamps;
- stable machine-readable error codes;
- Problem Details error response;
- backend authorization для кожної protected operation;
- organization/branch isolation;
- idempotency key для critical commands;
- optimistic concurrency там, де визначено contract;
- access token не передавати через URL;
- refresh token policy не спрощувати без security review.

Frontend не повинен залежати від тексту `message` для визначення бізнес-помилки.

---

## 13. Database rules

Canonical details — у `database-requirements.md`.

Незмінний мінімум:

- PostgreSQL — production і integration-test database;
- Prisma migrations version-controlled;
- UUID identifiers відповідно до DB contract;
- timestamps у UTC;
- tenant/branch isolation;
- critical invariants захищені constraints/indexes;
- check-in і key assignment — одна transaction;
- check-out і key release — одна transaction;
- один active visit на client;
- один active assignment на locker key;
- idempotency records для critical commands;
- no hard delete для historical business entities, якщо contract не каже інакше;
- migration test на empty DB;
- integration tests не запускаються проти dev/staging/production DB.

---

## 14. Testing rules

Кожен test повинен бути:

- deterministic;
- independent;
- повторюваний локально та в CI;
- із контрольованими даними;
- без fixed sleep/wait;
- із meaningful assertion;
- із cleanup або isolated environment.

Не дублювати однакову перевірку на кожному рівні без причини.

Орієнтир:

```text
Business formula/policy        -> unit
Prisma/PostgreSQL invariant    -> integration
HTTP contract/authorization    -> API
Critical user journey          -> UI E2E
Distributed event behavior     -> post-MVP contract/resilience
```

Для critical controls довести, що test/gate падає після навмисного дефекту.

MVP release command:

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

Wrapper:

```bash
npm run verify:mvp
```

---

## 15. Docker, Jenkins і AWS rules

### Docker

- Починається після Phase 8.
- Multi-stage images.
- Non-root runtime user.
- No secrets in image.
- Controlled migration job.
- Health checks і graceful shutdown.
- Same commands локально та в Jenkins.

### Jenkins

Jenkins — primary CI/CD system після MVP.

PR pipeline повинен включати:

```text
Checkout
  -> npm ci
  -> lint
  -> typecheck
  -> unit
  -> PostgreSQL integration
  -> migrations
  -> build
  -> Docker image build
  -> Docker Compose test stack
  -> health/version
  -> OpenAPI validation
  -> API smoke
  -> UI smoke
  -> artifacts
  -> cleanup
```

Merge-to-main pipeline:

```text
Build immutable image
  -> tag commit SHA
  -> push ECR
  -> run migration task
  -> deploy ECS Fargate
  -> wait for stability
  -> verify health/readiness/version
  -> post-deploy API/UI smoke
  -> publish evidence
```

### AWS

- Infrastructure as Code.
- Least privilege.
- Jenkins-to-AWS через IAM role / STS assume-role.
- No long-lived static AWS keys.
- ECR immutable tags.
- RDS PostgreSQL.
- ECS Fargate.
- CloudWatch logs/metrics.
- Secrets Manager.
- Failed mandatory smoke не вважається successful deployment.
- Rollback acceptance criteria визначені `REL-01`.

---

## 16. Change control

### Якщо змінюється product behavior

Перевірити й за потреби оновити:

- `requirements.md`;
- `implementation-plan.md`;
- `ui-flows.md`;
- `ui-contract.md`;
- `api-requirements.md`;
- `database-requirements.md`;
- tests.

### Якщо змінюється UI

Оновити:

- UI registry;
- Figma prompt/node names;
- flow specification;
- related stories;
- frontend components/routes;
- UI tests.

### Якщо змінюється API

Оновити:

- API contract;
- OpenAPI;
- related stories;
- shared frontend contracts/client;
- DB mapping, якщо змінилися data requirements;
- API та UI tests.

### Якщо змінюється database

Оновити:

- DB contract;
- Prisma schema/migration;
- story traceability;
- API schema, якщо зовнішній contract змінюється;
- integration/migration tests.

### Якщо змінюється phase або scope

Оновити:

- `implementation-plan.md`;
- story metadata у `requirements.md`;
- API/DB implementation phases;
- `plan-audit.md`;
- known limitations.

### Якщо змінюється architecture

- Створити ADR.
- Описати alternatives, trade-offs, migration, test і deployment impact.
- Не змінювати stack або boundaries мовчки.

---

## 17. Заборонені поведінки AI

AI не повинен:

- вигадувати відсутні acceptance criteria;
- додавати endpoint, table або screen без stable ID/traceability;
- змінювати API path чи DB schema лише через особисту перевагу;
- реалізовувати post-MVP scope під час MVP;
- замінювати HeroUI власним UI kit;
- використовувати mock замість required PostgreSQL integration test;
- вважати unit tests достатньою перевіркою transaction/constraint behavior;
- використовувати production/staging DB для automated tests;
- зберігати secrets у repository, Docker image або logs;
- використовувати long-lived AWS keys;
- відключати failing test/gate, щоб отримати green pipeline;
- залишати OpenAPI, docs або traceability застарілими після contract change;
- заявляти, що задача завершена, без виконаних required checks.

---

## 18. Формат звіту AI після виконання задачі

Після implementation task AI має коротко вказати:

```text
Implemented:
- Story IDs
- UI/API/DB IDs

Changed:
- Main files/modules
- Migrations/contracts

Verified:
- Commands executed
- Tests passed
- Evidence produced

Not implemented:
- Deferred scope
- Known limitations

Documentation:
- Canonical files updated
```

Не приховувати failed checks або неповну реалізацію.

---

## 19. Definition of Ready для початку задачі

Задача готова до реалізації, якщо:

- відома phase;
- відомий story/platform ID;
- dependencies завершені;
- acceptance criteria не суперечливі;
- UI/API/DB IDs відомі або явно не застосовуються;
- architecture boundary визначений;
- required verification визначена;
- немає dependency на пізнішу mandatory phase.

Якщо один із пунктів відсутній, AI спочатку повинен виправити або зафіксувати contract gap, а не маскувати його кодом.

---

## 20. Definition of Done для AI change set

Change set завершений, якщо:

- реалізований лише дозволений scope;
- acceptance criteria виконані;
- stable IDs і contracts збережені;
- required tests зелені;
- migration/OpenAPI/UI states оновлені, якщо застосовно;
- cleanup, logging, error handling і security не погіршені;
- документація синхронізована;
- поточна phase exit criteria наближена або виконана;
- зміна розблоковує наступний крок, а не створює залежність від нього.

---

## 21. Перша дія для нового AI-сеансу

AI повинен почати з відповіді на чотири внутрішні питання:

```text
1. Яка поточна phase?
2. Який story/platform ID я реалізую?
3. Які UI/API/DB IDs до нього прив’язані?
4. Який exact quality gate доведе завершення?
```

Лише після цього переходити до коду, дизайну, тестів або infrastructure.
