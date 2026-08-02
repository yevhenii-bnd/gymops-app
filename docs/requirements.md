# Вимоги до GymOps

## 1. Призначення документа

Цей документ є основним джерелом продуктових і platform/enabler вимог для GymOps — навчальної mini-ERP/CRM платформи для управління спортзалами та демонстрації QA automation, Docker, Jenkins CI/CD і AWS delivery.

Вимоги описані окремими user stories з acceptance criteria. AI-асистент повинен використовувати цей файл разом із:

- `architecture.md` — технічні рішення;
- `implementation-plan.md` — порядок реалізації;
- `ui-flows.md` — UX-флоу, сторінки та модальні вікна;
- `database-requirements.md` — таблиці, constraints, indexes, migrations і story-to-table traceability;
- `api-requirements.md` — HTTP endpoints, schemas, error model і token policy;
- `ui-contract.md` — stable UI IDs, Figma roots, routes і React components;
- `figma-make-prompts.md` — prompts і semantic layer naming для Figma Make.

Перед реалізацією story AI повинен:

1. Перевірити залежності story.
2. Не змінювати acceptance criteria мовчки.
3. Визначити потрібні API, database migrations і permissions.
4. Додати unit, integration, API та UI tests відповідно до ризику.
5. Оновити Swagger і документацію.

## 1.1. Обов’язкові metadata кожної story

Кожна user story містить:

- **Release scope** — MVP, Post-MVP або Cross-cutting;
- **Priority** — `P0` критичний core flow, `P1` важлива функція, `P2` optional improvement;
- **Implementation phase(s)** — фаза, у якій story повинна бути завершена;
- **Depends on** — product stories або технічні prerequisites, які мають бути завершені раніше;
- **Primary module** — модуль, що володіє бізнес-правилом;
- **Required verification** — мінімальні рівні тестування та evidence;
- **UI/API/Database implementation contracts** — для product stories, якщо відповідний шар зачіпається;
- **Platform implementation contract** — для Docker, Jenkins, AWS, deployment, rollback та scheduled QA stories.

`Implementation phase(s)` визначає **completion phase**, а не момент першої появи технічної заготовки. Наприклад, audit infrastructure починається раніше, але `AUDIT-01` вважається завершеною у Phase 7 та розширюється у наступних фазах. Platform story вважається завершеною тільки після виконання її acceptance criteria у реальному або production-like середовищі та збереження перевірюваних artifacts/evidence.

## 1.2. Story-level Definition of Done

Story вважається завершеною, якщо:

1. Усі acceptance criteria виконані.
2. Усі dependencies завершені або явно замінені approved stub/contract.
3. Для product story permissions, tenant та branch scope перевірені на backend, якщо застосовно.
4. Database migration відтворюється на чистій test database, якщо schema змінювалася.
5. Swagger/OpenAPI та shared contracts оновлені, якщо змінювався API.
6. Для platform story створені й version-controlled усі зазначені Docker/Jenkins/IaC/pipeline artifacts.
7. Required verification із metadata реалізована та проходить у визначеному середовищі: local, containerized CI або AWS staging.
8. Для критичної бізнес-логіки або delivery gate доведено, що контроль падає після навмисного дефекту чи невдалого deployment condition.
9. Audit, correlation ID, logs, error codes, deployment metadata та failure evidence додані, якщо застосовно.
10. Документація, runbook, test data strategy та cleanup/rollback procedure оновлені, якщо їх стосується story.
11. Story має окремий commit або pull request, перевірюваний evidence і може бути продемонстрована.

---

## 2. Опис продукту

GymOps допомагає мережі спортзалів керувати:

- організаціями та філіями;
- працівниками рецепції;
- клієнтами;
- абонементами;
- ключами від роздягалень;
- check-in/check-out тренувань;
- активними відвідуваннями;
- інцидентами;
- audit log;
- звітами.

Головний операційний флоу:

```text
Працівник знаходить клієнта
  -> система перевіряє доступ до тренування
  -> працівник видає ключ
  -> система відкриває активне відвідування
  -> клієнт повертає ключ
  -> працівник вводить номер ключа
  -> система закриває відвідування
  -> тренування зберігається в історії клієнта
```

---

## 3. Терміни

| Термін          | Значення                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| Organization    | Компанія або мережа спортзалів                                              |
| Branch          | Окрема філія спортзалу                                                      |
| Staff User      | Працівник, який має обліковий запис і входить у систему                     |
| Client          | Клієнт спортзалу; у MVP це CRM-запис без власного login                     |
| Membership Plan | Шаблон типу абонемента                                                      |
| Membership      | Абонемент, призначений конкретному клієнту                                  |
| Locker Key      | Ключ від роздягальні або шафки                                              |
| Visit Session   | Одне відвідування/тренування клієнта                                        |
| Active Visit    | Відвідування без часу завершення                                            |
| Incident        | Проблемна ситуація: втрачений ключ, пошкодження, некоректний check-out тощо |
| Audit Log       | Незмінювана історія важливих дій                                            |

---

## 4. Ролі

### SUPER_ADMIN

- керує всією платформою;
- створює організації та філії;
- призначає Gym Admin;
- бачить усі організації;
- блокує організації;
- переглядає system audit.

### GYM_ADMIN

- керує своєю організацією та дозволеними філіями;
- створює працівників;
- створює клієнтів;
- керує абонементами;
- керує ключами;
- виправляє відвідування;
- переглядає звіти та audit.

### EMPLOYEE

- працює на рецепції;
- шукає клієнтів;
- виконує check-in;
- видає ключі;
- виконує check-out за номером ключа;
- бачить активні відвідування;
- реєструє інциденти.

### CLIENT

У MVP клієнт не входить у систему. Client Portal є post-MVP функціональністю.

---

## 5. Загальні бізнес-правила

1. Staff user працює лише в межах своєї organization.
2. Employee працює лише у дозволених branch.
3. Один клієнт не може мати більше одного ACTIVE visit одночасно в межах organization.
4. Один ключ не може бути одночасно виданий двом клієнтам.
5. Check-in та видача ключа повинні бути однією атомарною транзакцією.
6. Check-out та повернення ключа повинні бути однією атомарною транзакцією.
7. Повторний однаковий request не повинен створювати дубльоване відвідування.
8. Усі timestamps зберігаються в UTC і відображаються у timezone філії.
9. Історичні дані не повинні змінюватися через редагування плану абонемента.
10. Manual correction потребує причини й створює audit record.
11. Hard delete для client, visit, membership та audit не використовується в MVP.

---

<!-- BEGIN GENERATED UI TRACEABILITY RULES -->

## 5.1. UI/Figma/frontend traceability rules

The canonical naming registry is stored in `ui-contract.md`.

Each story includes a generated **UI implementation contract** with:

- stable screen and overlay UI IDs;
- exact Figma root node names resolved through `ui-contract.md`;
- frontend routes;
- exact future React page/component names.

UI IDs are stable. Visible text and product wording may change, but UI IDs, Figma root names and frontend component contracts must be updated through the registry rather than independently.

Backend-only or concurrency stories may not own a dedicated screen. In that case they are connected to the screen state that exposes their outcome, such as `ConcurrencyConflictAlert`, `NetworkUncertaintyAlert` or `ConsistencyStatusIndicator`.
<!-- END GENERATED UI TRACEABILITY RULES -->

# Epic 1 — Authentication та access control

## AUTH-01 — Login staff user

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 4  
**Depends on:** Technical foundation from Phases 1–3  
**Primary module:** Identity  
**Required verification:** Unit, integration, API; UI smoke for critical session and access flows; security/negative authorization checks

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-AUTH-001`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-AUTH-001/Auth/StaffLogin/Desktop/Default`.
- Frontend route scope: `/login`.
- Required frontend components: `StaffLoginPage, StaffLoginForm`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-001`, `DB-IDN-003`, `DB-AUD-001`.
- Physical tables/read models: `identity.staff_users`, `identity.refresh_tokens`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUTH-001` `POST /api/v1/auth/login`, `API-AUTH-004` `GET /api/v1/auth/me`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Staff User,  
**я хочу** увійти за email та password,  
**щоб** отримати доступ до дозволених функцій.

### Acceptance criteria

1. Активний Staff User може увійти з правильними credentials.
2. Неправильний email або password повертає однакове повідомлення без розкриття, яке поле неправильне.
3. Deactivated Staff User не може увійти.
4. Успішний login створює access token і refresh token.
5. Response містить user ID, role, organization ID та branch assignments.
6. Login action записується в security audit.
7. Після кількох невдалих спроб застосовується rate limiting або тимчасове блокування.

### Test requirements

- unit: credential policy;
- integration: password hash і refresh token persistence;
- API: positive, invalid, deactivated, rate limit;
- UI: critical login smoke.

---

## AUTH-02 — Logout

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 4  
**Depends on:** AUTH-01  
**Primary module:** Identity  
**Required verification:** Unit, integration, API; UI smoke for critical session and access flows; security/negative authorization checks

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-PROFILE-001`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-PROFILE-001/Staff/Profile/Desktop/Default`.
- Frontend route scope: `/app/profile`.
- Required frontend components: `AppShell, ProfileMenu, LogoutAction`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-003`, `DB-AUD-001`.
- Physical tables/read models: `identity.refresh_tokens`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUTH-003` `POST /api/v1/auth/logout`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Staff User,  
**я хочу** вийти із системи,  
**щоб** завершити сесію.

### Acceptance criteria

1. Logout invalidates current refresh token.
2. Access до protected endpoint після закінчення access token потребує нового login.
3. Повторний logout є idempotent і не повертає server error.
4. UI очищає локальну session state.

---

## AUTH-03 — Refresh access token

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 4  
**Depends on:** AUTH-01  
**Primary module:** Identity  
**Required verification:** Unit, integration, API; UI smoke for critical session and access flows; security/negative authorization checks

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-AUTH-001`.
- Overlay UI IDs: `OVL-AUTH-001`.
- Exact Figma roots: `Screen/SCR-AUTH-001/Auth/StaffLogin/Desktop/Default`, `Overlay/OVL-AUTH-001/Auth/SessionExpired/Default`.
- Frontend route scope: `/login`.
- Required frontend components: `SessionProvider, SessionExpiredModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-003`.
- Physical tables/read models: `identity.refresh_tokens`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: staff refresh-token rotation, expiry, revocation and replay-detection tests against real PostgreSQL.
- Client Portal refresh is a separate Phase 19 contract owned by `PORTAL-01`.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUTH-002` `POST /api/v1/auth/refresh`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: staff refresh rotation, expired/revoked/malformed token cases, replay detection and cookie-policy tests.
- Client Portal refresh is not part of this story and is implemented only with `PORTAL-01` in Phase 19.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Staff User,  
**я хочу** продовжити активну сесію без повторного login,  
**щоб** не втрачати роботу.

### Acceptance criteria

1. Валідний refresh token видає новий access token.
2. Revoked, expired або malformed token відхиляється.
3. Refresh token rotation застосовується згідно з архітектурою.
4. Старий rotated token не може бути повторно використаний.

---

## AUTH-04 — Role-based access

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 4  
**Depends on:** AUTH-01  
**Primary module:** Identity  
**Required verification:** Unit, integration, API; UI smoke for critical session and access flows; security/negative authorization checks

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-SYS-403`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-SYS-403/System/Forbidden/Desktop/Default`.
- Frontend route scope: `/403`.
- Required frontend components: `AppShell, RoleGuard, ForbiddenPage`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-001`, `DB-IDN-002`.
- Physical tables/read models: `identity.staff_users`, `identity.staff_branch_assignments`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUTH-004` `GET /api/v1/auth/me`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** власник платформи,  
**я хочу** обмежувати функції за ролями,  
**щоб** користувачі бачили лише дозволені операції.

### Acceptance criteria

1. SUPER_ADMIN має platform-wide scope.
2. GYM_ADMIN не бачить чужі organization.
3. EMPLOYEE не має доступу до system configuration, staff management і destructive admin actions.
4. Direct API request до недозволеного endpoint повертає `403`.
5. Приховане меню в UI не замінює backend authorization.
6. Спроба доступу записується в security log за потреби.

---

## AUTH-05 — Branch-scoped access

**Release scope:** Post-MVP product expansion  
**Priority:** `P0`  
**Implementation phase(s):** Phase 15  
**Depends on:** AUTH-04, BRANCH-01, STAFF-03  
**Primary module:** Identity  
**Required verification:** Unit, integration, API; UI smoke for critical session and access flows; security/negative authorization checks

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-SYS-403`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-SYS-403/System/Forbidden/Desktop/Default`.
- Frontend route scope: staff management and all branch-scoped protected routes.
- Required frontend components: `BranchSelector, BranchGuard, ForbiddenPage`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- Later feature screens inherit the same guard contract without becoming prerequisites for this story.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-001`, `DB-ORG-002`, `DB-IDN-001`, `DB-IDN-002`.
- Physical tables/read models: `identity.organizations`, `identity.branches`, `identity.staff_users`, `identity.staff_branch_assignments`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUTH-004` `GET /api/v1/auth/me`, `API-BRANCH-001` `GET /api/v1/organizations/{organizationId}/branches`, `API-BRANCH-003` `GET /api/v1/branches/{branchId}`, `API-STAFF-005` `PUT /api/v1/staff/{staffUserId}/branch-assignments`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Gym Admin,  
**я хочу** призначити працівнику одну або кілька філій,  
**щоб** він працював лише з їхніми даними.

### Acceptance criteria

1. Employee бачить клієнтів, ключі й відвідування лише дозволених branch.
2. Employee не може підмінити branch ID у request.
3. Однаковий номер ключа може існувати в різних branch.
4. Зміна branch assignment набуває чинності після оновлення session/permissions.

---

# Epic 2 — Organizations та branches

## ORG-01 — Create organization

**Release scope:** Post-MVP product expansion  
**Priority:** `P0`  
**Implementation phase(s):** Phase 14  
**Depends on:** AUTH-01, AUTH-04  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; tenant isolation, authorization and audit verification

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-ORG-001`.
- Overlay UI IDs: `OVL-ORG-001`.
- Exact Figma roots: `Screen/SCR-ORG-001/SuperAdmin/OrganizationsList/Desktop/Default`, `Overlay/OVL-ORG-001/Organization/Create/Default`.
- Frontend route scope: `/super-admin/organizations`.
- Required frontend components: `OrganizationsPage, CreateOrganizationModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-001`, `DB-AUD-001`.
- Physical tables/read models: `identity.organizations`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-ORG-001` `GET /api/v1/organizations`, `API-ORG-002` `POST /api/v1/organizations`, `API-ORG-003` `GET /api/v1/organizations/{organizationId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** SUPER_ADMIN,  
**я хочу** створити organization,  
**щоб** підключити новий спортзал або мережу.

### Acceptance criteria

1. Обов’язкові поля: name, legal/display name, timezone, status.
2. Organization отримує унікальний ID та slug.
3. Duplicate slug відхиляється.
4. Нова organization має status `ACTIVE` за замовчуванням або явно заданий status.
5. Створення логуються в audit.

---

## ORG-02 — Edit organization

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 14  
**Depends on:** AUTH-04, bootstrap organization from Phase 2  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; tenant isolation, authorization and audit verification

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-ORG-001, SCR-ORG-002, SCR-SETTINGS-001`.
- Overlay UI IDs: `OVL-ORG-002`.
- Exact Figma roots: `Screen/SCR-ORG-001/SuperAdmin/OrganizationsList/Desktop/Default`, `Screen/SCR-ORG-002/SuperAdmin/OrganizationDetails/Desktop/Overview`, `Screen/SCR-SETTINGS-001/GymAdmin/OrganizationSettings/Desktop/Default`, `Overlay/OVL-ORG-002/Organization/Edit/Default`.
- Frontend route scope: `organization routes`.
- Required frontend components: `OrganizationDetailsPage, EditOrganizationModal, OrganizationSettingsPage`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-001`, `DB-AUD-001`.
- Physical tables/read models: `identity.organizations`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-ORG-001` `GET /api/v1/organizations`, `API-ORG-003` `GET /api/v1/organizations/{organizationId}`, `API-ORG-004` `PATCH /api/v1/organizations/{organizationId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** SUPER_ADMIN,  
**я хочу** редагувати organization,  
**щоб** підтримувати актуальні дані.

### Acceptance criteria

1. Дозволено змінювати name, contacts, timezone і settings.
2. Organization ID незмінний.
3. Old/new values записуються в audit.
4. Зміна timezone не переписує історичні UTC timestamps.

---

## ORG-03 — Deactivate organization

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 14  
**Depends on:** AUTH-04, bootstrap organization from Phase 2  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; tenant isolation, authorization and audit verification

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-ORG-001, SCR-ORG-002`.
- Overlay UI IDs: `OVL-ORG-003`.
- Exact Figma roots: `Screen/SCR-ORG-001/SuperAdmin/OrganizationsList/Desktop/Default`, `Screen/SCR-ORG-002/SuperAdmin/OrganizationDetails/Desktop/Overview`, `Overlay/OVL-ORG-003/Organization/Deactivate/Default`.
- Frontend route scope: `organization routes`.
- Required frontend components: `DeactivateOrganizationAlertDialog, OrganizationStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-001`, `DB-ORG-002`, `DB-AUD-001`.
- Physical tables/read models: `identity.organizations`, `identity.branches`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-ORG-001` `GET /api/v1/organizations`, `API-ORG-005` `POST /api/v1/organizations/{organizationId}/deactivate`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** SUPER_ADMIN,  
**я хочу** деактивувати organization,  
**щоб** зупинити доступ без видалення історії.

### Acceptance criteria

1. Staff users деактивованої organization не можуть login.
2. Дані organization не видаляються.
3. API requests із чинним token блокуються після застосування статусу.
4. Повторна активація можлива.
5. Причина деактивації зберігається в audit.

---

## BRANCH-01 — Create branch

**Release scope:** Post-MVP product expansion  
**Priority:** `P0`  
**Implementation phase(s):** Phase 14  
**Depends on:** AUTH-04, bootstrap organization from Phase 2  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; tenant isolation, authorization and audit verification

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-ORG-002, SCR-SETTINGS-002`.
- Overlay UI IDs: `OVL-BRANCH-001, OVL-BRANCH-002`.
- Exact Figma roots: `Screen/SCR-ORG-002/SuperAdmin/OrganizationDetails/Desktop/Overview`, `Screen/SCR-SETTINGS-002/GymAdmin/BranchSettings/Desktop/Default`, `Overlay/OVL-BRANCH-001/Branch/Create/Default`, `Overlay/OVL-BRANCH-002/Branch/Edit/Default`.
- Frontend route scope: `branch routes`.
- Required frontend components: `CreateBranchModal, EditBranchModal, BranchSettingsPage`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-001`, `DB-ORG-002`, `DB-AUD-001`.
- Physical tables/read models: `identity.organizations`, `identity.branches`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-BRANCH-001` `GET /api/v1/organizations/{organizationId}/branches`, `API-BRANCH-002` `POST /api/v1/organizations/{organizationId}/branches`, `API-BRANCH-003` `GET /api/v1/branches/{branchId}`, `API-BRANCH-004` `PATCH /api/v1/branches/{branchId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** SUPER_ADMIN або дозволений GYM_ADMIN,  
**я хочу** створити branch,  
**щоб** управляти окремою локацією.

### Acceptance criteria

1. Branch належить рівно одній organization.
2. Обов’язкові поля: name, address, timezone, status.
3. Branch code унікальний у межах organization.
4. Branch створюється без автоматичного копіювання ключів або працівників.
5. Подія створення логуються.

---

## BRANCH-02 — Deactivate branch

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 14  
**Depends on:** BRANCH-01, AUTH-04  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; tenant isolation, authorization and audit verification

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-ORG-002, SCR-SETTINGS-002`.
- Overlay UI IDs: `OVL-BRANCH-003`.
- Exact Figma roots: `Screen/SCR-ORG-002/SuperAdmin/OrganizationDetails/Desktop/Overview`, `Screen/SCR-SETTINGS-002/GymAdmin/BranchSettings/Desktop/Default`, `Overlay/OVL-BRANCH-003/Branch/Deactivate/Default`.
- Frontend route scope: `branch routes`.
- Required frontend components: `DeactivateBranchAlertDialog, BranchStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-002`, `DB-IDN-002`, `DB-AUD-001`.
- Physical tables/read models: `identity.branches`, `identity.staff_branch_assignments`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-BRANCH-001` `GET /api/v1/organizations/{organizationId}/branches`, `API-BRANCH-005` `POST /api/v1/branches/{branchId}/deactivate`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** деактивувати branch,  
**щоб** припинити нові операції в закритій філії.

### Acceptance criteria

1. Нові check-in у branch заборонені.
2. Активні visits повинні бути завершені або виправлені до final deactivation згідно з policy.
3. Історія зберігається.
4. Employee assignments не видаляються.

---

# Epic 3 — Staff management

## STAFF-01 — Create Gym Admin

**Release scope:** Post-MVP product expansion  
**Priority:** `P0`  
**Implementation phase(s):** Phase 14  
**Depends on:** AUTH-04, bootstrap organization from Phase 2  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; password handling, authorization, tenant isolation and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-ORG-002`.
- Overlay UI IDs: `OVL-STAFF-001`.
- Exact Figma roots: `Screen/SCR-ORG-002/SuperAdmin/OrganizationDetails/Desktop/Overview`, `Overlay/OVL-STAFF-001/Staff/CreateGymAdmin/Default`.
- Frontend route scope: `/super-admin/organizations/[organizationId]`.
- Required frontend components: `OrganizationDetailsPage, CreateGymAdminModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- The organization-wide staff list is introduced in Phase 5 and is not required to complete `STAFF-01`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-001`, `DB-IDN-002`, `DB-AUD-001`.
- Physical tables/read models: `identity.staff_users`, `identity.staff_branch_assignments`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-STAFF-001` `GET /api/v1/organizations/{organizationId}/staff`, `API-STAFF-002` `POST /api/v1/organizations/{organizationId}/staff`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** SUPER_ADMIN,  
**я хочу** створити Gym Admin для organization,  
**щоб** делегувати управління спортзалом.

### Acceptance criteria

1. Email унікальний у platform scope.
2. Role фіксується як `GYM_ADMIN`.
3. User прив’язаний до organization.
4. Temporary password або invitation flow підтримується.
5. Password не зберігається у plain text.
6. Створення логуються.

---

## STAFF-02 — Create employee

**Release scope:** MVP core  
**Priority:** `P1`  
**Implementation phase(s):** Phase 5  
**Depends on:** AUTH-04, bootstrap organization/branch and seeded GYM_ADMIN from Phase 2  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; branch scope, session invalidation and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-STAFF-001`.
- Overlay UI IDs: `OVL-STAFF-002`.
- Exact Figma roots: `Screen/SCR-STAFF-001/GymAdmin/StaffList/Desktop/Default`, `Overlay/OVL-STAFF-002/Staff/CreateEmployee/Default`.
- Frontend route scope: `/app/staff`.
- Required frontend components: `StaffPage, CreateEmployeeModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-001`, `DB-IDN-002`, `DB-AUD-001`.
- Physical tables/read models: `identity.staff_users`, `identity.staff_branch_assignments`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-STAFF-001` `GET /api/v1/organizations/{organizationId}/staff`, `API-STAFF-002` `POST /api/v1/organizations/{organizationId}/staff`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** створити працівника рецепції,  
**щоб** він виконував check-in/check-out.

### Acceptance criteria

1. Обов’язкові поля: first name, last name, email, role, branch assignments.
2. Role для MVP — `EMPLOYEE`.
3. Працівник не може бути прив’язаний до branch іншої organization.
4. Необхідно призначити щонайменше одну branch.
5. Створення логуються.

---

## STAFF-03 — Edit employee

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 15  
**Depends on:** STAFF-02, AUTH-05  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; branch scope, session invalidation and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-STAFF-001`.
- Overlay UI IDs: `DRW-STAFF-001, OVL-STAFF-003`.
- Exact Figma roots: `Screen/SCR-STAFF-001/GymAdmin/StaffList/Desktop/Default`, `Overlay/DRW-STAFF-001/Staff/Details/Default`, `Overlay/OVL-STAFF-003/Staff/EditEmployee/Default`.
- Frontend route scope: `/app/staff`.
- Required frontend components: `StaffDetailsDrawer, EditEmployeeModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-001`, `DB-IDN-002`, `DB-AUD-001`.
- Physical tables/read models: `identity.staff_users`, `identity.staff_branch_assignments`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-STAFF-001` `GET /api/v1/organizations/{organizationId}/staff`, `API-STAFF-003` `GET /api/v1/staff/{staffUserId}`, `API-STAFF-004` `PATCH /api/v1/staff/{staffUserId}`, `API-STAFF-005` `PUT /api/v1/staff/{staffUserId}/branch-assignments`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** змінювати дані та branch assignments працівника,  
**щоб** підтримувати актуальні права.

### Acceptance criteria

1. Дозволено змінювати profile data, status і branch assignments.
2. GYM_ADMIN не може підвищити користувача до SUPER_ADMIN.
3. Видалення останньої branch assignment вимагає деактивації або явного підтвердження.
4. Old/new values зберігаються в audit.

---

## STAFF-04 — Deactivate employee

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 15  
**Depends on:** STAFF-02, AUTH-03, AUTH-05  
**Primary module:** Identity  
**Required verification:** Integration, API and UI; branch scope, session invalidation and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-STAFF-001`.
- Overlay UI IDs: `DRW-STAFF-001, OVL-STAFF-004`.
- Exact Figma roots: `Screen/SCR-STAFF-001/GymAdmin/StaffList/Desktop/Default`, `Overlay/DRW-STAFF-001/Staff/Details/Default`, `Overlay/OVL-STAFF-004/Staff/Deactivate/Default`.
- Frontend route scope: `/app/staff`.
- Required frontend components: `DeactivateEmployeeAlertDialog, StaffStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-001`, `DB-IDN-002`, `DB-IDN-003`, `DB-AUD-001`.
- Physical tables/read models: `identity.staff_users`, `identity.staff_branch_assignments`, `identity.refresh_tokens`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-STAFF-001` `GET /api/v1/organizations/{organizationId}/staff`, `API-STAFF-003` `GET /api/v1/staff/{staffUserId}`, `API-STAFF-006` `POST /api/v1/staff/{staffUserId}/deactivate`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** деактивувати працівника,  
**щоб** він більше не мав доступу.

### Acceptance criteria

1. Deactivated employee не може login або refresh session.
2. Його історичні check-in/check-out залишаються.
3. Активні sessions працівника інвалідовуються.
4. Деактивація не змінює завершені visits.

---

# Epic 4 — Client CRM

## CLIENT-01 — Create client

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 5  
**Depends on:** AUTH-04, bootstrap organization/branch from Phase 2  
**Primary module:** CRM  
**Required verification:** Unit where business policy exists; integration, API and UI; tenant isolation, search and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-001`.
- Overlay UI IDs: `OVL-CLIENT-001, OVL-CLIENT-003`.
- Exact Figma roots: `Screen/SCR-CLIENT-001/Staff/ClientsList/Desktop/Default`, `Overlay/OVL-CLIENT-001/Client/Create/Default`, `Overlay/OVL-CLIENT-003/Client/PossibleDuplicate/Default`.
- Frontend route scope: `/app/clients`.
- Required frontend components: `ClientsPage, CreateClientModal, PossibleDuplicateClientModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- Reception reuse is implemented in Phase 7 and is not required to complete this Phase 5 story.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-AUD-001`.
- Physical tables/read models: `crm.clients`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-CLIENT-002` `POST /api/v1/organizations/{organizationId}/clients/duplicate-check`, `API-CLIENT-003` `POST /api/v1/organizations/{organizationId}/clients`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN або EMPLOYEE з permission,  
**я хочу** створити клієнта,  
**щоб** обслуговувати його у спортзалі.

### Acceptance criteria

1. Обов’язкові поля: first name, last name і щонайменше один contact identifier.
2. Phone та email нормалізуються.
3. Duplicate client warning показується при збігу phone/email.
4. Duplicate warning не повинен автоматично блокувати створення без policy.
5. Client належить organization.
6. За потреби client має home branch.
7. Створення логуються.

---

## CLIENT-02 — Search client

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 5  
**Depends on:** CLIENT-01  
**Primary module:** CRM  
**Required verification:** Unit where business policy exists; integration, API and UI; tenant isolation, search and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-001`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-CLIENT-001/Staff/ClientsList/Desktop/Default`.
- Frontend route scope: `/app/clients`.
- Required frontend components: `ClientsPage, ClientSearchField, DataTable`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- The same search capability is reused by the Reception workspace in Phase 7 without changing this story's completion phase.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`.
- Physical tables/read models: `crm.clients`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-CLIENT-001` `GET /api/v1/organizations/{organizationId}/clients`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE,  
**я хочу** швидко знайти клієнта,  
**щоб** виконати check-in.

### Acceptance criteria

1. Пошук підтримує ім’я, телефон, email, client number і QR identifier у майбутньому.
2. Search не залежить від регістру для текстових полів.
3. Результат показує ім’я, client number, membership status, active visit indicator і block status.
4. Employee бачить лише clients своєї organization.
5. Search response має pagination і response-time target.

---

## CLIENT-03 — View client profile

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** CLIENT-01  
**Primary module:** CRM  
**Required verification:** Unit where business policy exists; integration, API and UI; tenant isolation, search and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-002`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`.
- Frontend route scope: `/app/clients/[clientId]`.
- Required frontend components: `ClientProfilePage, ClientSummaryCard`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- Membership and visit-history sections are completed in Phases 6–7. Incident data may render an explicit empty/not-yet-available state until Phase 17.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`.
- Physical tables/read models: `crm.clients`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: tenant-safe client lookup and profile retrieval against real PostgreSQL.
- Membership and visit data are required for story completion in Phase 7; incident data is a later Phase 17 extension.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-CLIENT-004` `GET /api/v1/clients/{clientId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: positive/not-found/blocked/tenant-isolation profile tests.
- Membership and visit endpoints are prerequisites for completing this story in Phase 7; incident endpoints remain a later extension.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Staff User,  
**я хочу** бачити profile клієнта,  
**щоб** переглянути його статус та історію.

### Acceptance criteria

Profile містить:

- personal data;
- current membership;
- membership status;
- remaining visits;
- active visit;
- visit history;
- incidents;
- notes відповідно до permissions;
- created/updated metadata.

Історія visits сортується від нових до старих.

---

## CLIENT-04 — Edit client

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 15  
**Depends on:** CLIENT-03  
**Primary module:** CRM  
**Required verification:** Unit where business policy exists; integration, API and UI; tenant isolation, search and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-001, SCR-CLIENT-002`.
- Overlay UI IDs: `OVL-CLIENT-002`.
- Exact Figma roots: `Screen/SCR-CLIENT-001/Staff/ClientsList/Desktop/Default`, `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`, `Overlay/OVL-CLIENT-002/Client/Edit/Default`.
- Frontend route scope: `client routes`.
- Required frontend components: `EditClientModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-AUD-001`.
- Physical tables/read models: `crm.clients`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-CLIENT-005` `PATCH /api/v1/clients/{clientId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN або дозволений EMPLOYEE,  
**я хочу** редагувати profile клієнта,  
**щоб** виправити або оновити дані.

### Acceptance criteria

1. Client ID незмінний.
2. Зміни contact data валідовуються.
3. Old/new values логуються.
4. Редагування не змінює історичні visit records.

---

## CLIENT-05 — Block client

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 15  
**Depends on:** CLIENT-03, AUTH-04  
**Primary module:** CRM  
**Required verification:** Unit where business policy exists; integration, API and UI; tenant isolation, search and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-001, SCR-CLIENT-002`.
- Overlay UI IDs: `OVL-CLIENT-004, OVL-CLIENT-005`.
- Exact Figma roots: `Screen/SCR-CLIENT-001/Staff/ClientsList/Desktop/Default`, `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`, `Overlay/OVL-CLIENT-004/Client/Block/Default`, `Overlay/OVL-CLIENT-005/Client/Unblock/Default`.
- Frontend route scope: `client routes`.
- Required frontend components: `BlockClientAlertDialog, UnblockClientAlertDialog, ClientStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-AUD-001`.
- Physical tables/read models: `crm.clients`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-CLIENT-006` `POST /api/v1/clients/{clientId}/block`, `API-CLIENT-007` `POST /api/v1/clients/{clientId}/unblock`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** заблокувати клієнта із причиною,  
**щоб** заборонити нові check-in.

### Acceptance criteria

1. Block reason обов’язковий.
2. Blocked client не може почати новий visit.
3. Active visit не завершується автоматично.
4. Unblock потребує permission і логуються.

---

# Epic 5 — Memberships

## PLAN-01 — Create membership plan

**Release scope:** MVP core  
**Priority:** `P1`  
**Implementation phase(s):** Phase 6  
**Depends on:** AUTH-04, bootstrap organization from Phase 2  
**Primary module:** Membership  
**Required verification:** Unit, integration, API and UI; snapshot and authorization checks

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-PLAN-001`.
- Overlay UI IDs: `OVL-PLAN-001, OVL-PLAN-002`.
- Exact Figma roots: `Screen/SCR-PLAN-001/GymAdmin/MembershipPlans/Desktop/Default`, `Overlay/OVL-PLAN-001/MembershipPlan/Create/Default`, `Overlay/OVL-PLAN-002/MembershipPlan/Edit/Default`.
- Frontend route scope: `/app/membership-plans`.
- Required frontend components: `MembershipPlansPage, CreateMembershipPlanModal, EditMembershipPlanModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-MEM-001`, `DB-MEM-002`, `DB-AUD-001`.
- Physical tables/read models: `membership.membership_plans`, `membership.membership_plan_branches`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-PLAN-001` `GET /api/v1/organizations/{organizationId}/membership-plans`, `API-PLAN-002` `POST /api/v1/organizations/{organizationId}/membership-plans`, `API-PLAN-003` `GET /api/v1/membership-plans/{membershipPlanId}`, `API-PLAN-004` `PATCH /api/v1/membership-plans/{membershipPlanId}`, `API-PLAN-005` `POST /api/v1/membership-plans/{membershipPlanId}/deactivate`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** створити шаблон абонемента,  
**щоб** призначати його клієнтам.

### Acceptance criteria

Plan містить:

- name;
- type: `UNLIMITED`, `VISIT_LIMIT`, `SINGLE_VISIT`, `TRIAL`;
- validity period;
- visit limit за потреби;
- allowed branches;
- active status.

Історичні memberships не змінюються автоматично після редагування plan.

---

## MEMBERSHIP-01 — Assign membership

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 6  
**Depends on:** CLIENT-01, PLAN-01  
**Primary module:** Membership  
**Required verification:** Unit, integration, API and UI; date boundaries, transaction, idempotency and branch eligibility

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-002`.
- Overlay UI IDs: `OVL-MEM-001, OVL-MEM-003`.
- Exact Figma roots: `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`, `Overlay/OVL-MEM-001/Membership/Assign/Default`, `Overlay/OVL-MEM-003/Membership/Cancel/Default`.
- Frontend route scope: `/app/clients/[clientId]`.
- Required frontend components: `AssignMembershipModal, CancelMembershipAlertDialog`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-MEM-001`, `DB-MEM-002`, `DB-MEM-003`, `DB-AUD-001`.
- Physical tables/read models: `crm.clients`, `membership.membership_plans`, `membership.membership_plan_branches`, `membership.memberships`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-PLAN-001` `GET /api/v1/organizations/{organizationId}/membership-plans`, `API-MEM-001` `GET /api/v1/clients/{clientId}/memberships`, `API-MEM-002` `POST /api/v1/clients/{clientId}/memberships`, `API-MEM-003` `GET /api/v1/memberships/{membershipId}`, `API-MEM-007` `POST /api/v1/memberships/{membershipId}/cancel`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** призначити клієнту абонемент,  
**щоб** він мав право на тренування.

### Acceptance criteria

1. Membership має start date і end date.
2. Plan snapshot зберігається.
3. Status обчислюється або контролюється як `ACTIVE`, `FROZEN`, `EXPIRED`, `BLOCKED`, `CANCELLED`.
4. Для limited plan зберігається allowed і used visit count.
5. Overlapping active memberships обробляються за визначеною policy.
6. Створення логуються.

---

## MEMBERSHIP-02 — Validate eligibility for check-in

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 6  
**Depends on:** MEMBERSHIP-01, client status support from CLIENT-01, bootstrap branch from Phase 2  
**Primary module:** Membership  
**Required verification:** Unit, integration, API and UI; date boundaries, transaction, idempotency and branch eligibility

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-002`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`.
- Frontend route scope: `/app/clients/[clientId]`.
- Required frontend components: `MembershipEligibilityPanel`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- `CheckInModal` consumes the completed eligibility contract in Phase 7; it is not required to finish this story.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-MEM-001`, `DB-MEM-002`, `DB-MEM-003`, `DB-MEM-005`.
- Physical tables/read models: `crm.clients`, `membership.membership_plans`, `membership.membership_plan_branches`, `membership.memberships`, `membership.membership_usage_ledger`.
- `DB-MEM-004 membership_freeze_periods` is introduced with `MEMBERSHIP-03` in Phase 16; MVP eligibility still supports a frozen status/reason through membership state and test fixtures.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-MEM-004` `GET /api/v1/clients/{clientId}/membership-eligibility`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: every stable eligibility reason code, date boundary, branch restriction and blocked-client case.
- The check-in command revalidates this policy in Phase 7 but is not part of the Phase 6 implementation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE,  
**я хочу** бачити, чи клієнт може тренуватися,  
**щоб** не допустити невалідний check-in.

### Acceptance criteria

Check-in заборонений, якщо:

- membership відсутній;
- membership ще не почався;
- membership expired;
- membership frozen;
- membership blocked/cancelled;
- visits remaining дорівнює нулю;
- branch не дозволена;
- client blocked.

Response повинен містити machine-readable reason code.

---

## MEMBERSHIP-03 — Freeze membership

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 16  
**Depends on:** MEMBERSHIP-01  
**Primary module:** Membership  
**Required verification:** Unit, integration, API and UI; date boundaries, transaction, idempotency and branch eligibility

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-002`.
- Overlay UI IDs: `OVL-MEM-002`.
- Exact Figma roots: `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`, `Overlay/OVL-MEM-002/Membership/Freeze/Default`.
- Frontend route scope: `/app/clients/[clientId]`.
- Required frontend components: `FreezeMembershipModal, MembershipStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-MEM-003`, `DB-MEM-004`, `DB-AUD-001`.
- Physical tables/read models: `membership.memberships`, `membership.membership_freeze_periods`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-MEM-001` `GET /api/v1/clients/{clientId}/memberships`, `API-MEM-003` `GET /api/v1/memberships/{membershipId}`, `API-MEM-005` `POST /api/v1/memberships/{membershipId}/freeze`, `API-MEM-006` `POST /api/v1/membership-freeze-periods/{freezePeriodId}/end`, `API-MEM-007` `POST /api/v1/memberships/{membershipId}/cancel`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** заморозити абонемент,  
**щоб** тимчасово зупинити його використання.

### Acceptance criteria

1. Freeze має start, optional end і reason.
2. Check-in у freeze period заборонений.
3. Policy подовження end date повинна бути явно визначена.
4. Freeze/unfreeze логуються.

---

## MEMBERSHIP-04 — Consume visit

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** MEMBERSHIP-02, Technical ledger foundation from Phase 6  
**Primary module:** Membership  
**Required verification:** Unit, integration, API and UI; date boundaries, transaction, idempotency and branch eligibility

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001`.
- Overlay UI IDs: `OVL-VISIT-001`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`.
- Frontend route scope: `/app/reception`.
- Required frontend components: `CheckInModal, MembershipEligibilityPanel`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-MEM-003`, `DB-MEM-005`, `DB-OPS-002`, `DB-COM-001`.
- Physical tables/read models: `membership.memberships`, `membership.membership_usage_ledger`, `operations.visit_sessions`, `platform.idempotency_records`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-002` `POST /api/v1/branches/{branchId}/visits/check-in`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** система,  
**я хочу** списати відвідування з limited membership,  
**щоб** залишок був правильним.

### Acceptance criteria

1. Visit списується один раз у визначеній точці — check-in або completed checkout згідно з policy.
2. Retry не списує visit двічі.
3. Cancelled incorrect visit відновлює visit count лише за admin correction policy.
4. Операція транзакційна.

---

# Epic 6 — Locker keys

## KEY-01 — Add locker key

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 6  
**Depends on:** AUTH-04, bootstrap branch from Phase 2  
**Primary module:** Operations  
**Required verification:** Unit state-machine tests, integration, API and UI; uniqueness, branch scope and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-KEY-001`.
- Overlay UI IDs: `OVL-KEY-001, OVL-KEY-002`.
- Exact Figma roots: `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`, `Overlay/OVL-KEY-001/LockerKey/Add/Default`, `Overlay/OVL-KEY-002/LockerKey/Edit/Default`.
- Frontend route scope: `/app/locker-keys`.
- Required frontend components: `LockerKeysPage, AddLockerKeyModal, EditLockerKeyModal`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-002`, `DB-OPS-001`, `DB-AUD-001`.
- Physical tables/read models: `identity.branches`, `operations.locker_keys`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-KEY-002` `POST /api/v1/branches/{branchId}/locker-keys`, `API-KEY-004` `PATCH /api/v1/locker-keys/{lockerKeyId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** додати locker key,  
**щоб** працівники могли видавати його клієнтам.

### Acceptance criteria

1. Key має number, locker number, branch і status.
2. Key number унікальний у межах branch.
3. Initial status — `AVAILABLE`.
4. Створення логуються.

---

## KEY-02 — View and filter keys

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 6  
**Depends on:** KEY-01  
**Primary module:** Operations  
**Required verification:** Unit state-machine tests, integration, API and UI; uniqueness, branch scope and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-KEY-001`.
- Overlay UI IDs: `DRW-KEY-001`.
- Exact Figma roots: `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`, `Overlay/DRW-KEY-001/LockerKey/Details/Default`.
- Frontend route scope: `/app/locker-keys`.
- Required frontend components: `LockerKeysPage, LockerKeyDetailsDrawer`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`.
- Physical tables/read models: `operations.locker_keys`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: branch-scoped status filters, search and pagination against real PostgreSQL.
- Active visit/client details for `ISSUED` keys are added by `VISIT-05` in Phase 7.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-KEY-001` `GET /api/v1/branches/{branchId}/locker-keys`, `API-KEY-003` `GET /api/v1/locker-keys/{lockerKeyId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: filters, pagination, branch isolation and unavailable-key visibility.
- The reception-dashboard endpoint is introduced in Phase 7 and is not required here.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE,  
**я хочу** бачити доступні та видані ключі,  
**щоб** швидко вибрати ключ.

### Acceptance criteria

1. Підтримуються filters за status і branch.
2. Для `ISSUED` key показується status; active visit/client details додаються в `VISIT-05` після появи visit model.
3. LOST, DAMAGED, MAINTENANCE та DEACTIVATED keys не пропонуються для check-in.

---

## KEY-03 — Change key status

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 16  
**Depends on:** KEY-01, AUTH-04  
**Primary module:** Operations  
**Required verification:** Unit state-machine tests, integration, API and UI; uniqueness, branch scope and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-KEY-001`.
- Overlay UI IDs: `OVL-KEY-003, DRW-KEY-001`.
- Exact Figma roots: `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`, `Overlay/OVL-KEY-003/LockerKey/ChangeStatus/Default`, `Overlay/DRW-KEY-001/LockerKey/Details/Default`.
- Frontend route scope: `/app/locker-keys`.
- Required frontend components: `ChangeLockerKeyStatusModal, LockerKeyStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`, `DB-AUD-001`.
- Physical tables/read models: `operations.locker_keys`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: allowed/forbidden state transitions, branch scope and transactional audit.
- Incident creation for lost/damaged keys is owned by `INCIDENT-01..02` in Phase 17.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-KEY-003` `GET /api/v1/locker-keys/{lockerKeyId}`, `API-KEY-004` `PATCH /api/v1/locker-keys/{lockerKeyId}`, `API-KEY-005` `POST /api/v1/locker-keys/{lockerKeyId}/status-transitions`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** змінити status ключа,  
**щоб** відобразити його реальний стан.

### Acceptance criteria

1. Allowed transitions визначені state machine.
2. `ISSUED` key не можна напряму зробити `AVAILABLE` без checkout/correction.
3. LOST/DAMAGED reason обов’язковий.
4. Зміна логуються.

---

# Epic 7 — Visit operations

## VISIT-01 — Check in client

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** AUTH-01, AUTH-04, technical branch guard foundation, CLIENT-02, MEMBERSHIP-02, MEMBERSHIP-04, KEY-01, KEY-02  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001, SCR-VISIT-001`.
- Overlay UI IDs: `OVL-VISIT-001, OVL-VISIT-002`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`, `Overlay/OVL-VISIT-002/Visit/CheckInSuccess/Default`.
- Frontend route scope: `/app/reception, /app/active-visits`.
- Required frontend components: `CheckInModal, CheckInSuccessModal, ActiveVisitTable`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-MEM-003`, `DB-MEM-005`, `DB-OPS-001`, `DB-OPS-002`, `DB-COM-001`, `DB-AUD-001`.
- Physical tables/read models: `crm.clients`, `membership.memberships`, `membership.membership_usage_ledger`, `operations.locker_keys`, `operations.visit_sessions`, `platform.idempotency_records`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-MEM-004` `GET /api/v1/clients/{clientId}/membership-eligibility`, `API-KEY-001` `GET /api/v1/branches/{branchId}/locker-keys`, `API-VISIT-002` `POST /api/v1/branches/{branchId}/visits/check-in`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE,  
**я хочу** зареєструвати початок тренування та видати ключ,  
**щоб** система зафіксувала активне відвідування.

### Acceptance criteria

1. Employee вибирає client, branch, key і start time.
2. За замовчуванням start time — поточний час, але permission може дозволити ручну зміну.
3. Система повторно перевіряє membership eligibility у момент confirm.
4. Client не має іншого ACTIVE visit.
5. Key має status `AVAILABLE` і належить branch.
6. Visit створюється зі status `ACTIVE`.
7. Key переходить у `ISSUED`.
8. Visit та key assignment створюються в одній database transaction.
9. Check-in employee та timestamp зберігаються.
10. Audit event створюється.
11. Response містить visit ID, client, key і startedAt.

---

## VISIT-02 — Prevent concurrent duplicate client check-in

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** VISIT-01  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001`.
- Overlay UI IDs: `OVL-VISIT-001`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`.
- Frontend route scope: `/app/reception`.
- Required frontend components: `CheckInModal, ConcurrencyConflictAlert`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-002`, `DB-COM-001`.
- Physical tables/read models: `operations.visit_sessions`, `platform.idempotency_records`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-002` `POST /api/v1/branches/{branchId}/visits/check-in`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** система,  
**я хочу** дозволити лише один одночасний check-in клієнта,  
**щоб** не створювати дубльовані visits.

### Acceptance criteria

1. Два паралельні requests для одного client не створюють два ACTIVE visits.
2. Один request успішний, інший повертає conflict reason.
3. Constraint існує на database level, а не лише в UI.
4. Дані залишаються консистентними після race condition.

---

## VISIT-03 — Prevent concurrent key assignment

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** VISIT-01  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001, SCR-KEY-001`.
- Overlay UI IDs: `OVL-VISIT-001`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`, `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`.
- Frontend route scope: `/app/reception`.
- Required frontend components: `CheckInModal, LockerKeyStatusChip, ConcurrencyConflictAlert`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`, `DB-OPS-002`.
- Physical tables/read models: `operations.locker_keys`, `operations.visit_sessions`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-002` `POST /api/v1/branches/{branchId}/visits/check-in`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** система,  
**я хочу** дозволити видати ключ лише одному клієнту,  
**щоб** уникнути подвійного призначення.

### Acceptance criteria

1. Паралельні check-in з однаковим key дають лише один success.
2. Другий request отримує `KEY_ALREADY_ISSUED`.
3. Не створюється orphan visit без key.
4. Transaction rollback підтверджений integration test.

---

## VISIT-04 — Idempotent check-in

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** VISIT-01, MEMBERSHIP-04  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001`.
- Overlay UI IDs: `OVL-VISIT-001`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`.
- Frontend route scope: `/app/reception`.
- Required frontend components: `CheckInModal, NetworkUncertaintyAlert`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-COM-001`, `DB-MEM-005`, `DB-OPS-001`, `DB-OPS-002`.
- Physical tables/read models: `platform.idempotency_records`, `membership.membership_usage_ledger`, `operations.locker_keys`, `operations.visit_sessions`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-002` `POST /api/v1/branches/{branchId}/visits/check-in`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** система,  
**я хочу** безпечно обробляти повторний request,  
**щоб** network retry не створював дубль.

### Acceptance criteria

1. Client request передає idempotency key.
2. Повторний request з тим самим key і payload повертає той самий результат.
3. Повторний key з іншим payload повертає conflict.
4. Membership visit count не списується двічі.

---

## VISIT-05 — View active visits

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** VISIT-01  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-VISIT-001, SCR-GYM-001`.
- Overlay UI IDs: `DRW-VISIT-001`.
- Exact Figma roots: `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Screen/SCR-GYM-001/GymAdmin/GymDashboard/Desktop/Default`, `Overlay/DRW-VISIT-001/Visit/Details/Default`.
- Frontend route scope: `/app/active-visits`.
- Required frontend components: `ActiveVisitsPage, ActiveVisitTable, VisitDetailsDrawer`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-OPS-001`, `DB-OPS-002`.
- Physical tables/read models: `crm.clients`, `operations.locker_keys`, `operations.visit_sessions`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-001` `GET /api/v1/branches/{branchId}/visits`, `API-VISIT-004` `GET /api/v1/visits/{visitId}`, `API-REPORT-002` `GET /api/v1/branches/{branchId}/dashboard/reception`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE,  
**я хочу** бачити всіх активних клієнтів у branch,  
**щоб** контролювати поточну завантаженість.

### Acceptance criteria

Список містить:

- client;
- startedAt;
- current duration;
- key number;
- check-in employee;
- membership status snapshot;
- warning для unusually long visit.

Список оновлюється через refresh або real-time mechanism post-MVP.

---

## VISIT-06 — Check out by key number

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** VISIT-01, VISIT-05  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001, SCR-VISIT-001`.
- Overlay UI IDs: `OVL-VISIT-003`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Overlay/OVL-VISIT-003/Visit/CheckoutByKey/Lookup`.
- Frontend route scope: `reception/visit routes`.
- Required frontend components: `CheckoutByKeyModal, ActiveVisitTable`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`, `DB-OPS-002`, `DB-COM-001`, `DB-AUD-001`.
- Physical tables/read models: `operations.locker_keys`, `operations.visit_sessions`, `platform.idempotency_records`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-003` `POST /api/v1/branches/{branchId}/visits/checkout-by-key`, `API-VISIT-005` `POST /api/v1/visits/{visitId}/checkout`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE,  
**я хочу** ввести номер повернутого ключа,  
**щоб** автоматично знайти та завершити visit.

### Acceptance criteria

1. Employee вводить key number у контексті branch.
2. Система знаходить `ISSUED` key та пов’язаний ACTIVE visit.
3. UI показує client і visit summary перед confirm.
4. Після confirm visit стає `COMPLETED`.
5. `finishedAt` і duration зберігаються.
6. Key стає `AVAILABLE`.
7. Check-out employee зберігається.
8. Visit completion і key release виконуються в одній transaction.
9. Audit event створюється.

---

## VISIT-07 — Idempotent check-out

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** VISIT-06  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001, SCR-VISIT-001`.
- Overlay UI IDs: `OVL-VISIT-003`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Overlay/OVL-VISIT-003/Visit/CheckoutByKey/Lookup`.
- Frontend route scope: `reception/visit routes`.
- Required frontend components: `CheckoutByKeyModal, NetworkUncertaintyAlert`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-COM-001`, `DB-OPS-002`.
- Physical tables/read models: `platform.idempotency_records`, `operations.visit_sessions`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-003` `POST /api/v1/branches/{branchId}/visits/checkout-by-key`, `API-VISIT-005` `POST /api/v1/visits/{visitId}/checkout`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** система,  
**я хочу** безпечно обробляти повторний checkout,  
**щоб** загублена відповідь не спричинила помилкові зміни.

### Acceptance criteria

1. Повторний request із тією самою idempotency key повертає попередній результат.
2. Completed visit не завершується вдруге.
3. Key не переходить у некоректний status.
4. Audit не дублюється.

---

## VISIT-08 — Client visit history

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7  
**Depends on:** VISIT-06, CLIENT-03  
**Primary module:** Operations  
**Required verification:** Unit, PostgreSQL integration, API and UI; transaction, concurrency, idempotency, tenant and branch isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-CLIENT-002`.
- Overlay UI IDs: `DRW-VISIT-001`.
- Exact Figma roots: `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`, `Overlay/DRW-VISIT-001/Visit/Details/Default`.
- Frontend route scope: `/app/clients/[clientId]`.
- Required frontend components: `VisitHistoryTable, VisitDetailsDrawer`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- Client Portal history is owned exclusively by `PORTAL-02` in Phase 19.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-OPS-002`.
- Physical tables/read models: `crm.clients`, `operations.visit_sessions`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-004` `GET /api/v1/visits/{visitId}`, `API-VISIT-006` `GET /api/v1/clients/{clientId}/visits`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Staff User,  
**я хочу** бачити всі тренування клієнта,  
**щоб** аналізувати його історію.

### Acceptance criteria

1. History показує completed, active, corrected, cancelled та incident visits згідно з permissions.
2. Поля: date, start, end, duration, branch, key, employees, status.
3. Підтримуються date filters і pagination.
4. Corrected record має indicator і link до audit.

---

## VISIT-09 — Manual visit correction

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 17  
**Depends on:** VISIT-06, VISIT-08, AUTH-04, AUDIT-01  
**Primary module:** Operations  
**Required verification:** Unit, integration, API and UI; temporal rules, scheduler behavior, permissions and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-VISIT-001, SCR-CLIENT-002`.
- Overlay UI IDs: `DRW-VISIT-001, OVL-VISIT-004`.
- Exact Figma roots: `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`, `Overlay/DRW-VISIT-001/Visit/Details/Default`, `Overlay/OVL-VISIT-004/Visit/Correct/Default`.
- Frontend route scope: `visit routes`.
- Required frontend components: `CorrectVisitModal, AuditEventDiff`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-MEM-003`, `DB-MEM-005`, `DB-OPS-001`, `DB-OPS-002`, `DB-OPS-003`, `DB-AUD-001`.
- Physical tables/read models: `membership.memberships`, `membership.membership_usage_ledger`, `operations.locker_keys`, `operations.visit_sessions`, `operations.visit_corrections`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-004` `GET /api/v1/visits/{visitId}`, `API-VISIT-007` `POST /api/v1/visits/{visitId}/corrections`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** виправити некоректне відвідування,  
**щоб** дані відповідали реальній ситуації.

### Acceptance criteria

1. Можна змінити start/end time, key, status або cancellation reason у межах policy.
2. Correction reason обов’язковий.
3. Original values не втрачаються — вони є в audit.
4. Неможливо створити negative duration.
5. Неможливо призначити key, який конфліктує з іншим visit у той самий час без explicit override policy.
6. Membership count коригується згідно з policy.

---

## VISIT-10 — Auto-close long-running visit

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 17  
**Depends on:** VISIT-05, VISIT-06  
**Primary module:** Operations  
**Required verification:** Unit, integration, API and UI; temporal rules, scheduler behavior, permissions and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-VISIT-001`.
- Overlay UI IDs: `DRW-VISIT-001`.
- Exact Figma roots: `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Overlay/DRW-VISIT-001/Visit/Details/Default`.
- Frontend route scope: `/app/active-visits`.
- Required frontend components: `ActiveVisitTable, LongRunningVisitIndicator`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-002`, `DB-OPS-002`, `DB-AUD-001`.
- Physical tables/read models: `identity.branches`, `operations.visit_sessions`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-001` `GET /api/v1/branches/{branchId}/visits`, `API-VISIT-008` `GET /api/v1/branches/{branchId}/visits/long-running`, `API-VISIT-009` `POST /api/v1/visits/{visitId}/auto-close`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** бачити або автоматично закривати аномально довгі visits,  
**щоб** активний список був актуальним.

### Acceptance criteria

1. Threshold налаштовується на branch або organization level.
2. MVP може лише показувати warning без automatic close.
3. Post-MVP auto-close має status `AUTO_CLOSED` і audit reason.

---

# Epic 8 — Incidents

## INCIDENT-01 — Report lost key during active visit

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 17  
**Depends on:** VISIT-01, KEY-03, AUDIT-01  
**Primary module:** Operations  
**Required verification:** Unit state-machine tests, integration, API and UI; key consistency, permissions and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-INCIDENT-001, SCR-REC-001`.
- Overlay UI IDs: `OVL-INC-001, DRW-INC-001`.
- Exact Figma roots: `Screen/SCR-INCIDENT-001/Operations/Incidents/Desktop/Default`, `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Overlay/OVL-INC-001/Incident/Report/Default`, `Overlay/DRW-INC-001/Incident/Details/Default`.
- Frontend route scope: `incident/reception routes`.
- Required frontend components: `ReportIncidentModal, IncidentDetailsDrawer`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`, `DB-OPS-002`, `DB-OPS-004`, `DB-AUD-001`.
- Physical tables/read models: `operations.locker_keys`, `operations.visit_sessions`, `operations.incidents`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-CLIENT-008` `GET /api/v1/clients/{clientId}/incidents`, `API-KEY-005` `POST /api/v1/locker-keys/{lockerKeyId}/status-transitions`, `API-INC-001` `GET /api/v1/branches/{branchId}/incidents`, `API-INC-002` `POST /api/v1/branches/{branchId}/incidents`, `API-INC-003` `GET /api/v1/incidents/{incidentId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE,  
**я хочу** зареєструвати втрату ключа,  
**щоб** зафіксувати проблему та правильно завершити visit.

### Acceptance criteria

1. Incident прив’язується до key, visit, client, branch і employee.
2. Key переходить у `LOST`.
3. Visit не закривається мовчки; employee обирає відповідну action згідно з policy.
4. Reason/notes обов’язкові.
5. Audit створюється.

---

## INCIDENT-02 — Report damaged key

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 17  
**Depends on:** KEY-03, AUDIT-01  
**Primary module:** Operations  
**Required verification:** Unit state-machine tests, integration, API and UI; key consistency, permissions and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-INCIDENT-001, SCR-KEY-001`.
- Overlay UI IDs: `OVL-INC-001, DRW-INC-001`.
- Exact Figma roots: `Screen/SCR-INCIDENT-001/Operations/Incidents/Desktop/Default`, `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`, `Overlay/OVL-INC-001/Incident/Report/Default`, `Overlay/DRW-INC-001/Incident/Details/Default`.
- Frontend route scope: `incident/key routes`.
- Required frontend components: `ReportIncidentModal, LockerKeyStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`, `DB-OPS-004`, `DB-AUD-001`.
- Physical tables/read models: `operations.locker_keys`, `operations.incidents`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-CLIENT-008` `GET /api/v1/clients/{clientId}/incidents`, `API-KEY-005` `POST /api/v1/locker-keys/{lockerKeyId}/status-transitions`, `API-INC-001` `GET /api/v1/branches/{branchId}/incidents`, `API-INC-002` `POST /api/v1/branches/{branchId}/incidents`, `API-INC-003` `GET /api/v1/incidents/{incidentId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** EMPLOYEE або GYM_ADMIN,  
**я хочу** позначити ключ пошкодженим,  
**щоб** він не видавався повторно.

### Acceptance criteria

1. Key переходить у `DAMAGED`.
2. Пошкоджений key не доступний для check-in.
3. Якщо key виданий, система вимагає завершити або виправити active visit.
4. Incident зберігається.

---

## INCIDENT-03 — Resolve incident

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 17  
**Depends on:** INCIDENT-01 or INCIDENT-02, KEY-03, AUTH-04  
**Primary module:** Operations  
**Required verification:** Unit state-machine tests, integration, API and UI; key consistency, permissions and audit

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-INCIDENT-001`.
- Overlay UI IDs: `DRW-INC-001, OVL-INC-002`.
- Exact Figma roots: `Screen/SCR-INCIDENT-001/Operations/Incidents/Desktop/Default`, `Overlay/DRW-INC-001/Incident/Details/Default`, `Overlay/OVL-INC-002/Incident/Resolve/Default`.
- Frontend route scope: `/app/incidents`.
- Required frontend components: `ResolveIncidentModal, IncidentStatusChip`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`, `DB-OPS-002`, `DB-OPS-004`, `DB-AUD-001`.
- Physical tables/read models: `operations.locker_keys`, `operations.visit_sessions`, `operations.incidents`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-INC-001` `GET /api/v1/branches/{branchId}/incidents`, `API-INC-003` `GET /api/v1/incidents/{incidentId}`, `API-INC-004` `PATCH /api/v1/incidents/{incidentId}`, `API-INC-005` `POST /api/v1/incidents/{incidentId}/resolve`, `API-INC-006` `POST /api/v1/incidents/{incidentId}/cancel`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** закрити incident із resolution,  
**щоб** мати повну історію вирішення.

### Acceptance criteria

1. Resolution text обов’язковий.
2. ResolvedAt і resolvedBy зберігаються.
3. Key status після resolution встановлюється явно.
4. Old/new values логуються.

---

# Epic 9 — Audit та reporting

## AUDIT-01 — Store audit events

**Release scope:** MVP core  
**Priority:** `P0`  
**Implementation phase(s):** Phase 7 (completion; foundation starts in Phase 4)  
**Depends on:** AUTH-01, Correlation/logging foundation from Phase 2  
**Primary module:** Audit  
**Required verification:** Integration and API; immutability, tenant scope, correlation ID, old/new values and retry behavior

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `No dedicated screen`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: no user-facing audit browser is required for this storage story.
- Frontend route scope: mutation flows only.
- Required frontend components: no dedicated component; mutation UIs must propagate/display correlation IDs on failures.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.
- Audit list and details UI are implemented by `AUDIT-02` in Phase 18.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-AUD-001`.
- Physical tables/read models: `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: append-only behavior, tenant scope, actor/correlation fields and atomic persistence with the owning mutation.
- Corrections extend audit in Phase 17; transactional outbox/event audit extends it in Phase 20.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: all MVP mutation endpoints completed through Phase 7 must create the required audit event.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: verify audit side effects through integration tests for login, organization/branch/staff, client, membership, key and visit mutations.
- Audit read endpoints belong to `AUDIT-02` in Phase 18.

<!-- END API IMPLEMENTATION CONTRACT -->

**Extended/hardened in:** Phases 17, 18 and 20

**Як** власник системи,  
**я хочу** мати незмінювану історію важливих дій,  
**щоб** розслідувати помилки та зловживання.

### Acceptance criteria

Audit record містить:

- event type;
- actor ID і role;
- organization/branch;
- entity type і ID;
- old/new values або change summary;
- timestamp;
- correlation ID;
- request/source metadata.

Audit records не редагуються через звичайний application API.

---

## AUDIT-02 — View audit log

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 18  
**Depends on:** AUDIT-01, AUTH-04, AUTH-05  
**Primary module:** Audit  
**Required verification:** Integration, API and UI; pagination, filters, authorization and tenant isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-AUDIT-001`.
- Overlay UI IDs: `DRW-AUDIT-001`.
- Exact Figma roots: `Screen/SCR-AUDIT-001/Admin/AuditLog/Desktop/Default`, `Overlay/DRW-AUDIT-001/Audit/EventDetails/Default`.
- Frontend route scope: `/app/audit | /super-admin/audit`.
- Required frontend components: `AuditLogPage, AuditEventDiff`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-AUD-001`, `DB-OPS-003`, `DB-OPS-004`.
- Physical tables/read models: `audit.audit_logs`, `operations.visit_corrections`, `operations.incidents`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; append-only/event-consumer integrity evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUDIT-001` `GET /api/v1/organizations/{organizationId}/audit-events`, `API-AUDIT-002` `GET /api/v1/audit-events/{auditEventId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN або SUPER_ADMIN,  
**я хочу** фільтрувати audit records,  
**щоб** знаходити потрібні зміни.

### Acceptance criteria

1. Filters: date range, actor, entity, event type, branch.
2. GYM_ADMIN бачить лише свою organization.
3. EMPLOYEE не має загального audit access.
4. Pagination обов’язкова.

---

## REPORT-01 — Daily visits report

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 18  
**Depends on:** VISIT-05, VISIT-06, VISIT-09, INCIDENT-01  
**Primary module:** Reporting  
**Required verification:** PostgreSQL aggregation integration, API and UI; timezone, known-dataset correctness and performance baseline

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REPORT-001, SCR-REPORT-002`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-REPORT-001/GymAdmin/ReportsLanding/Desktop/Default`, `Screen/SCR-REPORT-002/GymAdmin/DailyVisitsReport/Desktop/Default`.
- Frontend route scope: `/app/reports/daily-visits`.
- Required frontend components: `DailyVisitsReportPage, ReportFilterBar`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-002`, `DB-OPS-003`, `DB-OPS-004`.
- Physical tables/read models: `operations.visit_sessions`, `operations.visit_corrections`, `operations.incidents`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: known-dataset aggregation, branch timezone boundaries and query-plan/index evidence against modular-monolith source tables.
- Event-driven reporting read models replace these reads only after Phase 20 extraction.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-REPORT-001` `GET /api/v1/organizations/{organizationId}/dashboard`, `API-REPORT-003` `GET /api/v1/organizations/{organizationId}/reports/daily-visits`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** бачити daily visits report,  
**щоб** оцінювати роботу спортзалу.

### Acceptance criteria

Report містить:

- total visits;
- completed visits;
- active visits;
- average duration;
- visits by hour;
- visits by branch;
- manual corrections;
- incidents.

Date/time aggregation використовує branch timezone.

---

## REPORT-02 — Key status report

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 18  
**Depends on:** KEY-02, KEY-03, INCIDENT-01, INCIDENT-02  
**Primary module:** Reporting  
**Required verification:** PostgreSQL aggregation integration, API and UI; timezone, known-dataset correctness and performance baseline

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REPORT-001, SCR-REPORT-003`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-REPORT-001/GymAdmin/ReportsLanding/Desktop/Default`, `Screen/SCR-REPORT-003/GymAdmin/KeyStatusReport/Desktop/Default`.
- Frontend route scope: `/app/reports/key-status`.
- Required frontend components: `KeyStatusReportPage, ReportFilterBar`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-001`, `DB-OPS-002`, `DB-OPS-004`.
- Physical tables/read models: `operations.locker_keys`, `operations.visit_sessions`, `operations.incidents`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: known-dataset status aggregation, incident linkage and query-plan/index evidence against modular-monolith source tables.
- Event-driven reporting read models become the read source only in Phase 20.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-REPORT-001` `GET /api/v1/organizations/{organizationId}/dashboard`, `API-REPORT-004` `GET /api/v1/organizations/{organizationId}/reports/key-status`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** бачити стан ключів,  
**щоб** контролювати інвентар.

### Acceptance criteria

1. Показуються counts за status.
2. LOST/DAMAGED keys доступні окремим списком.
3. Можна перейти до incident або останнього visit.

---

## REPORT-03 — Employee activity report

**Release scope:** Post-MVP product expansion  
**Priority:** `P1`  
**Implementation phase(s):** Phase 18  
**Depends on:** STAFF-02, VISIT-01, VISIT-06, VISIT-09, INCIDENT-03  
**Primary module:** Reporting  
**Required verification:** PostgreSQL aggregation integration, API and UI; timezone, known-dataset correctness and performance baseline

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REPORT-001, SCR-REPORT-004`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-REPORT-001/GymAdmin/ReportsLanding/Desktop/Default`, `Screen/SCR-REPORT-004/GymAdmin/EmployeeActivityReport/Desktop/Default`.
- Frontend route scope: `/app/reports/employee-activity`.
- Required frontend components: `EmployeeActivityReportPage, ReportFilterBar`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-001`, `DB-OPS-002`, `DB-OPS-003`, `DB-OPS-004`.
- Physical tables/read models: `identity.staff_users`, `operations.visit_sessions`, `operations.visit_corrections`, `operations.incidents`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: known-dataset employee/date/branch aggregation and query-plan/index evidence against modular-monolith source tables.
- Event-driven reporting read models become the read source only in Phase 20.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-REPORT-001` `GET /api/v1/organizations/{organizationId}/dashboard`, `API-REPORT-005` `GET /api/v1/organizations/{organizationId}/reports/employee-activity`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** GYM_ADMIN,  
**я хочу** бачити operations працівників,  
**щоб** аналізувати навантаження і corrections.

### Acceptance criteria

Report містить check-ins, check-outs, corrections та incidents за employee/date/branch.

---

# Epic 10 — Post-MVP client portal

## PORTAL-01 — Client login

**Release scope:** Post-MVP optional  
**Priority:** `P2`  
**Implementation phase(s):** Phase 19  
**Depends on:** CLIENT-01, MEMBERSHIP-01, Separate client-auth design decision  
**Primary module:** Client Portal  
**Required verification:** Unit, integration, API and UI; separate client auth, IDOR, privacy and responsive smoke

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-PORTAL-001, SCR-PORTAL-002`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-PORTAL-001/ClientPortal/Login/Mobile/Default`, `Screen/SCR-PORTAL-002/ClientPortal/Dashboard/Mobile/Default`.
- Frontend route scope: `/portal/login, /portal/dashboard`.
- Required frontend components: `ClientPortalLoginPage, ClientPortalDashboardPage`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-PORTAL-001`, `DB-IDN-003`, `DB-AUD-001`.
- Physical tables/read models: `crm.clients`, `identity.client_accounts`, `identity.refresh_tokens`, `audit.audit_logs`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-PORTAL-001` `POST /api/v1/portal/auth/login`, `API-PORTAL-002` `POST /api/v1/portal/auth/refresh`, `API-PORTAL-003` `POST /api/v1/portal/auth/logout`, `API-PORTAL-004` `GET /api/v1/portal/me`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Client,  
**я хочу** увійти у власний portal,  
**щоб** бачити абонемент і тренування.

### Acceptance criteria

1. Client auth відокремлена від staff auth policy.
2. Client бачить лише власні дані.
3. Client не бачить internal notes або audit.

---

## PORTAL-02 — View own visit history

**Release scope:** Post-MVP optional  
**Priority:** `P2`  
**Implementation phase(s):** Phase 19  
**Depends on:** PORTAL-01, VISIT-08  
**Primary module:** Client Portal  
**Required verification:** Unit, integration, API and UI; separate client auth, IDOR, privacy and responsive smoke

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-PORTAL-002, SCR-PORTAL-003`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-PORTAL-002/ClientPortal/Dashboard/Mobile/Default`, `Screen/SCR-PORTAL-003/ClientPortal/VisitHistory/Mobile/Default`.
- Frontend route scope: `/portal/dashboard, /portal/visits`.
- Required frontend components: `ClientVisitHistoryPage, VisitHistoryCard`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-PORTAL-001`, `DB-OPS-002`.
- Physical tables/read models: `crm.clients`, `identity.client_accounts`, `operations.visit_sessions`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-006` `GET /api/v1/clients/{clientId}/visits`, `API-PORTAL-005` `GET /api/v1/portal/visits`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Client,  
**я хочу** бачити історію своїх тренувань,  
**щоб** відстежувати активність.

### Acceptance criteria

1. Показуються date, duration, branch і status.
2. Internal employee IDs та correction details приховані.

---

# Epic 11 — Post-MVP microservices та events

## EVENT-01 — Publish visit events

**Release scope:** Post-MVP engineering  
**Priority:** `P1`  
**Implementation phase(s):** Phase 20  
**Depends on:** AUDIT-01, VISIT-01, VISIT-06, stable Jenkins staging deployment from Phase 12  
**Primary module:** Platform Events / Reporting  
**Required verification:** Unit, outbox/consumer integration, event contract, idempotency, retry, DLQ and resilience tests

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REPORT-001..004, SCR-AUDIT-001`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-AUDIT-001/Admin/AuditLog/Desktop/Default`.
- Frontend route scope: `report/audit routes`.
- Required frontend components: `ConsistencyStatusIndicator (indirect event processing visibility)`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-OPS-002`, `DB-AUD-001`, `DB-EVT-001`, `DB-EVT-002`, `DB-RPT-001`, `DB-RPT-002`, `DB-RPT-003`.
- Physical tables/read models: `operations.visit_sessions`, `audit.audit_logs`, `integration.outbox_events`, `integration.processed_events`, `reporting.reporting_visit_facts`, `reporting.reporting_daily_branch_metrics`, `reporting.reporting_employee_daily_metrics`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence; append-only/event-consumer integrity evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-REPORT-006` `GET /api/v1/organizations/{organizationId}/reports/sync-status`, Internal event contracts EVT-001..007.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Reporting Service,  
**я хочу** отримувати події check-in/check-out,  
**щоб** будувати read models без блокування основної операції.

### Acceptance criteria

1. Operations component публікує `ClientCheckedIn` і `ClientCheckedOut`.
2. Event містить event ID, version, occurredAt, correlation ID і entity IDs.
3. Consumer є idempotent.
4. Duplicate event не дублює report/audit data.
5. Failed message переходить у retry/DLQ flow.

---

## EVENT-02 — Eventual consistency indicator

**Release scope:** Post-MVP engineering  
**Priority:** `P1`  
**Implementation phase(s):** Phase 20  
**Depends on:** EVENT-01, REPORT-01  
**Primary module:** Platform Events / Reporting  
**Required verification:** Unit, outbox/consumer integration, event contract, idempotency, retry, DLQ and resilience tests

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REPORT-001..004`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: resolve the UI IDs through `ui-contract.md`; this story is cross-cutting or has no dedicated root.
- Frontend route scope: `/app/reports/*`.
- Required frontend components: `ConsistencyStatusIndicator`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-EVT-001`, `DB-EVT-002`, `DB-RPT-004`.
- Physical tables/read models: `integration.outbox_events`, `integration.processed_events`, `reporting.reporting_sync_state`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; append-only/event-consumer integrity evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-REPORT-006` `GET /api/v1/organizations/{organizationId}/reports/sync-status`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

**Як** Staff User,  
**я хочу** розуміти, що звіт може оновитися із затримкою,  
**щоб** не сприймати короткочасну різницю як дефект.

### Acceptance criteria

1. Operational check-in response не залежить від Reporting Service availability.
2. Report оновлюється в межах визначеного SLA.
3. UI може показувати last updated timestamp.

---

# Epic 12 — Platform, Docker та Jenkins CI/CD

Ці stories є **platform/enabler stories**, а не функціями для кінцевого користувача. Вони починаються тільки після завершення Lean MVP у Phase 8 і визначають перевірювані вимоги до container runtime, Jenkins, AWS staging, deployment, regression та rollback.

## PLATFORM-01 — Containerize web and API

**Release scope:** Post-MVP CI/CD foundation  
**Priority:** `P0`  
**Implementation phase(s):** Phase 9  
**Depends on:** Phase 8 Lean MVP release candidate  
**Primary module:** Platform Engineering / Runtime  
**Required verification:** Clean Docker builds, image inspection, non-root runtime, health checks, environment injection and graceful shutdown

**Platform implementation contract:**

- Required artifacts: `apps/web/Dockerfile`, `apps/api/Dockerfile`, `.dockerignore` files and documented local build commands.
- Images must be multi-stage, production-mode, reproducible from a clean clone and tagged with Git commit SHA.
- Runtime containers must use a non-root user, receive configuration only through environment/secrets and write logs to stdout/stderr.
- No source secrets, `.env` files, package-manager caches or development dependencies may be copied into final runtime layers.
- Required evidence: successful clean builds, image metadata, container user inspection, health response and shutdown logs.

**Як** delivery team,  
**ми хочемо** запускати web і API як reproducible Docker images,  
**щоб** локальне, Jenkins і AWS середовища використовували однакові deployable artifacts.

### Acceptance criteria

1. Web і API мають окремі multi-stage Dockerfiles.
2. Final images запускають production build, а не development server.
3. Runtime process виконується non-root користувачем.
4. Configuration передається через environment variables або secret references; secrets не baked into image layers.
5. API container коректно відповідає на `/health`, `/ready` та `/version` після старту.
6. Containers підтримують graceful shutdown і завершуються без пошкодження даних.
7. Images будуються з clean clone документованою командою.
8. Image labels або metadata містять commit SHA та build timestamp.

---

## PLATFORM-02 — Reproducible Docker Compose runtime and test stack

**Release scope:** Post-MVP CI/CD foundation  
**Priority:** `P0`  
**Implementation phase(s):** Phase 9  
**Depends on:** PLATFORM-01  
**Primary module:** Platform Engineering / Runtime  
**Required verification:** Compose boot from clean clone, empty-DB migration, health/readiness, containerized smoke, restart and cleanup tests

**Platform implementation contract:**

- Required artifacts: root `compose.yaml` or equivalent, migration service, PostgreSQL service, web/API services and optional Playwright test-runner service/profile.
- Required service names: `web`, `api`, `database`, `migration`, optional `test-runner`.
- Local persistent profile and isolated ephemeral CI profile must be documented separately.
- Required evidence: compose config validation, empty database migration, MVP smoke inside containers, restart behavior and complete cleanup of ephemeral resources.

**Як** QA та delivery team,  
**ми хочемо** мати один reproducible Docker Compose stack,  
**щоб** локальні container tests і Jenkins використовували однаковий runtime workflow.

### Acceptance criteria

1. `docker compose up` запускає web, API і PostgreSQL без локальних Node processes.
2. Migration виконується окремим controlled one-shot service/job до приймання traffic API.
3. Services мають health checks і dependency readiness, а не покладаються лише на порядок старту.
4. Ephemeral CI profile використовує ізольовану database і не залежить від локального named volume.
5. Containerized test-runner може запустити MVP API/UI smoke проти stack.
6. Повторний запуск не використовує stale containers або test data.
7. Shutdown/restart не пошкоджує schema чи persistent local data.
8. Команди build, migrate, smoke, logs і cleanup задокументовані.

---

## CICD-01 — Jenkins Pull Request quality pipeline

**Release scope:** Post-MVP CI  
**Priority:** `P0`  
**Implementation phase(s):** Phase 10  
**Depends on:** PLATFORM-02, NFR-05  
**Primary module:** Platform Engineering / Jenkins CI  
**Required verification:** Webhook trigger, blocking gates, clean rerun, artifact publication, GitHub status and intentional-failure test

**Platform implementation contract:**

- Required artifacts: root `Jenkinsfile`, reusable scripts under `ci/`, Jenkins Multibranch Pipeline configuration and GitHub branch-protection documentation.
- Mandatory stages: checkout, environment validation, `npm ci`, lint, typecheck, unit, PostgreSQL integration, migrations, build, Docker image build, Compose stack, health/version, OpenAPI validation, API smoke, UI smoke, artifact publication and cleanup.
- Required evidence: Jenkins build URL, GitHub status check, JUnit/Playwright artifacts, container logs and one intentionally failed blocking gate.

**Як** development team,  
**ми хочемо** автоматично перевіряти кожний pull request у Jenkins,  
**щоб** неперевірений або дефектний код не потрапляв у `main`.

### Acceptance criteria

1. Pull request або branch update автоматично запускає Jenkins Multibranch Pipeline через GitHub webhook.
2. Усі mandatory stages виконуються у визначеному порядку та використовують version-controlled scripts.
3. Failure будь-якого blocking gate завершує pipeline зі статусом failed.
4. Jenkins повертає commit status у GitHub, а branch protection блокує merge при failed/missing status.
5. Integration/API/UI tests використовують ізольовані дані й очищають середовище незалежно від результату.
6. Jenkins публікує JUnit, Playwright HTML report, traces/screenshots/videos, migration output і container logs.
7. Secrets зберігаються у Jenkins Credentials Store, masking увімкнений, secret values не виводяться в logs.
8. Повторний запуск на тому самому commit не залежить від stale workspace, containers або database.
9. `post/always` cleanup виконується і при test failure, і при aborted build.
10. Навмисно внесений lint/test/OpenAPI defect доведено блокує merge.

---

## CLOUD-01 — Provision reproducible AWS staging infrastructure

**Release scope:** Post-MVP cloud foundation  
**Priority:** `P0`  
**Implementation phase(s):** Phase 11  
**Depends on:** CICD-01  
**Primary module:** Platform Engineering / AWS  
**Required verification:** IaC plan/apply, network and IAM review, service health, RDS migration path, log delivery and recreation evidence

**Platform implementation contract:**

- Required artifacts: version-controlled IaC under `infra/terraform/staging/` or an explicitly approved equivalent.
- Minimum resources: ECR, ECS Fargate, ALB, RDS PostgreSQL, security groups/networking, Secrets Manager or Parameter Store, CloudWatch logs/alarms and IAM roles for tasks and Jenkins deployment.
- Kubernetes/EKS, multi-region, production data and complex shared-platform abstractions are out of scope.
- Required evidence: IaC plan/apply output, resource inventory, network/IAM diagram, healthy placeholder deployment and documented cost-sensitive resources.

**Як** delivery team,  
**ми хочемо** відтворюване production-like AWS staging environment,  
**щоб** Jenkins міг безпечно розгортати й перевіряти MVP поза локальним середовищем.

### Acceptance criteria

1. Staging infrastructure створюється з version-controlled IaC.
2. Web/API images зберігаються у ECR і адресуються immutable commit SHA tags.
3. ECS Fargate запускає web/API за ALB; services мають health checks.
4. RDS PostgreSQL не є публічно доступною й приймає traffic лише від дозволених resources.
5. Application secrets зберігаються у Secrets Manager/Parameter Store, а не в repository, image або Jenkinsfile.
6. ECS task roles і Jenkins deployment role використовують least privilege.
7. Jenkins не використовує hard-coded long-lived AWS keys; застосовується role/STS або інший approved short-lived mechanism.
8. Structured application logs надходять у CloudWatch і містять correlation ID, environment та commit version.
9. Controlled migration task може підключитися до RDS і завершитися до deployment traffic switch.
10. Environment можна повторно створити за документацією; budget/cost assumptions зафіксовані.

---

## CICD-02 — Build and publish immutable images to ECR

**Release scope:** Post-MVP CD  
**Priority:** `P0`  
**Implementation phase(s):** Phase 12  
**Depends on:** CICD-01, CLOUD-01  
**Primary module:** Platform Engineering / Jenkins CD  
**Required verification:** Green-commit provenance, build-once behavior, ECR push, immutable SHA tags and image metadata evidence

**Platform implementation contract:**

- Required artifact: main-branch/deployment path in the root `Jenkinsfile` or approved shared pipeline library.
- Images must be built once for the exact merged commit, tagged with full/short commit SHA and reused for deployment; rebuilding a different binary during deploy is forbidden.
- Required evidence: Jenkins build URL, source commit, image digests, ECR tags and stored image metadata.

**Як** release team,  
**ми хочемо** публікувати immutable Docker images лише з green commits,  
**щоб** staging deployment був трасованим і відтворюваним.

### Acceptance criteria

1. Deployment pipeline checkout-ить exact commit, який пройшов required gates.
2. Web/API images будуються один раз і отримують immutable commit SHA tags.
3. Images успішно push-яться до визначених ECR repositories.
4. Pipeline зберігає image digest, tag, source commit і build URL як deployment metadata.
5. Failed build або image publication зупиняє deployment до migration/ECS update.
6. Mutable `latest` не є canonical deployment reference.
7. AWS authentication використовує approved short-lived/role-based credentials.

---

## CICD-03 — Jenkins deployment to AWS staging

**Release scope:** Post-MVP CD  
**Priority:** `P0`  
**Implementation phase(s):** Phase 12  
**Depends on:** CICD-02, CLOUD-01  
**Primary module:** Platform Engineering / Jenkins CD  
**Required verification:** Controlled migration, ECS service update, stability wait, health/readiness/version and deployment metadata checks

**Platform implementation contract:**

- Required deployment stages: migration task, ECS task-definition update, service deployment, stability wait, `/health`, `/ready`, `/version`, deployed-SHA verification and evidence publication.
- Deployment must use the image digests produced by CICD-02.
- Required evidence: migration task result, ECS task revision, deployed image digest, service events, health responses and version SHA.

**Як** delivery team,  
**ми хочемо** автоматично розгортати merged green commit у staging через Jenkins,  
**щоб** staging завжди мав трасовану перевірену версію MVP.

### Acceptance criteria

1. Merge до `main` запускає Jenkins deployment pipeline або approved controlled trigger.
2. Controlled migration task виконується до оновлення application services.
3. Migration failure зупиняє deployment і не оновлює ECS services.
4. ECS task definitions посилаються на immutable image digests/tags із CICD-02.
5. Pipeline чекає ECS service stability з визначеним timeout.
6. Після deployment перевіряються `/health`, `/ready` і `/version`.
7. `/version` повинен підтвердити exact deployed commit SHA.
8. Service-stability timeout або health/version mismatch робить deployment failed.
9. Jenkins зберігає environment, commit, image digest, task revision і timestamps.
10. Одночасні staging deployments серіалізовані або захищені lock/concurrency policy.

---

## QAOPS-01 — Mandatory post-deployment MVP smoke

**Release scope:** Post-MVP QA/CD  
**Priority:** `P0`  
**Implementation phase(s):** Phase 12  
**Depends on:** CICD-03, NFR-05  
**Primary module:** Quality Engineering / Jenkins CD  
**Required verification:** Real staging API/UI smoke, isolated data, cleanup, failure artifacts and deployment-status integration

**Platform implementation contract:**

- Required Jenkins stage/job executes against the newly deployed staging version.
- Required flow: health/version, staff login, isolated client/membership/key setup, check-in, active visit, checkout, visit history and cleanup.
- Required evidence: test summary, Playwright report/traces, correlation IDs, deployed SHA and cleanup result.

**Як** QA team,  
**ми хочемо** виконувати mandatory API/UI smoke після staging deployment,  
**щоб** deployment не вважався успішним без перевірки головного бізнес-флоу.

### Acceptance criteria

1. Smoke запускається лише після healthy deployment exact SHA.
2. Test data має унікальний test-run identifier і не конфліктує з паралельними/попередніми runs.
3. Smoke перевіряє authentication, client/membership/key setup, check-in, active visit, checkout і visit history.
4. API та UI assertions перевіряють не тільки status code, а й критичний persisted business state.
5. Failed smoke робить deployment unsuccessful/unstable у Jenkins.
6. Failure artifacts містять request/response evidence, screenshot/trace, correlation ID і deployed SHA.
7. Cleanup виконується після success, failure або abort і має окремий результат.
8. Smoke не використовує production data або shared manually maintained records.

---

## REL-01 — Roll back a failed staging deployment

**Release scope:** Post-MVP release engineering  
**Priority:** `P0`  
**Implementation phase(s):** Phase 12  
**Depends on:** CICD-03, QAOPS-01  
**Primary module:** Platform Engineering / Release Management  
**Required verification:** Exercised rollback, previous-version health/smoke, metadata preservation and failure simulation

**Platform implementation contract:**

- Required artifacts: Jenkins rollback stage/job and `docs/runbooks/staging-rollback.md` or equivalent.
- Rollback target is the previous known-good ECS task definition and immutable image digest.
- Destructive automatic database rollback is forbidden; migration compatibility/forward-fix policy must be documented.
- Required evidence: failed deployment simulation, rollback Jenkins run, restored version SHA, health/smoke result and timeline.

**Як** release team,  
**ми хочемо** повернути staging до попередньої known-good версії після failed deployment,  
**щоб** середовище можна було швидко відновити без ручного пошуку artifacts.

### Acceptance criteria

1. Pipeline зберігає previous known-good ECS task revision та image digests до deployment.
2. Rollback можна запустити після service failure, health/version mismatch або post-deploy smoke failure.
3. Rollback повторно розгортає попередню immutable application version.
4. Після rollback перевіряються service stability, `/health`, `/ready`, `/version` і MVP smoke.
5. Database не відкочується автоматично destructive scripts.
6. Schema migrations для deployable versions мають бути backward-compatible або мати documented forward-fix plan.
7. Rollback result, restored SHA, timestamps і причина зберігаються в Jenkins artifacts/logs.
8. Процедура хоча б один раз виконана через контрольовану failure simulation.

---

## QAOPS-02 — Nightly regression and scheduled quality checks

**Release scope:** Post-MVP continuous quality  
**Priority:** `P1`  
**Implementation phase(s):** Phase 13  
**Depends on:** QAOPS-01, REL-01  
**Primary module:** Quality Engineering / Jenkins  
**Required verification:** Scheduled execution, full MVP regression, multi-browser run, integrity/concurrency checks, scans, cleanup and trend evidence

**Platform implementation contract:**

- Required Jenkins jobs: `post-deploy-smoke`, `nightly-mvp-regression` and scheduled quality/security checks, or equivalent clearly separated pipeline branches.
- Nightly scope: full MVP API regression, full MVP UI regression, Chromium plus one additional browser, concurrency/idempotency, DB integrity, OpenAPI compatibility and basic response-time baseline.
- Scheduled quality scope: dependency scan, image scan, secret scan, migration drift and flaky-test trend.
- Required evidence: build history, layer-level summary, trends, failure artifacts, environment/SHA and cleanup results.

**Як** QA team,  
**ми хочемо** автоматично запускати розширену regression і quality checks за розкладом,  
**щоб** знаходити дефекти, flaky tests, drift та security issues поза коротким PR pipeline.

### Acceptance criteria

1. Nightly job запускається за Jenkins schedule без ручного environment setup.
2. Job виконує full MVP API та UI regression проти staging.
3. UI regression охоплює Chromium і щонайменше один додатковий browser.
4. Окремо виконуються concurrency/idempotency та database integrity checks.
5. OpenAPI contract validation і basic response-time baseline входять у scheduled run.
6. Dependency, image і secret scans запускаються за визначеним schedule та мають documented severity policy.
7. Migration drift і stale test-data cleanup перевіряються автоматично.
8. Reports показують pass rate, duration і flaky trend за test layer.
9. Failure зберігає достатні logs/traces/screenshots/correlation IDs для initial triage.
10. Scheduled regression не блокується leftover data з попереднього run.

---

# 6. Нефункціональні вимоги

## NFR-01 — Performance

**Release scope:** Cross-cutting  
**Priority:** `P1`  
**Implementation phase(s):** Phases 8, 13, 18 and 22  
**Depends on:** Core API and report stories  
**Primary module:** Cross-cutting  
**Required verification:** Controlled staging performance baseline, response-time metrics, trend comparison and regression threshold

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001, SCR-VISIT-001, SCR-CLIENT-001`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Screen/SCR-CLIENT-001/Staff/ClientsList/Desktop/Default`.
- Frontend route scope: `critical operational routes`.
- Required frontend components: `SearchField, DataTable, Skeleton, Pagination`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-CRM-001`, `DB-OPS-001`, `DB-OPS-002`, `DB-AUD-001`, `DB-RPT-001`, `DB-RPT-002`, `DB-RPT-003`.
- Physical tables/read models: `crm.clients`, `operations.locker_keys`, `operations.visit_sessions`, `audit.audit_logs`, `reporting.reporting_visit_facts`, `reporting.reporting_daily_branch_metrics`, `reporting.reporting_employee_daily_metrics`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; query-plan/index evidence against a known dataset.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-REPORT-001` `GET /api/v1/organizations/{organizationId}/dashboard`, `API-REPORT-002` `GET /api/v1/branches/{branchId}/dashboard/reception`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

1. Client search p95 — до 1 секунди в staging target dataset.
2. Check-in/check-out API p95 — до 1 секунди без зовнішніх деградацій.
3. Standard list endpoints використовують pagination.
4. Dashboard не завантажує необмежені історичні дані.

## NFR-02 — Availability та resilience

**Release scope:** Cross-cutting  
**Priority:** `P1`  
**Implementation phase(s):** Phases 2, 9, 10, 11, 12, 13, 20 and 22  
**Depends on:** Health/readiness foundation and deployment pipelines  
**Primary module:** Cross-cutting  
**Required verification:** Health/readiness, failure injection, retry/timeout behavior, recovery and availability evidence

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `All operational screens`.
- Overlay UI IDs: `OVL-AUTH-001`.
- Exact Figma roots: `Overlay/OVL-AUTH-001/Auth/SessionExpired/Default`.
- Frontend route scope: `all routes`.
- Required frontend components: `ErrorState, RetryAction, NetworkUncertaintyAlert`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-IDN-003`, `DB-COM-001`, `DB-EVT-001`, `DB-EVT-002`, `DB-RPT-004`.
- Physical tables/read models: `identity.refresh_tokens`, `platform.idempotency_records`, `integration.outbox_events`, `integration.processed_events`, `reporting.reporting_sync_state`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-SYS-001` `GET /health`, `API-SYS-002` `GET /ready`, `API-REPORT-006` `GET /api/v1/organizations/{organizationId}/reports/sync-status`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

1. Health endpoint перевіряє process і database connectivity.
2. Reporting failure не повинен блокувати check-in після event-driven extraction.
3. Retries не створюють duplicate visits або audit events.
4. Critical state transitions транзакційні.

## NFR-03 — Security

**Release scope:** Cross-cutting  
**Priority:** `P0`  
**Implementation phase(s):** Phases 2, 4, 8, 10, 11, 12, 21 and 22  
**Depends on:** AUTH-04, AUTH-05, All protected stories  
**Primary module:** Cross-cutting  
**Required verification:** Auth/RBAC/IDOR tests, validation, rate limiting, secret scanning, dependency/security baseline

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `All authenticated screens`.
- Overlay UI IDs: `destructive overlays`.
- Exact Figma roots: resolve the UI IDs through `ui-contract.md`; this story is cross-cutting or has no dedicated root.
- Frontend route scope: `all protected routes`.
- Required frontend components: `AppShell, RoleGuard, BranchGuard, ConfirmAlertDialog`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-001`, `DB-ORG-002`, `DB-IDN-001`, `DB-IDN-002`, `DB-IDN-003`, `DB-CRM-001`, `DB-AUD-001`, `DB-PORTAL-001`.
- Physical tables/read models: `identity.organizations`, `identity.branches`, `identity.staff_users`, `identity.staff_branch_assignments`, `identity.refresh_tokens`, `crm.clients`, `audit.audit_logs`, `identity.client_accounts`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUTH-001..004`, All protected endpoints.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

1. Passwords зберігаються як secure hash.
2. Secrets не комітяться.
3. Backend виконує authorization для кожного protected operation.
4. Multi-tenant data isolation обов’язкова.
5. Sensitive data не логуються.
6. Production використовує HTTPS.
7. Rate limiting застосовується до auth і search endpoints за потреби.

## NFR-04 — Auditability

**Release scope:** Cross-cutting  
**Priority:** `P0`  
**Implementation phase(s):** Phases 4, 7, 17, 18 and 20  
**Depends on:** AUDIT-01  
**Primary module:** Audit  
**Required verification:** Audit completeness, immutability, correlation, old/new values, actor and tenant isolation

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-AUDIT-001 and all mutation flows`.
- Overlay UI IDs: `DRW-AUDIT-001`.
- Exact Figma roots: `Overlay/DRW-AUDIT-001/Audit/EventDetails/Default`.
- Frontend route scope: `audit and mutation routes`.
- Required frontend components: `AuditEventDetailsDrawer, AuditEventDiff`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-AUD-001`, `DB-MEM-005`, `DB-OPS-003`, `DB-OPS-004`, `DB-EVT-001`.
- Physical tables/read models: `audit.audit_logs`, `membership.membership_usage_ledger`, `operations.visit_corrections`, `operations.incidents`, `integration.outbox_events`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; append-only/event-consumer integrity evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-AUDIT-001` `GET /api/v1/organizations/{organizationId}/audit-events`, `API-AUDIT-002` `GET /api/v1/audit-events/{auditEventId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

1. Усі критичні operations мають actor, timestamp і correlation ID.
2. Manual correction завжди має reason.
3. Audit data не редагуються через звичайний UI.

## NFR-05 — Testability

**Release scope:** Cross-cutting  
**Priority:** `P0`  
**Implementation phase(s):** Phases 1, 2, 3, 7, 8, 10 and 13  
**Depends on:** Technical foundation from Phases 1–3  
**Primary module:** Cross-cutting  
**Required verification:** Deterministic tests, stable selectors, API setup, isolated data, CI execution and useful failure evidence

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `All screens and overlays`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: resolve the UI IDs through `ui-contract.md`; this story is cross-cutting or has no dedicated root.
- Frontend route scope: `all routes`.
- Required frontend components: `semantic HeroUI components; stable accessible names; no test-only IDs unless required`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-001`, `DB-ORG-002`, `DB-IDN-001`, `DB-IDN-002`, `DB-IDN-003`, `DB-CRM-001`, `DB-MEM-001`, `DB-MEM-002`, `DB-MEM-003`, `DB-MEM-004`, `DB-MEM-005`, `DB-OPS-001`, `DB-OPS-002`, `DB-OPS-003`, `DB-OPS-004`, `DB-COM-001`, `DB-AUD-001`, `DB-PORTAL-001`, `DB-EVT-001`, `DB-EVT-002`, `DB-RPT-001`, `DB-RPT-002`, `DB-RPT-003`, `DB-RPT-004`.
- Physical tables/read models: `identity.organizations`, `identity.branches`, `identity.staff_users`, `identity.staff_branch_assignments`, `identity.refresh_tokens`, `crm.clients`, `membership.membership_plans`, `membership.membership_plan_branches`, `membership.memberships`, `membership.membership_freeze_periods`, `membership.membership_usage_ledger`, `operations.locker_keys`, `operations.visit_sessions`, `operations.visit_corrections`, `operations.incidents`, `platform.idempotency_records`, `audit.audit_logs`, `identity.client_accounts`, `integration.outbox_events`, `integration.processed_events`, `reporting.reporting_visit_facts`, `reporting.reporting_daily_branch_metrics`, `reporting.reporting_employee_daily_metrics`, `reporting.reporting_sync_state`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: all schema changes must be reproducible through migrations and covered by real PostgreSQL integration tests.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-TEST-001` `POST /api/test-support/seed`, `API-TEST-002` `DELETE /api/test-support/test-runs/{testRunId}`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

1. API має стабільні machine-readable error codes.
2. UI використовує semantic controls і accessible labels.
3. Test data можна створити й очистити через API.
4. Time-dependent logic має injectable clock або контрольовану abstraction.
5. Idempotency підтримується для critical operations.

## NFR-06 — Observability

**Release scope:** Cross-cutting  
**Priority:** `P1`  
**Implementation phase(s):** Phases 2, 9, 11, 12, 13, 20 and 22  
**Depends on:** Structured logging from Phase 2, EVENT-01  
**Primary module:** Cross-cutting  
**Required verification:** Structured logs, metrics, traces, correlation propagation, dashboards and verified alarms

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `All screens`.
- Overlay UI IDs: `No dedicated overlay`.
- Exact Figma roots: resolve the UI IDs through `ui-contract.md`; this story is cross-cutting or has no dedicated root.
- Frontend route scope: `all routes`.
- Required frontend components: `ErrorState, CorrelationIdText, environment/version indicators`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-AUD-001`, `DB-EVT-001`, `DB-EVT-002`, `DB-RPT-004`.
- Physical tables/read models: `audit.audit_logs`, `integration.outbox_events`, `integration.processed_events`, `reporting.reporting_sync_state`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; append-only/event-consumer integrity evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-SYS-001` `GET /health`, `API-SYS-002` `GET /ready`, `API-SYS-003` `GET /version`, `API-REPORT-006` `GET /api/v1/organizations/{organizationId}/reports/sync-status`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation.

<!-- END API IMPLEMENTATION CONTRACT -->

1. Structured JSON logs.
2. Correlation ID проходить через HTTP і майбутні events.
3. `/health` і `/version` доступні.
4. Logs містять environment і commit version.

## NFR-07 — Data consistency

**Release scope:** Cross-cutting  
**Priority:** `P0`  
**Implementation phase(s):** Phases 6, 7, 17 and 20  
**Depends on:** MEMBERSHIP-04, VISIT-01, VISIT-06, EVENT-01  
**Primary module:** Cross-cutting  
**Required verification:** Transactions, database constraints, concurrency, idempotency and event-processing consistency

<!-- BEGIN UI IMPLEMENTATION CONTRACT -->

**UI implementation contract:**

- Screen UI IDs: `SCR-REC-001, SCR-VISIT-001, SCR-KEY-001`.
- Overlay UI IDs: `OVL-VISIT-001, OVL-VISIT-003`.
- Exact Figma roots: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`, `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`, `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`, `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`, `Overlay/OVL-VISIT-003/Visit/CheckoutByKey/Lookup`.
- Frontend route scope: `operations routes`.
- Required frontend components: `ConcurrencyConflictAlert, NetworkUncertaintyAlert, ConsistencyStatusIndicator`.
- Naming source of truth: `ui-contract.md`; required child layers: `figma-make-prompts.md`.

<!-- END UI IMPLEMENTATION CONTRACT -->
<!-- BEGIN DATABASE IMPLEMENTATION CONTRACT -->

**Database implementation contract:**

- Database requirement IDs: `DB-ORG-002`, `DB-IDN-002`, `DB-MEM-002`, `DB-MEM-003`, `DB-MEM-004`, `DB-MEM-005`, `DB-OPS-001`, `DB-OPS-002`, `DB-OPS-003`, `DB-OPS-004`, `DB-COM-001`, `DB-EVT-001`, `DB-EVT-002`.
- Physical tables/read models: `identity.branches`, `identity.staff_branch_assignments`, `membership.membership_plan_branches`, `membership.memberships`, `membership.membership_freeze_periods`, `membership.membership_usage_ledger`, `operations.locker_keys`, `operations.visit_sessions`, `operations.visit_corrections`, `operations.incidents`, `platform.idempotency_records`, `integration.outbox_events`, `integration.processed_events`.
- Canonical schema, fields, constraints, indexes and lifecycle: `database-requirements.md`.
- Required database evidence: real PostgreSQL integration tests for affected constraints, tenant scope and query behavior; transaction/concurrency/idempotency rollback evidence.

<!-- END DATABASE IMPLEMENTATION CONTRACT -->
<!-- BEGIN API IMPLEMENTATION CONTRACT -->

**API implementation contract:**

- API contracts: `API-VISIT-002` `POST /api/v1/branches/{branchId}/visits/check-in`, `API-VISIT-003` `POST /api/v1/branches/{branchId}/visits/checkout-by-key`, `API-VISIT-005` `POST /api/v1/visits/{visitId}/checkout`, `API-VISIT-007` `POST /api/v1/visits/{visitId}/corrections`, `API-KEY-005` `POST /api/v1/locker-keys/{lockerKeyId}/status-transitions`, `API-MEM-002` `POST /api/v1/clients/{clientId}/memberships`, `API-INC-002` `POST /api/v1/branches/{branchId}/incidents`.
- Canonical request/response schemas, status codes, error codes, token and header policy: `api-requirements.md`.
- Required API evidence: OpenAPI schema, positive/negative Playwright API tests, auth/tenant isolation, real PostgreSQL transaction/concurrency/idempotency evidence.

<!-- END API IMPLEMENTATION CONTRACT -->

1. Check-in + key assignment — atomic.
2. Check-out + key release — atomic.
3. Unique active visit/client enforced database constraint.
4. Unique issued key enforced database constraint або transaction locking.
5. UTC storage, branch timezone display.

---

# 7. Release scope boundaries

## 7.1. Lean MVP — Phases 0–8

Lean MVP потрібен для завершення функціонального vertical slice і локального QA automation. Він включає:

- staff login, logout, refresh token і role-based access;
- bootstrap organization/branch та branch context foundation;
- створення Employee;
- створення, пошук і перегляд профілю Client;
- membership plan, призначення membership, eligibility та атомарне списання visit;
- додавання й перегляд locker keys;
- atomic/idempotent check-in і check-out;
- active visits і client visit history;
- backend audit для критичних операцій;
- REST API, Swagger/OpenAPI, PostgreSQL і Prisma migrations;
- unit, real-PostgreSQL integration, Playwright API та critical UI smoke/regression;
- локальний PostgreSQL container дозволений як development dependency.

Lean MVP **не включає як Definition of Done**:

- full containerized application runtime;
- Jenkins;
- AWS;
- post-deployment або nightly jobs;
- organizations/branches UI management;
- full staff/client lifecycle;
- membership freeze, advanced key statuses;
- corrections, incidents, reports, client portal, events або microservices.

## 7.2. Post-MVP QA/CI/CD milestone — Phases 9–13

Після green Lean MVP реалізуються platform stories:

- `PLATFORM-01` — containerize web and API;
- `PLATFORM-02` — reproducible Docker Compose runtime/test stack;
- `CICD-01` — Jenkins Pull Request quality pipeline;
- `CLOUD-01` — reproducible AWS staging infrastructure;
- `CICD-02` — build and publish immutable images to ECR;
- `CICD-03` — Jenkins deployment to AWS staging;
- `QAOPS-01` — mandatory post-deployment MVP smoke;
- `REL-01` — exercised staging rollback;
- `QAOPS-02` — nightly regression and scheduled quality checks.

CI/CD milestone вважається завершеним після Phase 13, коли MVP працює у Docker, перевіряється у Jenkins, автоматично розгортається на AWS staging, проходить post-deploy smoke, має nightly regression та перевірений rollback.

## 7.3. Product expansion — Phases 14–23

Решта загального product scope не видаляється. Вона реалізується після QA/CI/CD milestone відповідно до `implementation-plan.md`: platform administration, full lifecycle, corrections/incidents, audit/reports, optional client portal, events/microservices, production і portfolio packaging.

---

# 8. Definition of Done для user story

Story завершена, якщо:

1. Acceptance criteria реалізовані.
2. Product permissions/tenant/branch scope перевірені backend, якщо застосовно.
3. API contract і Swagger оновлені, якщо story змінює API.
4. Database migration додана й перевірена, якщо story змінює schema.
5. Unit/integration/API/UI verification виконана відповідно до metadata.
6. Platform story має version-controlled Docker/Jenkins/IaC/runbook artifacts.
7. Critical pipeline/deployment gate перевірений навмисним failure scenario.
8. Audit/logging/correlation/deployment metadata додані за потреби.
9. Lint, typecheck, build, tests або infrastructure validation проходять у визначеному середовищі.
10. Cleanup, rollback і failure artifacts реалізовані, якщо їх вимагає story.
11. Документація та traceability оновлені.
