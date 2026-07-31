# API Requirements — GymOps

## 1. Призначення документа

Цей документ є source of truth для HTTP API GymOps. Він узгоджує:

- user stories з `requirements.md`;
- frontend routes, screens і overlays з `ui-contract.md` та `ui-flows.md`;
- backend modules і service boundaries з `architecture.md`;
- PostgreSQL tables, constraints і transactions з `database-requirements.md`;
- порядок реалізації з `implementation-plan.md`.

Кожний endpoint має стабільний `API-*` ID. Цей ID використовується для traceability, OpenAPI operationId, тест-плану та посилань у user stories.

## 2. Результат аналізу frontend, backend і database

Поточна модель потребує:

- staff authentication із RBAC та branch scope;
- platform-level organization management;
- organization-scoped staff, clients і membership plans;
- branch-scoped locker keys, visits та incidents;
- атомарних command endpoints для check-in/check-out;
- окремих read endpoints для reception workspace, client profile, audit і reports;
- idempotency та optimistic concurrency;
- окремого post-MVP client portal;
- internal event contracts після extraction Reporting/Audit Service;
- test-support endpoints лише в LOCAL/CI.

### 2.1. Виявлені product/API gaps

Frontend-документ уже передбачає кілька дій, які не мають окремої user story з власним номером:

1. редагування branch;
2. редагування/deactivation membership plan;
3. завершення freeze period;
4. cancellation membership;
5. редагування metadata locker key;
6. dashboard summary endpoints;
7. current-session/profile read endpoint.

У цьому документі вони визначені як supporting operations існуючих stories. Перед production implementation бажано або:
- додати окремі stories для бізнес-значущих дій; або
- явно розширити acceptance criteria відповідних stories.

## 3. API boundaries

Base path:

```text
/api/v1
```

System endpoints можуть бути поза versioned business path:

```text
/health
/ready
/version
```

### 3.1. Tenant і branch scope

- Для `GYM_ADMIN` та `EMPLOYEE` organization визначається access token context.
- `organizationId` у path не є trusted: backend обов’язково порівнює його з authenticated scope.
- `branchId` передається у path/query лише для вибору контексту та завжди перевіряється проти active branch assignments.
- `EMPLOYEE` не може отримати доступ до чужої branch підміною UUID.
- Для foreign-tenant IDs API зазвичай повертає `404`, якщо `403` розкривав би існування чужого resource.
- `SUPER_ADMIN` має platform scope, але кожна platform action audit-иться.

## 4. Global HTTP conventions

### 4.1. Media types

Success:

```http
Content-Type: application/json
```

Errors:

```http
Content-Type: application/problem+json
```

### 4.2. Required/allowed headers

| Header | Direction | Requirement |
|---|---|---|
| `Authorization: Bearer <access-token>` | Request | Required for protected endpoints. Token is never accepted in URL/query. |
| `X-Correlation-ID` | Request/Response | Client MAY send UUID; server generates when absent and always echoes it. |
| `Idempotency-Key` | Request | Required for critical commands; UUID/opaque string, max 160. |
| `If-Match` | Request | Required for PATCH/correction of versioned resources. |
| `ETag` | Response | `W/"<version>"` for versioned resources. |
| `Location` | Response | Required on `201 Created`. |
| `Retry-After` | Response | Required on `429`; recommended on retryable `503`. |
| `Accept-Language` | Request | Optional; machine error codes never change with locale. |
| `Cache-Control: no-store` | Response | Required for auth/token responses and sensitive profile data. |

### 4.3. Date/time rules

- Timestamp: ISO 8601 UTC, e.g. `2026-07-31T18:45:12.123Z`.
- Business date: `YYYY-MM-DD` interpreted in branch timezone.
- Storage is UTC; frontend formatting uses branch timezone.
- Server time is canonical for security/audit.
- Manually entered check-in/check-out timestamps are policy-limited and validated.

### 4.4. Pagination

Standard list query:

```text
page=1
pageSize=25
sort=createdAt:desc
```

Rules:

- `page >= 1`;
- default `pageSize=25`;
- maximum `pageSize=100`;
- sort fields are allow-listed;
- no unbounded list endpoint;
- search query is normalized;
- responses echo applied filters.

Standard page response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 0,
    "sort": ["createdAt:desc"],
    "requestId": "01J...",
    "correlationId": "6eb2d8c0-..."
  }
}
```

### 4.5. Single-resource response

```json
{
  "data": {},
  "meta": {
    "requestId": "01J...",
    "correlationId": "6eb2d8c0-..."
  }
}
```

### 4.6. PATCH and optimistic concurrency

- PATCH contains only mutable fields.
- Null is accepted only when a field is explicitly clearable.
- Every versioned resource response returns `ETag: W/"7"`.
- Mutation requires `If-Match: W/"7"`.
- Mismatch returns `412 RESOURCE_VERSION_STALE`.
- Backend must not silently overwrite a concurrent edit.

## 5. Error handling

GymOps uses RFC 9457-compatible Problem Details.

Example:

```json
{
  "type": "https://api.gymops.example/problems/locker-key-not-available",
  "title": "Locker key is not available",
  "status": 409,
  "detail": "Locker key 17 was assigned by another operation.",
  "instance": "/api/v1/branches/8d.../visits/check-in",
  "code": "LOCKER_KEY_NOT_AVAILABLE",
  "correlationId": "6eb2d8c0-...",
  "requestId": "01J...",
  "retryable": false,
  "errors": [
    {
      "pointer": "/lockerKeyId",
      "code": "LOCKER_KEY_NOT_AVAILABLE",
      "message": "Select another available key."
    }
  ],
  "timestamp": "2026-07-31T18:45:12.123Z"
}
```

Rules:

- `code` is stable and machine-readable.
- `title/detail/message` may be localized and must not be asserted verbatim by API automation except localization tests.
- No stack traces, SQL, internal hostnames, token values, password hashes or secrets.
- Validation errors use JSON Pointer.
- A `500` response uses generic detail and a correlation ID.
- Login errors never disclose whether account exists, is deactivated or has a wrong password.


## 6. Token and session requirements

### 6.1. Access token

- Format: signed JWT.
- Signing algorithm: `RS256` for portability across future services.
- JWT verifier MUST allow-list the algorithm and reject `none` or algorithm substitution.
- Header contains `typ=JWT` and `kid`.
- Access token lifetime: default 10 minutes, environment-configurable.
- Allowed clock skew: maximum 60 seconds.
- Token is returned in response body and stored by frontend in memory, not `localStorage` or `sessionStorage`.
- Token is sent only through `Authorization: Bearer`.
- HTTPS is mandatory outside LOCAL.

Required claims:

| Claim | Requirement |
|---|---|
| `iss` | Environment-specific issuer; exact validation. |
| `aud` | `gymops-api`; exact validation. |
| `sub` | Staff user ID or client account ID. |
| `jti` | Unique token ID. |
| `sid` | Refresh/session family ID. |
| `iat`, `nbf`, `exp` | Required and validated. |
| `principal_type` | `STAFF` or `CLIENT`. |
| `role` | `SUPER_ADMIN`, `GYM_ADMIN`, `EMPLOYEE`, or `CLIENT`. |
| `organization_id` | Required except platform SUPER_ADMIN. |
| `branch_ids` | Active branch assignments for staff; empty for SUPER_ADMIN/client. |
| `primary_branch_id` | Optional staff default branch. |
| `permissions_version` | Must match current staff/account security version for critical operations. |
| `scope` | Minimum required scopes; future service authorization. |

### 6.2. Refresh token

- Opaque cryptographically random token, minimum 256 bits of entropy.
- Refresh token is never a JWT requirement.
- Stored only in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie.
- Separate cookie names and paths for staff and client portal.
- Raw value is never persisted; DB stores HMAC-SHA-256/token hash.
- Rotation occurs on every successful refresh.
- Reuse of a rotated token revokes the whole token family.
- Staff refresh lifetime: default 14 days absolute.
- Staff inactivity limit: default 12 hours.
- Client portal refresh lifetime: default 30 days; inactivity default 7 days.
- Logout revokes the current session/family and clears cookie.
- Staff deactivation, password reset, role or branch assignment change revokes active refresh sessions.
- Auth responses use `Cache-Control: no-store`.

Suggested staff cookie:

```text
gymops_staff_refresh
Path=/api/v1/auth
HttpOnly
Secure
SameSite=Strict
```

Suggested client cookie:

```text
gymops_client_refresh
Path=/api/v1/portal/auth
HttpOnly
Secure
SameSite=Strict
```

### 6.3. CSRF and browser rules

Because refresh/logout use cookies:

- exact Origin/Referer allow-list is required;
- CORS uses exact allowed origins, never `*` with credentials;
- refresh/logout require a double-submit CSRF token or equivalent proven protection;
- access tokens are not placed in cookies in the default architecture;
- token endpoints reject cross-origin requests outside allow-list.

### 6.4. Authorization refresh

Role/status/branch assignment changes:

1. increment staff security/permissions version;
2. revoke refresh token families;
3. invalidate or reject stale access tokens at critical command boundaries;
4. require `/auth/me` refresh in frontend.

### 6.5. Future service-to-service tokens

After microservice extraction:

- service tokens are short-lived, maximum 5 minutes;
- `principal_type=SERVICE`;
- audience is one concrete service;
- scopes are explicit;
- no refresh token;
- mTLS/DPoP may be added later;
- AWS IAM credentials are preferred for AWS-native calls;
- user access tokens must not be forwarded blindly to every internal service.


## 7. Request body schemas


### 7.1. `StaffLoginRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| email | string(email), required | Trimmed; normalize lowercase for lookup; max 254. |
| password | string, required | 8–128 chars; never logged. |



### 7.2. `CreateOrganizationRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| code | string, required | Uppercase normalized; 2–40; `^[A-Z0-9_-]+$`. |
| name | string, required | 2–160. |
| legalName | string, optional | Max 200. |
| defaultTimezone | IANA timezone, required | Example `Europe/Kyiv`. |



### 7.3. `UpdateOrganizationRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| name | string, optional | 2–160. |
| legalName | string\|null, optional | Max 200. |
| defaultTimezone | IANA timezone, optional | Must be supported. |



### 7.4. `DeactivateReasonRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| reason | string, required | 3–500; audit-safe, no secrets. |



### 7.5. `ReasonRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| reason | string, optional | Max 500. |



### 7.6. `CreateBranchRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| code | string, required | 2–40; unique within organization. |
| name | string, required | 2–160. |
| addressLine1 | string, optional | Max 200. |
| addressLine2 | string, optional | Max 200. |
| city | string, optional | Max 120. |
| timezone | IANA timezone, optional | Defaults to organization timezone. |
| autoCloseAfterMinutes | integer\|null, optional | 60–1440 or null. |



### 7.7. `UpdateBranchRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| name | string, optional | 2–160. |
| addressLine1 | string\|null, optional | Max 200. |
| addressLine2 | string\|null, optional | Max 200. |
| city | string\|null, optional | Max 120. |
| timezone | IANA timezone, optional | Must be supported. |
| autoCloseAfterMinutes | integer\|null, optional | 60–1440 or null. |



### 7.8. `CreateStaffRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| email | string(email), required | Unique globally after normalization. |
| firstName | string, required | 1–100. |
| lastName | string, required | 1–100. |
| phone | string, optional | Normalized by backend. |
| role | GYM_ADMIN\|EMPLOYEE, required | GYM_ADMIN can only create EMPLOYEE. |
| branchAssignments | array, conditional | Required for EMPLOYEE; each `{branchId,isPrimary}`. |
| sendInvitation | boolean, optional | Default true. |



### 7.9. `UpdateStaffRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| firstName | string, optional | 1–100. |
| lastName | string, optional | 1–100. |
| phone | string\|null, optional | Max 32. |
| role | GYM_ADMIN\|EMPLOYEE, optional | Subject to privilege rules. |



### 7.10. `ReplaceBranchAssignmentsRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| assignments | array, required | Non-empty for EMPLOYEE; unique branchId; exactly one `isPrimary=true`. |



### 7.11. `ClientDuplicateCheckRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| firstName | string, required | 1–100. |
| lastName | string, required | 1–100. |
| email | string(email), optional | Max 254. |
| phone | string, optional | Max 32. |
| dateOfBirth | date, optional | YYYY-MM-DD. |



### 7.12. `CreateClientRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| clientNumber | string, optional | Generated when omitted; unique in organization. |
| firstName | string, required | 1–100. |
| lastName | string, required | 1–100. |
| email | string(email), optional | Max 254. |
| phone | string, optional | Max 32. |
| dateOfBirth | date, optional | Not in future. |
| homeBranchId | uuid, optional | Must belong to organization. |
| notes | string, optional | Max 2000; no secrets/medical data unless future policy permits. |
| duplicateOverrideToken | string, optional | One-time signed token from duplicate conflict. |



### 7.13. `UpdateClientRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| clientNumber | string, optional | Unique in organization. |
| firstName | string, optional | 1–100. |
| lastName | string, optional | 1–100. |
| email | string\|null, optional | Max 254. |
| phone | string\|null, optional | Max 32. |
| dateOfBirth | date\|null, optional | Not in future. |
| homeBranchId | uuid\|null, optional | Same organization. |
| notes | string\|null, optional | Max 2000. |



### 7.14. `BlockClientRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| reason | string, required | 3–500. |



### 7.15. `CreateMembershipPlanRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| code | string, required | 2–40; uppercase normalized; unique in organization. |
| name | string, required | 2–160. |
| description | string, optional | Max 2000. |
| planType | enum, required | UNLIMITED, LIMITED_VISITS, SINGLE_VISIT, TRIAL, CORPORATE. |
| durationDays | integer\|null, conditional | 1–3650 when day-based. |
| visitLimit | integer\|null, conditional | Required for limited/single visit. |
| allowsFreeze | boolean, required | Default false. |
| maxFreezeDays | integer\|null, conditional | Required when freeze enabled; 1–365. |
| branchIds | uuid[], required | At least one allowed branch. |



### 7.16. `UpdateMembershipPlanRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| name | string, optional | 2–160. |
| description | string\|null, optional | Max 2000. |
| durationDays | integer\|null, optional | Cannot invalidate existing memberships. |
| visitLimit | integer\|null, optional | Applies only to future assignments. |
| allowsFreeze | boolean, optional | Applies to future operations. |
| maxFreezeDays | integer\|null, optional | 1–365. |
| branchIds | uuid[], optional | At least one; organization-owned. |



### 7.17. `AssignMembershipRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| membershipPlanId | uuid, required | Active plan. |
| startsOn | date, required | Branch-local business date. |
| endsOn | date\|null, optional | Computed from plan when omitted. |



### 7.18. `FreezeMembershipRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| startsOn | date, required | Inclusive. |
| endsOn | date, required | Inclusive; >= startsOn. |
| reason | string, required | 3–500. |



### 7.19. `EndFreezeRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| endsOn | date, required | Effective end date; cannot be before startsOn. |
| reason | string, optional | Max 500. |



### 7.20. `CancelMembershipRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| reason | string, required | 3–500. |
| effectiveOn | date, optional | Default current branch-local date. |



### 7.21. `CreateLockerKeyRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| keyNumber | string, required | 1–40; unique within branch. |
| lockerNumber | string, optional | Max 40. |



### 7.22. `UpdateLockerKeyRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| keyNumber | string, optional | 1–40; unique within branch. |
| lockerNumber | string\|null, optional | Max 40. |



### 7.23. `LockerKeyStatusTransitionRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| targetStatus | enum, required | AVAILABLE, LOST, DAMAGED, MAINTENANCE, DEACTIVATED; ISSUED only via check-in. |
| reason | string, conditional | Required except AVAILABLE. |
| incidentId | uuid, optional | Required/linked for incident-driven transitions when applicable. |



### 7.24. `CheckInRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| clientId | uuid, required | Organization-scoped client. |
| membershipId | uuid, required | Must be eligible at branch/time. |
| lockerKeyId | uuid, required | Must be AVAILABLE in branch. |
| startedAt | date-time, optional | Default server time; manual past input limited by policy. |



### 7.25. `CheckoutByKeyRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| keyNumber | string, required | Branch-scoped reception identifier. |
| finishedAt | date-time, optional | Default server time. |



### 7.26. `CheckoutVisitRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| finishedAt | date-time, optional | Default server time. |



### 7.27. `CreateVisitCorrectionRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| correctionType | enum, required | TIME, KEY, MEMBERSHIP, STATUS, CLIENT, OTHER. |
| changes | object, required | Whitelisted fields only: startedAt, finishedAt, lockerKeyId, membershipId, clientId, status. |
| reason | string, required | 3–1000. |



### 7.28. `AutoCloseVisitRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| finishedAt | date-time, optional | Default threshold-derived time or job time. |
| reason | string, required | Machine/human reason; max 500. |



### 7.29. `CreateIncidentRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| incidentType | enum, required | LOST_KEY, DAMAGED_KEY, LEFT_WITH_KEY, INCORRECT_ASSIGNMENT, MEMBERSHIP_CONFLICT, OTHER. |
| severity | LOW\|MEDIUM\|HIGH\|CRITICAL, required | Default policy may preselect. |
| summary | string, required | 3–200. |
| description | string, optional | Max 4000. |
| visitId | uuid, optional | At least one related entity required. |
| clientId | uuid, optional | Must belong to same organization. |
| lockerKeyId | uuid, optional | Must belong to branch. |
| assignedToStaffUserId | uuid, optional | Same organization. |



### 7.30. `UpdateIncidentRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| severity | enum, optional | LOW, MEDIUM, HIGH, CRITICAL. |
| summary | string, optional | 3–200. |
| description | string\|null, optional | Max 4000. |
| assignedToStaffUserId | uuid\|null, optional | Same organization. |
| status | IN_PROGRESS, optional | RESOLVED/CANCELLED use command endpoints. |



### 7.31. `ResolveIncidentRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| resolution | string, required | 3–4000. |
| finalKeyStatus | enum, optional | AVAILABLE, LOST, DAMAGED, MAINTENANCE, DEACTIVATED. |



### 7.32. `CancelIncidentRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| reason | string, required | 3–1000. |



### 7.33. `ClientPortalLoginRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| email | string(email), required | Max 254. |
| password | string, required | 8–128. |



### 7.34. `TestSeedRequest`


| Field | Type / required | Validation / semantics |
| --- | --- | --- |
| testRunId | string, required | Stable run tag; max 120. |
| scenario | string, required | Allow-listed scenario name. |
| overrides | object, optional | Allow-listed deterministic values only. |



## 8. Response resource schemas


| Schema | Fields / rules |
| --- | --- |
| `AuthSessionResponse` | `accessToken`, `tokenType=Bearer`, `expiresInSeconds`, `session` (`staffUserId`, `email`, `name`, `role`, `organizationId`, `branches[]`, `primaryBranchId`, `permissionsVersion`); refresh token is cookie-only. |
| `AccessTokenResponse` | `accessToken`, `tokenType`, `expiresInSeconds`, `sessionVersion`; rotated refresh token is cookie-only. |
| `CurrentStaffSessionResponse` | Current principal, role, organization, active branches, primary branch, permissionsVersion, feature permissions, environment/version hints. |
| `OrganizationResource` | `id`, `code`, `name`, `legalName`, `status`, `defaultTimezone`, `createdAt`, `updatedAt`, `version`. |
| `OrganizationDetailsResource` | OrganizationResource plus bounded counts and optionally first-page branches/admins; no unbounded nested lists. |
| `BranchResource` | `id`, `organizationId`, `code`, `name`, address fields, `timezone`, `status`, `autoCloseAfterMinutes`, timestamps, `version`. |
| `StaffResource` | `id`, `organizationId`, email/name/phone, `role`, `status`, `branchAssignments[]`, `lastLoginAt`, timestamps, `version`; no hashes/security counters. |
| `DuplicateCheckResponse` | `potentialDuplicate`, `candidates[]` with minimal identity fields and match reasons; optional short-lived `overrideToken`. |
| `ClientSummaryResource` | `id`, `clientNumber`, name, phone/email, status, homeBranch summary, active membership summary, active visit flag, `version`. |
| `ClientResource` | Client fields safe for staff UI, timestamps, status/block reason, version; excludes normalized/internal fields. |
| `ClientDetailsResource` | ClientResource plus bounded membership summary, active visit summary, recent visits/incidents counts or links. |
| `MembershipPlanResource` | Plan fields, allowed branches, status, timestamps, `version`. |
| `MembershipResource` | `id`, client/plan IDs, status, dates, immutable plan snapshot, visitsUsed, remainingVisits, active freeze summary, timestamps, `version`. |
| `MembershipDetailsResource` | MembershipResource plus freeze periods and usage ledger page/link. |
| `MembershipEligibilityResponse` | `eligible`, `reasonCodes[]`, `evaluatedAt`, branch, selected/eligible memberships, remainingVisits, warnings; ordinary ineligibility is 200. |
| `MembershipFreezeResource` | Freeze ID, membership ID, date range, status, reason, actors/timestamps. |
| `LockerKeyResource` | `id`, branch, key/locker number, status/reason, active visit/client summary when requested, timestamps, `version`. |
| `LockerKeyDetailsResource` | LockerKeyResource plus current assignment and recent incident summary. |
| `VisitSummaryResource` | `id`, branch, client summary, membership summary, locker key, status, started/finished time, duration, actors, source, `version`. |
| `VisitResource` | Visit fields plus immutable membership snapshot, correlation IDs and links; no internal request hash. |
| `VisitDetailsResource` | VisitResource plus correction history and incidents. |
| `VisitHistoryResource` | Client-safe/staff-safe historical row with branch, date/time, duration, key number, status; role determines exposed staff data. |
| `VisitCorrectionResource` | Correction ID/type, whitelisted old/new values, reason, actor, correlation ID, createdAt. |
| `IncidentSummaryResource` | ID, type, severity, status, summary, branch, related client/key/visit summaries, assignee, reported/resolved timestamps, version. |
| `IncidentResource` | IncidentSummaryResource plus description, resolution and actor details. |
| `IncidentDetailsResource` | IncidentResource plus audit/correlation links. |
| `AuditEventSummaryResource` | ID, timestamp, actor, role, action, entity type/ID, branch, correlation ID. |
| `AuditEventDetailsResource` | Summary plus sanitized old/new values, reason, request ID and allowed metadata; never secrets/tokens/password hashes. |
| `GymDashboardResource` | Bounded KPI cards: active visits, visits today, available/issued/lost keys, open incidents, expiring memberships; freshness metadata. |
| `ReceptionDashboardResource` | Active visit preview, available key count, long-running alerts, current branch/time; bounded lists only. |
| `DailyVisitsReportResponse` | Aggregates, trend buckets, breakdown and optional paginated detail rows; includes filter echo and freshness. |
| `KeyStatusReportResponse` | Counts by status/branch, current issued keys and incident indicators; includes asOf/freshness. |
| `EmployeeActivityReportResponse` | Paginated staff activity metrics and totals; includes date range/freshness. |
| `ReportingSyncStatusResponse` | consumer, status, lagSeconds, lastEventCreatedAt, lastProcessedAt, lastError redacted. |
| `ClientAuthSessionResponse` | Client access token and minimal client session; separate portal refresh cookie. |
| `CurrentClientSessionResponse` | Client account and CRM client summary; no staff/tenant internals. |
| `ClientOwnVisitResource` | Only the authenticated client's visit history fields. |
| `HealthResponse` | `status`, `service`, `timestamp`. |
| `ReadinessResponse` | `status`, checks (`database`, `migrations`), `timestamp`; no credentials. |
| `VersionResponse` | `service`, `version`, `commitSha`, `buildTime`, `environment`. |
| `TestSeedResponse` | Created entity IDs grouped by domain and the `testRunId`. |



## 9. Endpoint contracts


### 9.1. System and delivery


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-SYS-001` | `GET` `/health` | Public | No body | 200 HealthResponse; 503 when process unhealthy | SERVICE_UNHEALTHY | No | NFR-02, NFR-06 |
| `API-SYS-002` | `GET` `/ready` | Internal/public behind infrastructure allow-list | No body | 200 ReadinessResponse; 503 until PostgreSQL/migrations ready | DATABASE_UNAVAILABLE, MIGRATION_NOT_READY | No | NFR-02, NFR-06 |
| `API-SYS-003` | `GET` `/version` | Public or authenticated by environment policy | No body | 200 VersionResponse | INTERNAL_ERROR | No | NFR-06 |



#### API-SYS-001 — `GET /health`


- **Authorization:** Public

- **Stories:** `NFR-02, NFR-06`

- **Frontend/UI consumers:** Infrastructure

- **Database contract:** Process only

- **Request contract:** No body

- **Success:** 200 HealthResponse; 503 when process unhealthy

- **Errors:** `SERVICE_UNHEALTHY`

- **Idempotency:** No

- **Additional requirements:** Liveness; must not depend on optional downstream services.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-SYS-002 — `GET /ready`


- **Authorization:** Internal/public behind infrastructure allow-list

- **Stories:** `NFR-02, NFR-06`

- **Frontend/UI consumers:** Infrastructure

- **Database contract:** Database connectivity

- **Request contract:** No body

- **Success:** 200 ReadinessResponse; 503 until PostgreSQL/migrations ready

- **Errors:** `DATABASE_UNAVAILABLE, MIGRATION_NOT_READY`

- **Idempotency:** No

- **Additional requirements:** Used by ECS readiness.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-SYS-003 — `GET /version`


- **Authorization:** Public or authenticated by environment policy

- **Stories:** `NFR-06`

- **Frontend/UI consumers:** Global AppShell

- **Request contract:** No body

- **Success:** 200 VersionResponse

- **Errors:** `INTERNAL_ERROR`

- **Idempotency:** No

- **Additional requirements:** Returns service name, semantic version, commit SHA, build time, environment; no secrets.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.2. Staff authentication and session


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-AUTH-001` | `POST` `/api/v1/auth/login` | Public | Body: StaffLoginRequest | 200 AuthSessionResponse; sets refresh and CSRF cookies | AUTH_INVALID_CREDENTIALS, AUTH_RATE_LIMITED, REQUEST_VALIDATION_FAILED | No | AUTH-01 |
| `API-AUTH-002` | `POST` `/api/v1/auth/refresh` | Refresh cookie + CSRF/Origin check | No JSON body; cookies + X-CSRF-Token | 200 AccessTokenResponse; rotates refresh cookie | AUTH_REFRESH_MISSING, AUTH_REFRESH_INVALID, AUTH_REFRESH_EXPIRED, AUTH_REFRESH_REUSED, CSRF_VALIDATION_FAILED | Replay-protected by rotation | AUTH-03 |
| `API-AUTH-003` | `POST` `/api/v1/auth/logout` | Access token optional; refresh cookie + CSRF/Origin check | No body | 204; clears cookies and revokes current refresh family/session | CSRF_VALIDATION_FAILED | Yes | AUTH-02 |
| `API-AUTH-004` | `GET` `/api/v1/auth/me` | Bearer staff access token | No body | 200 CurrentStaffSessionResponse | AUTH_TOKEN_MISSING, AUTH_TOKEN_INVALID, AUTH_TOKEN_EXPIRED, AUTH_SESSION_STALE | No | AUTH-01, AUTH-04, AUTH-05 |



#### API-AUTH-001 — `POST /api/v1/auth/login`


- **Authorization:** Public

- **Stories:** `AUTH-01`

- **Frontend/UI consumers:** SCR-AUTH-001

- **Database contract:** DB-IDN-001, DB-IDN-003, DB-AUD-001

- **Request contract:** Body: StaffLoginRequest

- **Success:** 200 AuthSessionResponse; sets refresh and CSRF cookies

- **Errors:** `AUTH_INVALID_CREDENTIALS, AUTH_RATE_LIMITED, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Additional requirements:** Always return generic invalid-credentials detail for unknown/deactivated/locked users.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-AUTH-002 — `POST /api/v1/auth/refresh`


- **Authorization:** Refresh cookie + CSRF/Origin check

- **Stories:** `AUTH-03`

- **Frontend/UI consumers:** Global SessionProvider, OVL-AUTH-001

- **Database contract:** DB-IDN-003

- **Request contract:** No JSON body; cookies + X-CSRF-Token

- **Success:** 200 AccessTokenResponse; rotates refresh cookie

- **Errors:** `AUTH_REFRESH_MISSING, AUTH_REFRESH_INVALID, AUTH_REFRESH_EXPIRED, AUTH_REFRESH_REUSED, CSRF_VALIDATION_FAILED`

- **Idempotency:** Replay-protected by rotation

- **Additional requirements:** Old token invalidated on every successful rotation.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-AUTH-003 — `POST /api/v1/auth/logout`


- **Authorization:** Access token optional; refresh cookie + CSRF/Origin check

- **Stories:** `AUTH-02`

- **Frontend/UI consumers:** SCR-PROFILE-001

- **Database contract:** DB-IDN-003, DB-AUD-001

- **Request contract:** No body

- **Success:** 204; clears cookies and revokes current refresh family/session

- **Errors:** `CSRF_VALIDATION_FAILED`

- **Idempotency:** Yes

- **Additional requirements:** Repeated logout remains 204.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-AUTH-004 — `GET /api/v1/auth/me`


- **Authorization:** Bearer staff access token

- **Stories:** `AUTH-01, AUTH-04, AUTH-05`

- **Frontend/UI consumers:** AppShell, SCR-PROFILE-001

- **Database contract:** DB-IDN-001, DB-IDN-002, DB-ORG-001, DB-ORG-002

- **Request contract:** No body

- **Success:** 200 CurrentStaffSessionResponse

- **Errors:** `AUTH_TOKEN_MISSING, AUTH_TOKEN_INVALID, AUTH_TOKEN_EXPIRED, AUTH_SESSION_STALE`

- **Idempotency:** No

- **Additional requirements:** Canonical frontend bootstrap endpoint.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.3. Organizations


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-ORG-001` | `GET` `/api/v1/organizations` | SUPER_ADMIN | Query: page, pageSize, q, status, sort | 200 Page<OrganizationResource> | ACCESS_ROLE_FORBIDDEN, REQUEST_VALIDATION_FAILED | No | ORG-01, ORG-02, ORG-03 |
| `API-ORG-002` | `POST` `/api/v1/organizations` | SUPER_ADMIN | Body: CreateOrganizationRequest | 201 OrganizationResource; Location header | ORGANIZATION_CODE_EXISTS, REQUEST_VALIDATION_FAILED | No | ORG-01 |
| `API-ORG-003` | `GET` `/api/v1/organizations/{organizationId}` | SUPER_ADMIN or own GYM_ADMIN | Path UUID | 200 OrganizationDetailsResource | ORGANIZATION_NOT_FOUND, ACCESS_ORGANIZATION_FORBIDDEN | No | ORG-01, ORG-02 |
| `API-ORG-004` | `PATCH` `/api/v1/organizations/{organizationId}` | SUPER_ADMIN; limited own settings for GYM_ADMIN | If-Match; Body: UpdateOrganizationRequest | 200 OrganizationResource with new ETag | ORGANIZATION_NOT_FOUND, ACCESS_ROLE_FORBIDDEN, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED | No | ORG-02 |
| `API-ORG-005` | `POST` `/api/v1/organizations/{organizationId}/deactivate` | SUPER_ADMIN | Idempotency-Key recommended; Body: DeactivateReasonRequest | 200 OrganizationResource | ORGANIZATION_NOT_FOUND, ORGANIZATION_ALREADY_DEACTIVATED, ORGANIZATION_HAS_BLOCKING_STATE, REQUEST_VALIDATION_FAILED | Recommended | ORG-03 |



#### API-ORG-001 — `GET /api/v1/organizations`


- **Authorization:** SUPER_ADMIN

- **Stories:** `ORG-01, ORG-02, ORG-03`

- **Frontend/UI consumers:** SCR-ORG-001

- **Database contract:** DB-ORG-001

- **Request contract:** Query: page, pageSize, q, status, sort

- **Success:** 200 Page<OrganizationResource>

- **Errors:** `ACCESS_ROLE_FORBIDDEN, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Additional requirements:** q searches code/name/legalName.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-ORG-002 — `POST /api/v1/organizations`


- **Authorization:** SUPER_ADMIN

- **Stories:** `ORG-01`

- **Frontend/UI consumers:** OVL-ORG-001

- **Database contract:** DB-ORG-001, DB-AUD-001

- **Request contract:** Body: CreateOrganizationRequest

- **Success:** 201 OrganizationResource; Location header

- **Errors:** `ORGANIZATION_CODE_EXISTS, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-ORG-003 — `GET /api/v1/organizations/{organizationId}`


- **Authorization:** SUPER_ADMIN or own GYM_ADMIN

- **Stories:** `ORG-01, ORG-02`

- **Frontend/UI consumers:** SCR-ORG-002, SCR-SETTINGS-001

- **Database contract:** DB-ORG-001, DB-ORG-002

- **Request contract:** Path UUID

- **Success:** 200 OrganizationDetailsResource

- **Errors:** `ORGANIZATION_NOT_FOUND, ACCESS_ORGANIZATION_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-ORG-004 — `PATCH /api/v1/organizations/{organizationId}`


- **Authorization:** SUPER_ADMIN; limited own settings for GYM_ADMIN

- **Stories:** `ORG-02`

- **Frontend/UI consumers:** OVL-ORG-002, SCR-SETTINGS-001

- **Database contract:** DB-ORG-001, DB-AUD-001

- **Request contract:** If-Match; Body: UpdateOrganizationRequest

- **Success:** 200 OrganizationResource with new ETag

- **Errors:** `ORGANIZATION_NOT_FOUND, ACCESS_ROLE_FORBIDDEN, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-ORG-005 — `POST /api/v1/organizations/{organizationId}/deactivate`


- **Authorization:** SUPER_ADMIN

- **Stories:** `ORG-03`

- **Frontend/UI consumers:** OVL-ORG-003

- **Database contract:** DB-ORG-001, DB-AUD-001

- **Request contract:** Idempotency-Key recommended; Body: DeactivateReasonRequest

- **Success:** 200 OrganizationResource

- **Errors:** `ORGANIZATION_NOT_FOUND, ORGANIZATION_ALREADY_DEACTIVATED, ORGANIZATION_HAS_BLOCKING_STATE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** Recommended

- **Additional requirements:** Revokes staff refresh sessions and blocks new operational commands.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.4. Branches


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-BRANCH-001` | `GET` `/api/v1/organizations/{organizationId}/branches` | SUPER_ADMIN or own GYM_ADMIN | Query: page, pageSize, q, status, sort | 200 Page<BranchResource> | ORGANIZATION_NOT_FOUND, ACCESS_ORGANIZATION_FORBIDDEN | No | BRANCH-01, BRANCH-02, AUTH-05 |
| `API-BRANCH-002` | `POST` `/api/v1/organizations/{organizationId}/branches` | SUPER_ADMIN or own GYM_ADMIN | Body: CreateBranchRequest | 201 BranchResource | BRANCH_CODE_EXISTS, ORGANIZATION_INACTIVE, REQUEST_VALIDATION_FAILED | No | BRANCH-01 |
| `API-BRANCH-003` | `GET` `/api/v1/branches/{branchId}` | Assigned staff, own GYM_ADMIN, SUPER_ADMIN | Path UUID | 200 BranchResource | BRANCH_NOT_FOUND | No | BRANCH-01, AUTH-05 |
| `API-BRANCH-004` | `PATCH` `/api/v1/branches/{branchId}` | Own GYM_ADMIN or SUPER_ADMIN | If-Match; Body: UpdateBranchRequest | 200 BranchResource | BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED | No | BRANCH-01 |
| `API-BRANCH-005` | `POST` `/api/v1/branches/{branchId}/deactivate` | Own GYM_ADMIN or SUPER_ADMIN | Body: DeactivateReasonRequest | 200 BranchResource | BRANCH_NOT_FOUND, BRANCH_HAS_ACTIVE_VISITS, BRANCH_ALREADY_DEACTIVATED, REQUEST_VALIDATION_FAILED | No | BRANCH-02 |



#### API-BRANCH-001 — `GET /api/v1/organizations/{organizationId}/branches`


- **Authorization:** SUPER_ADMIN or own GYM_ADMIN

- **Stories:** `BRANCH-01, BRANCH-02, AUTH-05`

- **Frontend/UI consumers:** SCR-ORG-002, SCR-SETTINGS-002

- **Database contract:** DB-ORG-002

- **Request contract:** Query: page, pageSize, q, status, sort

- **Success:** 200 Page<BranchResource>

- **Errors:** `ORGANIZATION_NOT_FOUND, ACCESS_ORGANIZATION_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-BRANCH-002 — `POST /api/v1/organizations/{organizationId}/branches`


- **Authorization:** SUPER_ADMIN or own GYM_ADMIN

- **Stories:** `BRANCH-01`

- **Frontend/UI consumers:** OVL-BRANCH-001

- **Database contract:** DB-ORG-002, DB-AUD-001

- **Request contract:** Body: CreateBranchRequest

- **Success:** 201 BranchResource

- **Errors:** `BRANCH_CODE_EXISTS, ORGANIZATION_INACTIVE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-BRANCH-003 — `GET /api/v1/branches/{branchId}`


- **Authorization:** Assigned staff, own GYM_ADMIN, SUPER_ADMIN

- **Stories:** `BRANCH-01, AUTH-05`

- **Frontend/UI consumers:** SCR-SETTINGS-002

- **Database contract:** DB-ORG-002

- **Request contract:** Path UUID

- **Success:** 200 BranchResource

- **Errors:** `BRANCH_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-BRANCH-004 — `PATCH /api/v1/branches/{branchId}`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `BRANCH-01`

- **Frontend/UI consumers:** OVL-BRANCH-002, SCR-SETTINGS-002

- **Database contract:** DB-ORG-002, DB-AUD-001

- **Request contract:** If-Match; Body: UpdateBranchRequest

- **Success:** 200 BranchResource

- **Errors:** `BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-BRANCH-005 — `POST /api/v1/branches/{branchId}/deactivate`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `BRANCH-02`

- **Frontend/UI consumers:** OVL-BRANCH-003

- **Database contract:** DB-ORG-002, DB-OPS-002, DB-AUD-001

- **Request contract:** Body: DeactivateReasonRequest

- **Success:** 200 BranchResource

- **Errors:** `BRANCH_NOT_FOUND, BRANCH_HAS_ACTIVE_VISITS, BRANCH_ALREADY_DEACTIVATED, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.5. Staff


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-STAFF-001` | `GET` `/api/v1/organizations/{organizationId}/staff` | Own GYM_ADMIN or SUPER_ADMIN | Query: page, pageSize, q, role, status, branchId, sort | 200 Page<StaffResource> | ACCESS_ROLE_FORBIDDEN, ACCESS_ORGANIZATION_FORBIDDEN | No | STAFF-01, STAFF-02, STAFF-03, STAFF-04 |
| `API-STAFF-002` | `POST` `/api/v1/organizations/{organizationId}/staff` | Own GYM_ADMIN or SUPER_ADMIN | Body: CreateStaffRequest | 201 StaffResource plus one-time invitation metadata; never password hash | STAFF_EMAIL_EXISTS, STAFF_ROLE_NOT_ALLOWED, BRANCH_ASSIGNMENT_INVALID, REQUEST_VALIDATION_FAILED | No | STAFF-01, STAFF-02 |
| `API-STAFF-003` | `GET` `/api/v1/staff/{staffUserId}` | Own GYM_ADMIN, SUPER_ADMIN, or self | Path UUID | 200 StaffResource | STAFF_NOT_FOUND | No | STAFF-03, STAFF-04 |
| `API-STAFF-004` | `PATCH` `/api/v1/staff/{staffUserId}` | Own GYM_ADMIN or SUPER_ADMIN | If-Match; Body: UpdateStaffRequest | 200 StaffResource | STAFF_NOT_FOUND, STAFF_ROLE_NOT_ALLOWED, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED | No | STAFF-03 |
| `API-STAFF-005` | `PUT` `/api/v1/staff/{staffUserId}/branch-assignments` | Own GYM_ADMIN or SUPER_ADMIN | Body: ReplaceBranchAssignmentsRequest | 200 StaffResource; increments permissions version and revokes/rotates sessions | STAFF_NOT_FOUND, BRANCH_ASSIGNMENT_INVALID, PRIMARY_BRANCH_REQUIRED, REQUEST_VALIDATION_FAILED | No | STAFF-03, AUTH-05 |
| `API-STAFF-006` | `POST` `/api/v1/staff/{staffUserId}/deactivate` | Own GYM_ADMIN or SUPER_ADMIN | Body: DeactivateReasonRequest | 200 StaffResource | STAFF_NOT_FOUND, CANNOT_DEACTIVATE_SELF, LAST_GYM_ADMIN_CONFLICT, STAFF_ALREADY_DEACTIVATED | No | STAFF-04 |



#### API-STAFF-001 — `GET /api/v1/organizations/{organizationId}/staff`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `STAFF-01, STAFF-02, STAFF-03, STAFF-04`

- **Frontend/UI consumers:** SCR-STAFF-001

- **Database contract:** DB-IDN-001, DB-IDN-002

- **Request contract:** Query: page, pageSize, q, role, status, branchId, sort

- **Success:** 200 Page<StaffResource>

- **Errors:** `ACCESS_ROLE_FORBIDDEN, ACCESS_ORGANIZATION_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-STAFF-002 — `POST /api/v1/organizations/{organizationId}/staff`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `STAFF-01, STAFF-02`

- **Frontend/UI consumers:** OVL-STAFF-001, OVL-STAFF-002

- **Database contract:** DB-IDN-001, DB-IDN-002, DB-AUD-001

- **Request contract:** Body: CreateStaffRequest

- **Success:** 201 StaffResource plus one-time invitation metadata; never password hash

- **Errors:** `STAFF_EMAIL_EXISTS, STAFF_ROLE_NOT_ALLOWED, BRANCH_ASSIGNMENT_INVALID, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-STAFF-003 — `GET /api/v1/staff/{staffUserId}`


- **Authorization:** Own GYM_ADMIN, SUPER_ADMIN, or self

- **Stories:** `STAFF-03, STAFF-04`

- **Frontend/UI consumers:** DRW-STAFF-001, SCR-PROFILE-001

- **Database contract:** DB-IDN-001, DB-IDN-002

- **Request contract:** Path UUID

- **Success:** 200 StaffResource

- **Errors:** `STAFF_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-STAFF-004 — `PATCH /api/v1/staff/{staffUserId}`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `STAFF-03`

- **Frontend/UI consumers:** OVL-STAFF-003

- **Database contract:** DB-IDN-001, DB-AUD-001

- **Request contract:** If-Match; Body: UpdateStaffRequest

- **Success:** 200 StaffResource

- **Errors:** `STAFF_NOT_FOUND, STAFF_ROLE_NOT_ALLOWED, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-STAFF-005 — `PUT /api/v1/staff/{staffUserId}/branch-assignments`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `STAFF-03, AUTH-05`

- **Frontend/UI consumers:** OVL-STAFF-003

- **Database contract:** DB-IDN-001, DB-IDN-002, DB-IDN-003, DB-AUD-001

- **Request contract:** Body: ReplaceBranchAssignmentsRequest

- **Success:** 200 StaffResource; increments permissions version and revokes/rotates sessions

- **Errors:** `STAFF_NOT_FOUND, BRANCH_ASSIGNMENT_INVALID, PRIMARY_BRANCH_REQUIRED, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-STAFF-006 — `POST /api/v1/staff/{staffUserId}/deactivate`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `STAFF-04`

- **Frontend/UI consumers:** OVL-STAFF-004

- **Database contract:** DB-IDN-001, DB-IDN-003, DB-AUD-001

- **Request contract:** Body: DeactivateReasonRequest

- **Success:** 200 StaffResource

- **Errors:** `STAFF_NOT_FOUND, CANNOT_DEACTIVATE_SELF, LAST_GYM_ADMIN_CONFLICT, STAFF_ALREADY_DEACTIVATED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.6. Clients


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-CLIENT-001` | `GET` `/api/v1/organizations/{organizationId}/clients` | Assigned staff, own GYM_ADMIN, SUPER_ADMIN | Query: page, pageSize, q(min 2), status, homeBranchId, sort | 200 Page<ClientSummaryResource> | SEARCH_QUERY_TOO_SHORT, ACCESS_ORGANIZATION_FORBIDDEN, RATE_LIMITED | No | CLIENT-02, CLIENT-03 |
| `API-CLIENT-002` | `POST` `/api/v1/organizations/{organizationId}/clients/duplicate-check` | Assigned staff or own GYM_ADMIN | Body: ClientDuplicateCheckRequest | 200 DuplicateCheckResponse | REQUEST_VALIDATION_FAILED, RATE_LIMITED | No | CLIENT-01 |
| `API-CLIENT-003` | `POST` `/api/v1/organizations/{organizationId}/clients` | Assigned staff or own GYM_ADMIN | Body: CreateClientRequest; optional duplicateOverrideToken | 201 ClientResource | CLIENT_POTENTIAL_DUPLICATE, CLIENT_NUMBER_EXISTS, DUPLICATE_OVERRIDE_INVALID, REQUEST_VALIDATION_FAILED | No | CLIENT-01 |
| `API-CLIENT-004` | `GET` `/api/v1/clients/{clientId}` | Assigned staff, own GYM_ADMIN, SUPER_ADMIN | Path UUID; optional include=membershipSummary,activeVisit | 200 ClientDetailsResource | CLIENT_NOT_FOUND | No | CLIENT-03 |
| `API-CLIENT-005` | `PATCH` `/api/v1/clients/{clientId}` | Assigned staff or own GYM_ADMIN | If-Match; Body: UpdateClientRequest | 200 ClientResource | CLIENT_NOT_FOUND, CLIENT_NUMBER_EXISTS, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED | No | CLIENT-04 |
| `API-CLIENT-006` | `POST` `/api/v1/clients/{clientId}/block` | Own GYM_ADMIN | Body: BlockClientRequest | 200 ClientResource | CLIENT_NOT_FOUND, CLIENT_ALREADY_BLOCKED, CLIENT_HAS_ACTIVE_VISIT, REQUEST_VALIDATION_FAILED | No | CLIENT-05 |
| `API-CLIENT-007` | `POST` `/api/v1/clients/{clientId}/unblock` | Own GYM_ADMIN | Body: ReasonRequest optional | 200 ClientResource | CLIENT_NOT_FOUND, CLIENT_NOT_BLOCKED | No | CLIENT-05 |
| `API-CLIENT-008` | `GET` `/api/v1/clients/{clientId}/incidents` | Assigned staff or own GYM_ADMIN | Query: page, pageSize, status, sort | 200 Page<IncidentSummaryResource> | CLIENT_NOT_FOUND | No | CLIENT-03, INCIDENT-01, INCIDENT-02 |



#### API-CLIENT-001 — `GET /api/v1/organizations/{organizationId}/clients`


- **Authorization:** Assigned staff, own GYM_ADMIN, SUPER_ADMIN

- **Stories:** `CLIENT-02, CLIENT-03`

- **Frontend/UI consumers:** SCR-CLIENT-001, SCR-REC-001

- **Database contract:** DB-CRM-001

- **Request contract:** Query: page, pageSize, q(min 2), status, homeBranchId, sort

- **Success:** 200 Page<ClientSummaryResource>

- **Errors:** `SEARCH_QUERY_TOO_SHORT, ACCESS_ORGANIZATION_FORBIDDEN, RATE_LIMITED`

- **Idempotency:** No

- **Additional requirements:** Search name, client number, normalized phone/email.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-CLIENT-002 — `POST /api/v1/organizations/{organizationId}/clients/duplicate-check`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `CLIENT-01`

- **Frontend/UI consumers:** OVL-CLIENT-001, OVL-CLIENT-003

- **Database contract:** DB-CRM-001

- **Request contract:** Body: ClientDuplicateCheckRequest

- **Success:** 200 DuplicateCheckResponse

- **Errors:** `REQUEST_VALIDATION_FAILED, RATE_LIMITED`

- **Idempotency:** No

- **Additional requirements:** Advisory; create performs the same check.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-CLIENT-003 — `POST /api/v1/organizations/{organizationId}/clients`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `CLIENT-01`

- **Frontend/UI consumers:** OVL-CLIENT-001, OVL-CLIENT-003

- **Database contract:** DB-CRM-001, DB-AUD-001

- **Request contract:** Body: CreateClientRequest; optional duplicateOverrideToken

- **Success:** 201 ClientResource

- **Errors:** `CLIENT_POTENTIAL_DUPLICATE, CLIENT_NUMBER_EXISTS, DUPLICATE_OVERRIDE_INVALID, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-CLIENT-004 — `GET /api/v1/clients/{clientId}`


- **Authorization:** Assigned staff, own GYM_ADMIN, SUPER_ADMIN

- **Stories:** `CLIENT-03`

- **Frontend/UI consumers:** SCR-CLIENT-002, SCR-REC-001

- **Database contract:** DB-CRM-001, DB-MEM-003, DB-OPS-002

- **Request contract:** Path UUID; optional include=membershipSummary,activeVisit

- **Success:** 200 ClientDetailsResource

- **Errors:** `CLIENT_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-CLIENT-005 — `PATCH /api/v1/clients/{clientId}`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `CLIENT-04`

- **Frontend/UI consumers:** OVL-CLIENT-002

- **Database contract:** DB-CRM-001, DB-AUD-001

- **Request contract:** If-Match; Body: UpdateClientRequest

- **Success:** 200 ClientResource

- **Errors:** `CLIENT_NOT_FOUND, CLIENT_NUMBER_EXISTS, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-CLIENT-006 — `POST /api/v1/clients/{clientId}/block`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `CLIENT-05`

- **Frontend/UI consumers:** OVL-CLIENT-004

- **Database contract:** DB-CRM-001, DB-AUD-001

- **Request contract:** Body: BlockClientRequest

- **Success:** 200 ClientResource

- **Errors:** `CLIENT_NOT_FOUND, CLIENT_ALREADY_BLOCKED, CLIENT_HAS_ACTIVE_VISIT, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-CLIENT-007 — `POST /api/v1/clients/{clientId}/unblock`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `CLIENT-05`

- **Frontend/UI consumers:** OVL-CLIENT-005

- **Database contract:** DB-CRM-001, DB-AUD-001

- **Request contract:** Body: ReasonRequest optional

- **Success:** 200 ClientResource

- **Errors:** `CLIENT_NOT_FOUND, CLIENT_NOT_BLOCKED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-CLIENT-008 — `GET /api/v1/clients/{clientId}/incidents`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `CLIENT-03, INCIDENT-01, INCIDENT-02`

- **Frontend/UI consumers:** SCR-CLIENT-002

- **Database contract:** DB-OPS-004

- **Request contract:** Query: page, pageSize, status, sort

- **Success:** 200 Page<IncidentSummaryResource>

- **Errors:** `CLIENT_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.7. Membership plans


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-PLAN-001` | `GET` `/api/v1/organizations/{organizationId}/membership-plans` | Assigned staff read; own GYM_ADMIN write scope | Query: page, pageSize, q, status, planType, branchId, sort | 200 Page<MembershipPlanResource> | ACCESS_ORGANIZATION_FORBIDDEN | No | PLAN-01, MEMBERSHIP-01 |
| `API-PLAN-002` | `POST` `/api/v1/organizations/{organizationId}/membership-plans` | Own GYM_ADMIN | Body: CreateMembershipPlanRequest | 201 MembershipPlanResource | MEMBERSHIP_PLAN_CODE_EXISTS, BRANCH_NOT_FOUND, REQUEST_VALIDATION_FAILED | No | PLAN-01 |
| `API-PLAN-003` | `GET` `/api/v1/membership-plans/{membershipPlanId}` | Assigned staff, own GYM_ADMIN, SUPER_ADMIN | Path UUID | 200 MembershipPlanResource | MEMBERSHIP_PLAN_NOT_FOUND | No | PLAN-01 |
| `API-PLAN-004` | `PATCH` `/api/v1/membership-plans/{membershipPlanId}` | Own GYM_ADMIN | If-Match; Body: UpdateMembershipPlanRequest | 200 MembershipPlanResource | MEMBERSHIP_PLAN_NOT_FOUND, RESOURCE_VERSION_STALE, MEMBERSHIP_PLAN_IMMUTABLE_FIELD, REQUEST_VALIDATION_FAILED | No | PLAN-01 |
| `API-PLAN-005` | `POST` `/api/v1/membership-plans/{membershipPlanId}/deactivate` | Own GYM_ADMIN | Body: ReasonRequest optional | 200 MembershipPlanResource | MEMBERSHIP_PLAN_NOT_FOUND, MEMBERSHIP_PLAN_ALREADY_INACTIVE | No | PLAN-01 |



#### API-PLAN-001 — `GET /api/v1/organizations/{organizationId}/membership-plans`


- **Authorization:** Assigned staff read; own GYM_ADMIN write scope

- **Stories:** `PLAN-01, MEMBERSHIP-01`

- **Frontend/UI consumers:** SCR-PLAN-001, OVL-MEM-001

- **Database contract:** DB-MEM-001, DB-MEM-002

- **Request contract:** Query: page, pageSize, q, status, planType, branchId, sort

- **Success:** 200 Page<MembershipPlanResource>

- **Errors:** `ACCESS_ORGANIZATION_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PLAN-002 — `POST /api/v1/organizations/{organizationId}/membership-plans`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `PLAN-01`

- **Frontend/UI consumers:** OVL-PLAN-001

- **Database contract:** DB-MEM-001, DB-MEM-002, DB-AUD-001

- **Request contract:** Body: CreateMembershipPlanRequest

- **Success:** 201 MembershipPlanResource

- **Errors:** `MEMBERSHIP_PLAN_CODE_EXISTS, BRANCH_NOT_FOUND, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PLAN-003 — `GET /api/v1/membership-plans/{membershipPlanId}`


- **Authorization:** Assigned staff, own GYM_ADMIN, SUPER_ADMIN

- **Stories:** `PLAN-01`

- **Frontend/UI consumers:** SCR-PLAN-001

- **Database contract:** DB-MEM-001, DB-MEM-002

- **Request contract:** Path UUID

- **Success:** 200 MembershipPlanResource

- **Errors:** `MEMBERSHIP_PLAN_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PLAN-004 — `PATCH /api/v1/membership-plans/{membershipPlanId}`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `PLAN-01`

- **Frontend/UI consumers:** OVL-PLAN-002

- **Database contract:** DB-MEM-001, DB-MEM-002, DB-AUD-001

- **Request contract:** If-Match; Body: UpdateMembershipPlanRequest

- **Success:** 200 MembershipPlanResource

- **Errors:** `MEMBERSHIP_PLAN_NOT_FOUND, RESOURCE_VERSION_STALE, MEMBERSHIP_PLAN_IMMUTABLE_FIELD, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PLAN-005 — `POST /api/v1/membership-plans/{membershipPlanId}/deactivate`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `PLAN-01`

- **Frontend/UI consumers:** OVL-PLAN-002

- **Database contract:** DB-MEM-001, DB-AUD-001

- **Request contract:** Body: ReasonRequest optional

- **Success:** 200 MembershipPlanResource

- **Errors:** `MEMBERSHIP_PLAN_NOT_FOUND, MEMBERSHIP_PLAN_ALREADY_INACTIVE`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.8. Memberships


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-MEM-001` | `GET` `/api/v1/clients/{clientId}/memberships` | Assigned staff or own GYM_ADMIN | Query: page, pageSize, status, sort | 200 Page<MembershipResource> | CLIENT_NOT_FOUND | No | CLIENT-03, MEMBERSHIP-01, MEMBERSHIP-03 |
| `API-MEM-002` | `POST` `/api/v1/clients/{clientId}/memberships` | Own GYM_ADMIN | Idempotency-Key recommended; Body: AssignMembershipRequest | 201 MembershipResource | CLIENT_NOT_FOUND, CLIENT_BLOCKED, MEMBERSHIP_PLAN_NOT_FOUND, MEMBERSHIP_PLAN_INACTIVE, MEMBERSHIP_OVERLAP_CONFLICT, REQUEST_VALIDATION_FAILED | Recommended | MEMBERSHIP-01 |
| `API-MEM-003` | `GET` `/api/v1/memberships/{membershipId}` | Assigned staff or own GYM_ADMIN | Path UUID | 200 MembershipDetailsResource | MEMBERSHIP_NOT_FOUND | No | MEMBERSHIP-01, MEMBERSHIP-03 |
| `API-MEM-004` | `GET` `/api/v1/clients/{clientId}/membership-eligibility` | Assigned staff or own GYM_ADMIN | Query required: branchId; optional at | 200 MembershipEligibilityResponse | CLIENT_NOT_FOUND, BRANCH_NOT_FOUND | No | MEMBERSHIP-02, VISIT-01 |
| `API-MEM-005` | `POST` `/api/v1/memberships/{membershipId}/freeze` | Own GYM_ADMIN | Body: FreezeMembershipRequest | 201 MembershipFreezeResource and updated MembershipResource | MEMBERSHIP_NOT_FOUND, MEMBERSHIP_FREEZE_NOT_ALLOWED, MEMBERSHIP_FREEZE_OVERLAP, MEMBERSHIP_NOT_ACTIVE, REQUEST_VALIDATION_FAILED | No | MEMBERSHIP-03 |
| `API-MEM-006` | `POST` `/api/v1/membership-freeze-periods/{freezePeriodId}/end` | Own GYM_ADMIN | Body: EndFreezeRequest | 200 MembershipFreezeResource and updated MembershipResource | FREEZE_PERIOD_NOT_FOUND, FREEZE_PERIOD_NOT_ACTIVE, REQUEST_VALIDATION_FAILED | No | MEMBERSHIP-03 |
| `API-MEM-007` | `POST` `/api/v1/memberships/{membershipId}/cancel` | Own GYM_ADMIN | Body: CancelMembershipRequest | 200 MembershipResource | MEMBERSHIP_NOT_FOUND, MEMBERSHIP_ALREADY_CANCELLED, MEMBERSHIP_HAS_ACTIVE_VISIT, REQUEST_VALIDATION_FAILED | No | MEMBERSHIP-01, MEMBERSHIP-03 |



#### API-MEM-001 — `GET /api/v1/clients/{clientId}/memberships`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `CLIENT-03, MEMBERSHIP-01, MEMBERSHIP-03`

- **Frontend/UI consumers:** SCR-CLIENT-002

- **Database contract:** DB-MEM-003, DB-MEM-004, DB-MEM-005

- **Request contract:** Query: page, pageSize, status, sort

- **Success:** 200 Page<MembershipResource>

- **Errors:** `CLIENT_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-MEM-002 — `POST /api/v1/clients/{clientId}/memberships`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `MEMBERSHIP-01`

- **Frontend/UI consumers:** OVL-MEM-001

- **Database contract:** DB-MEM-001, DB-MEM-002, DB-MEM-003, DB-AUD-001

- **Request contract:** Idempotency-Key recommended; Body: AssignMembershipRequest

- **Success:** 201 MembershipResource

- **Errors:** `CLIENT_NOT_FOUND, CLIENT_BLOCKED, MEMBERSHIP_PLAN_NOT_FOUND, MEMBERSHIP_PLAN_INACTIVE, MEMBERSHIP_OVERLAP_CONFLICT, REQUEST_VALIDATION_FAILED`

- **Idempotency:** Recommended

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-MEM-003 — `GET /api/v1/memberships/{membershipId}`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `MEMBERSHIP-01, MEMBERSHIP-03`

- **Frontend/UI consumers:** SCR-CLIENT-002

- **Database contract:** DB-MEM-003, DB-MEM-004, DB-MEM-005

- **Request contract:** Path UUID

- **Success:** 200 MembershipDetailsResource

- **Errors:** `MEMBERSHIP_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-MEM-004 — `GET /api/v1/clients/{clientId}/membership-eligibility`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `MEMBERSHIP-02, VISIT-01`

- **Frontend/UI consumers:** SCR-REC-001, OVL-VISIT-001

- **Database contract:** DB-CRM-001, DB-MEM-002, DB-MEM-003, DB-MEM-004, DB-MEM-005

- **Request contract:** Query required: branchId; optional at

- **Success:** 200 MembershipEligibilityResponse

- **Errors:** `CLIENT_NOT_FOUND, BRANCH_NOT_FOUND`

- **Idempotency:** No

- **Additional requirements:** Returns eligible=false with stable reason codes rather than 4xx for ordinary business ineligibility.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-MEM-005 — `POST /api/v1/memberships/{membershipId}/freeze`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `MEMBERSHIP-03`

- **Frontend/UI consumers:** OVL-MEM-002

- **Database contract:** DB-MEM-003, DB-MEM-004, DB-AUD-001

- **Request contract:** Body: FreezeMembershipRequest

- **Success:** 201 MembershipFreezeResource and updated MembershipResource

- **Errors:** `MEMBERSHIP_NOT_FOUND, MEMBERSHIP_FREEZE_NOT_ALLOWED, MEMBERSHIP_FREEZE_OVERLAP, MEMBERSHIP_NOT_ACTIVE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-MEM-006 — `POST /api/v1/membership-freeze-periods/{freezePeriodId}/end`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `MEMBERSHIP-03`

- **Frontend/UI consumers:** SCR-CLIENT-002

- **Database contract:** DB-MEM-003, DB-MEM-004, DB-AUD-001

- **Request contract:** Body: EndFreezeRequest

- **Success:** 200 MembershipFreezeResource and updated MembershipResource

- **Errors:** `FREEZE_PERIOD_NOT_FOUND, FREEZE_PERIOD_NOT_ACTIVE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-MEM-007 — `POST /api/v1/memberships/{membershipId}/cancel`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `MEMBERSHIP-01, MEMBERSHIP-03`

- **Frontend/UI consumers:** OVL-MEM-003

- **Database contract:** DB-MEM-003, DB-AUD-001

- **Request contract:** Body: CancelMembershipRequest

- **Success:** 200 MembershipResource

- **Errors:** `MEMBERSHIP_NOT_FOUND, MEMBERSHIP_ALREADY_CANCELLED, MEMBERSHIP_HAS_ACTIVE_VISIT, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.9. Locker keys


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-KEY-001` | `GET` `/api/v1/branches/{branchId}/locker-keys` | Assigned staff, own GYM_ADMIN, SUPER_ADMIN | Query: page, pageSize, q, status, sort | 200 Page<LockerKeyResource> | BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN | No | KEY-02, VISIT-01 |
| `API-KEY-002` | `POST` `/api/v1/branches/{branchId}/locker-keys` | Own GYM_ADMIN | Body: CreateLockerKeyRequest | 201 LockerKeyResource | LOCKER_KEY_NUMBER_EXISTS, BRANCH_INACTIVE, REQUEST_VALIDATION_FAILED | No | KEY-01 |
| `API-KEY-003` | `GET` `/api/v1/locker-keys/{lockerKeyId}` | Assigned staff or own GYM_ADMIN | Path UUID; optional include=activeVisit | 200 LockerKeyDetailsResource | LOCKER_KEY_NOT_FOUND | No | KEY-02, KEY-03 |
| `API-KEY-004` | `PATCH` `/api/v1/locker-keys/{lockerKeyId}` | Own GYM_ADMIN | If-Match; Body: UpdateLockerKeyRequest | 200 LockerKeyResource | LOCKER_KEY_NOT_FOUND, LOCKER_KEY_NUMBER_EXISTS, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED | No | KEY-01, KEY-03 |
| `API-KEY-005` | `POST` `/api/v1/locker-keys/{lockerKeyId}/status-transitions` | Own GYM_ADMIN; EMPLOYEE only incident-driven allowed transitions | Idempotency-Key recommended; Body: LockerKeyStatusTransitionRequest | 200 LockerKeyResource | LOCKER_KEY_NOT_FOUND, LOCKER_KEY_INVALID_TRANSITION, LOCKER_KEY_ACTIVE_ASSIGNMENT, REASON_REQUIRED | Recommended | KEY-03, INCIDENT-01, INCIDENT-02 |



#### API-KEY-001 — `GET /api/v1/branches/{branchId}/locker-keys`


- **Authorization:** Assigned staff, own GYM_ADMIN, SUPER_ADMIN

- **Stories:** `KEY-02, VISIT-01`

- **Frontend/UI consumers:** SCR-KEY-001, OVL-VISIT-001

- **Database contract:** DB-OPS-001, DB-OPS-002

- **Request contract:** Query: page, pageSize, q, status, sort

- **Success:** 200 Page<LockerKeyResource>

- **Errors:** `BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN`

- **Idempotency:** No

- **Additional requirements:** status=AVAILABLE used by check-in key picker.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-KEY-002 — `POST /api/v1/branches/{branchId}/locker-keys`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `KEY-01`

- **Frontend/UI consumers:** OVL-KEY-001

- **Database contract:** DB-OPS-001, DB-AUD-001

- **Request contract:** Body: CreateLockerKeyRequest

- **Success:** 201 LockerKeyResource

- **Errors:** `LOCKER_KEY_NUMBER_EXISTS, BRANCH_INACTIVE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-KEY-003 — `GET /api/v1/locker-keys/{lockerKeyId}`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `KEY-02, KEY-03`

- **Frontend/UI consumers:** DRW-KEY-001

- **Database contract:** DB-OPS-001, DB-OPS-002

- **Request contract:** Path UUID; optional include=activeVisit

- **Success:** 200 LockerKeyDetailsResource

- **Errors:** `LOCKER_KEY_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-KEY-004 — `PATCH /api/v1/locker-keys/{lockerKeyId}`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `KEY-01, KEY-03`

- **Frontend/UI consumers:** OVL-KEY-002

- **Database contract:** DB-OPS-001, DB-AUD-001

- **Request contract:** If-Match; Body: UpdateLockerKeyRequest

- **Success:** 200 LockerKeyResource

- **Errors:** `LOCKER_KEY_NOT_FOUND, LOCKER_KEY_NUMBER_EXISTS, RESOURCE_VERSION_STALE, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-KEY-005 — `POST /api/v1/locker-keys/{lockerKeyId}/status-transitions`


- **Authorization:** Own GYM_ADMIN; EMPLOYEE only incident-driven allowed transitions

- **Stories:** `KEY-03, INCIDENT-01, INCIDENT-02`

- **Frontend/UI consumers:** OVL-KEY-003, OVL-INC-001

- **Database contract:** DB-OPS-001, DB-OPS-004, DB-AUD-001

- **Request contract:** Idempotency-Key recommended; Body: LockerKeyStatusTransitionRequest

- **Success:** 200 LockerKeyResource

- **Errors:** `LOCKER_KEY_NOT_FOUND, LOCKER_KEY_INVALID_TRANSITION, LOCKER_KEY_ACTIVE_ASSIGNMENT, REASON_REQUIRED`

- **Idempotency:** Recommended

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.10. Visits


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-VISIT-001` | `GET` `/api/v1/branches/{branchId}/visits` | Assigned staff, own GYM_ADMIN, SUPER_ADMIN | Query: page, pageSize, status, clientId, lockerKeyId, startedFrom, startedTo, longRunningOnly, sort | 200 Page<VisitSummaryResource> | BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN, REQUEST_VALIDATION_FAILED | No | VISIT-05, VISIT-10 |
| `API-VISIT-002` | `POST` `/api/v1/branches/{branchId}/visits/check-in` | Assigned EMPLOYEE or GYM_ADMIN | Idempotency-Key required; Body: CheckInRequest | 201 VisitResource plus key/membership summaries | IDEMPOTENCY_KEY_REQUIRED, IDEMPOTENCY_KEY_REUSED, CLIENT_NOT_FOUND, CLIENT_BLOCKED, MEMBERSHIP_NOT_ELIGIBLE, CLIENT_ALREADY_CHECKED_IN, LOCKER_KEY_NOT_AVAILABLE, ACCESS_BRANCH_FORBIDDEN, REQUEST_VALIDATION_FAILED | Required | MEMBERSHIP-02, MEMBERSHIP-04, VISIT-01, VISIT-02, VISIT-03, VISIT-04 |
| `API-VISIT-003` | `POST` `/api/v1/branches/{branchId}/visits/checkout-by-key` | Assigned EMPLOYEE or GYM_ADMIN | Idempotency-Key required; Body: CheckoutByKeyRequest | 200 VisitResource | IDEMPOTENCY_KEY_REQUIRED, IDEMPOTENCY_KEY_REUSED, LOCKER_KEY_NOT_FOUND, LOCKER_KEY_NOT_ISSUED, ACTIVE_VISIT_NOT_FOUND, VISIT_ALREADY_CLOSED, ACCESS_BRANCH_FORBIDDEN | Required | VISIT-06, VISIT-07 |
| `API-VISIT-004` | `GET` `/api/v1/visits/{visitId}` | Assigned staff or own GYM_ADMIN | Path UUID | 200 VisitDetailsResource | VISIT_NOT_FOUND | No | VISIT-05, VISIT-08, VISIT-09 |
| `API-VISIT-005` | `POST` `/api/v1/visits/{visitId}/checkout` | Assigned EMPLOYEE or GYM_ADMIN | Idempotency-Key required; Body: CheckoutVisitRequest | 200 VisitResource | VISIT_NOT_FOUND, VISIT_ALREADY_CLOSED, LOCKER_KEY_NOT_ISSUED, IDEMPOTENCY_KEY_REUSED | Required | VISIT-06, VISIT-07 |
| `API-VISIT-006` | `GET` `/api/v1/clients/{clientId}/visits` | Assigned staff, own GYM_ADMIN, client self in portal variant | Query: page, pageSize, status, from, to, branchId, sort | 200 Page<VisitHistoryResource> | CLIENT_NOT_FOUND | No | VISIT-08, PORTAL-02 |
| `API-VISIT-007` | `POST` `/api/v1/visits/{visitId}/corrections` | Own GYM_ADMIN | Idempotency-Key required; If-Match; Body: CreateVisitCorrectionRequest | 201 VisitCorrectionResource plus updated VisitResource | VISIT_NOT_FOUND, VISIT_CORRECTION_INVALID, RESOURCE_VERSION_STALE, REASON_REQUIRED, IDEMPOTENCY_KEY_REUSED | Required | VISIT-09 |
| `API-VISIT-008` | `GET` `/api/v1/branches/{branchId}/visits/long-running` | Assigned staff or own GYM_ADMIN | Query: thresholdMinutes optional | 200 Page<VisitSummaryResource> | BRANCH_NOT_FOUND, REQUEST_VALIDATION_FAILED | No | VISIT-10 |
| `API-VISIT-009` | `POST` `/api/v1/visits/{visitId}/auto-close` | SYSTEM job or own GYM_ADMIN | Idempotency-Key required; Body: AutoCloseVisitRequest | 200 VisitResource | VISIT_NOT_FOUND, VISIT_NOT_ACTIVE, AUTO_CLOSE_THRESHOLD_NOT_REACHED, IDEMPOTENCY_KEY_REUSED | Required | VISIT-10 |



#### API-VISIT-001 — `GET /api/v1/branches/{branchId}/visits`


- **Authorization:** Assigned staff, own GYM_ADMIN, SUPER_ADMIN

- **Stories:** `VISIT-05, VISIT-10`

- **Frontend/UI consumers:** SCR-VISIT-001, SCR-REC-001

- **Database contract:** DB-OPS-002

- **Request contract:** Query: page, pageSize, status, clientId, lockerKeyId, startedFrom, startedTo, longRunningOnly, sort

- **Success:** 200 Page<VisitSummaryResource>

- **Errors:** `BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-002 — `POST /api/v1/branches/{branchId}/visits/check-in`


- **Authorization:** Assigned EMPLOYEE or GYM_ADMIN

- **Stories:** `MEMBERSHIP-02, MEMBERSHIP-04, VISIT-01, VISIT-02, VISIT-03, VISIT-04`

- **Frontend/UI consumers:** OVL-VISIT-001, OVL-VISIT-002

- **Database contract:** DB-CRM-001, DB-MEM-002, DB-MEM-003, DB-MEM-004, DB-MEM-005, DB-OPS-001, DB-OPS-002, DB-COM-001, DB-AUD-001

- **Request contract:** Idempotency-Key required; Body: CheckInRequest

- **Success:** 201 VisitResource plus key/membership summaries

- **Errors:** `IDEMPOTENCY_KEY_REQUIRED, IDEMPOTENCY_KEY_REUSED, CLIENT_NOT_FOUND, CLIENT_BLOCKED, MEMBERSHIP_NOT_ELIGIBLE, CLIENT_ALREADY_CHECKED_IN, LOCKER_KEY_NOT_AVAILABLE, ACCESS_BRANCH_FORBIDDEN, REQUEST_VALIDATION_FAILED`

- **Idempotency:** Required

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-003 — `POST /api/v1/branches/{branchId}/visits/checkout-by-key`


- **Authorization:** Assigned EMPLOYEE or GYM_ADMIN

- **Stories:** `VISIT-06, VISIT-07`

- **Frontend/UI consumers:** OVL-VISIT-003

- **Database contract:** DB-OPS-001, DB-OPS-002, DB-COM-001, DB-AUD-001

- **Request contract:** Idempotency-Key required; Body: CheckoutByKeyRequest

- **Success:** 200 VisitResource

- **Errors:** `IDEMPOTENCY_KEY_REQUIRED, IDEMPOTENCY_KEY_REUSED, LOCKER_KEY_NOT_FOUND, LOCKER_KEY_NOT_ISSUED, ACTIVE_VISIT_NOT_FOUND, VISIT_ALREADY_CLOSED, ACCESS_BRANCH_FORBIDDEN`

- **Idempotency:** Required

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-004 — `GET /api/v1/visits/{visitId}`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `VISIT-05, VISIT-08, VISIT-09`

- **Frontend/UI consumers:** DRW-VISIT-001

- **Database contract:** DB-OPS-002, DB-OPS-003, DB-OPS-004

- **Request contract:** Path UUID

- **Success:** 200 VisitDetailsResource

- **Errors:** `VISIT_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-005 — `POST /api/v1/visits/{visitId}/checkout`


- **Authorization:** Assigned EMPLOYEE or GYM_ADMIN

- **Stories:** `VISIT-06, VISIT-07`

- **Frontend/UI consumers:** SCR-VISIT-001, DRW-VISIT-001

- **Database contract:** DB-OPS-001, DB-OPS-002, DB-COM-001, DB-AUD-001

- **Request contract:** Idempotency-Key required; Body: CheckoutVisitRequest

- **Success:** 200 VisitResource

- **Errors:** `VISIT_NOT_FOUND, VISIT_ALREADY_CLOSED, LOCKER_KEY_NOT_ISSUED, IDEMPOTENCY_KEY_REUSED`

- **Idempotency:** Required

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-006 — `GET /api/v1/clients/{clientId}/visits`


- **Authorization:** Assigned staff, own GYM_ADMIN, client self in portal variant

- **Stories:** `VISIT-08, PORTAL-02`

- **Frontend/UI consumers:** SCR-CLIENT-002, SCR-PORTAL-003

- **Database contract:** DB-OPS-002

- **Request contract:** Query: page, pageSize, status, from, to, branchId, sort

- **Success:** 200 Page<VisitHistoryResource>

- **Errors:** `CLIENT_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-007 — `POST /api/v1/visits/{visitId}/corrections`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `VISIT-09`

- **Frontend/UI consumers:** OVL-VISIT-004

- **Database contract:** DB-OPS-002, DB-OPS-003, DB-MEM-005, DB-COM-001, DB-AUD-001

- **Request contract:** Idempotency-Key required; If-Match; Body: CreateVisitCorrectionRequest

- **Success:** 201 VisitCorrectionResource plus updated VisitResource

- **Errors:** `VISIT_NOT_FOUND, VISIT_CORRECTION_INVALID, RESOURCE_VERSION_STALE, REASON_REQUIRED, IDEMPOTENCY_KEY_REUSED`

- **Idempotency:** Required

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-008 — `GET /api/v1/branches/{branchId}/visits/long-running`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `VISIT-10`

- **Frontend/UI consumers:** SCR-VISIT-001

- **Database contract:** DB-ORG-002, DB-OPS-002

- **Request contract:** Query: thresholdMinutes optional

- **Success:** 200 Page<VisitSummaryResource>

- **Errors:** `BRANCH_NOT_FOUND, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-VISIT-009 — `POST /api/v1/visits/{visitId}/auto-close`


- **Authorization:** SYSTEM job or own GYM_ADMIN

- **Stories:** `VISIT-10`

- **Frontend/UI consumers:** SCR-VISIT-001

- **Database contract:** DB-OPS-001, DB-OPS-002, DB-COM-001, DB-AUD-001

- **Request contract:** Idempotency-Key required; Body: AutoCloseVisitRequest

- **Success:** 200 VisitResource

- **Errors:** `VISIT_NOT_FOUND, VISIT_NOT_ACTIVE, AUTO_CLOSE_THRESHOLD_NOT_REACHED, IDEMPOTENCY_KEY_REUSED`

- **Idempotency:** Required

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.11. Incidents


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-INC-001` | `GET` `/api/v1/branches/{branchId}/incidents` | Assigned staff or own GYM_ADMIN | Query: page, pageSize, q, type, severity, status, assigneeId, from, to, sort | 200 Page<IncidentSummaryResource> | BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN | No | INCIDENT-01, INCIDENT-02, INCIDENT-03 |
| `API-INC-002` | `POST` `/api/v1/branches/{branchId}/incidents` | Assigned EMPLOYEE or GYM_ADMIN | Idempotency-Key recommended; Body: CreateIncidentRequest | 201 IncidentResource; may atomically transition key/visit state | INCIDENT_RELATION_INVALID, LOCKER_KEY_NOT_FOUND, VISIT_NOT_FOUND, LOCKER_KEY_INVALID_TRANSITION, REQUEST_VALIDATION_FAILED | Recommended | INCIDENT-01, INCIDENT-02 |
| `API-INC-003` | `GET` `/api/v1/incidents/{incidentId}` | Assigned staff or own GYM_ADMIN | Path UUID | 200 IncidentDetailsResource | INCIDENT_NOT_FOUND | No | INCIDENT-01, INCIDENT-02, INCIDENT-03 |
| `API-INC-004` | `PATCH` `/api/v1/incidents/{incidentId}` | Own GYM_ADMIN | If-Match; Body: UpdateIncidentRequest | 200 IncidentResource | INCIDENT_NOT_FOUND, RESOURCE_VERSION_STALE, INCIDENT_ALREADY_RESOLVED | No | INCIDENT-03 |
| `API-INC-005` | `POST` `/api/v1/incidents/{incidentId}/resolve` | Own GYM_ADMIN | If-Match; Body: ResolveIncidentRequest | 200 IncidentResource | INCIDENT_NOT_FOUND, INCIDENT_ALREADY_RESOLVED, RESOLUTION_REQUIRED, RESOURCE_VERSION_STALE | No | INCIDENT-03 |
| `API-INC-006` | `POST` `/api/v1/incidents/{incidentId}/cancel` | Own GYM_ADMIN | If-Match; Body: CancelIncidentRequest | 200 IncidentResource | INCIDENT_NOT_FOUND, INCIDENT_ALREADY_RESOLVED, REASON_REQUIRED, RESOURCE_VERSION_STALE | No | INCIDENT-03 |



#### API-INC-001 — `GET /api/v1/branches/{branchId}/incidents`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `INCIDENT-01, INCIDENT-02, INCIDENT-03`

- **Frontend/UI consumers:** SCR-INCIDENT-001

- **Database contract:** DB-OPS-004

- **Request contract:** Query: page, pageSize, q, type, severity, status, assigneeId, from, to, sort

- **Success:** 200 Page<IncidentSummaryResource>

- **Errors:** `BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-INC-002 — `POST /api/v1/branches/{branchId}/incidents`


- **Authorization:** Assigned EMPLOYEE or GYM_ADMIN

- **Stories:** `INCIDENT-01, INCIDENT-02`

- **Frontend/UI consumers:** OVL-INC-001

- **Database contract:** DB-OPS-001, DB-OPS-002, DB-OPS-004, DB-AUD-001

- **Request contract:** Idempotency-Key recommended; Body: CreateIncidentRequest

- **Success:** 201 IncidentResource; may atomically transition key/visit state

- **Errors:** `INCIDENT_RELATION_INVALID, LOCKER_KEY_NOT_FOUND, VISIT_NOT_FOUND, LOCKER_KEY_INVALID_TRANSITION, REQUEST_VALIDATION_FAILED`

- **Idempotency:** Recommended

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-INC-003 — `GET /api/v1/incidents/{incidentId}`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `INCIDENT-01, INCIDENT-02, INCIDENT-03`

- **Frontend/UI consumers:** DRW-INC-001

- **Database contract:** DB-OPS-004

- **Request contract:** Path UUID

- **Success:** 200 IncidentDetailsResource

- **Errors:** `INCIDENT_NOT_FOUND`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-INC-004 — `PATCH /api/v1/incidents/{incidentId}`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `INCIDENT-03`

- **Frontend/UI consumers:** DRW-INC-001

- **Database contract:** DB-OPS-004, DB-AUD-001

- **Request contract:** If-Match; Body: UpdateIncidentRequest

- **Success:** 200 IncidentResource

- **Errors:** `INCIDENT_NOT_FOUND, RESOURCE_VERSION_STALE, INCIDENT_ALREADY_RESOLVED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-INC-005 — `POST /api/v1/incidents/{incidentId}/resolve`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `INCIDENT-03`

- **Frontend/UI consumers:** OVL-INC-002

- **Database contract:** DB-OPS-004, DB-AUD-001

- **Request contract:** If-Match; Body: ResolveIncidentRequest

- **Success:** 200 IncidentResource

- **Errors:** `INCIDENT_NOT_FOUND, INCIDENT_ALREADY_RESOLVED, RESOLUTION_REQUIRED, RESOURCE_VERSION_STALE`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-INC-006 — `POST /api/v1/incidents/{incidentId}/cancel`


- **Authorization:** Own GYM_ADMIN

- **Stories:** `INCIDENT-03`

- **Frontend/UI consumers:** DRW-INC-001

- **Database contract:** DB-OPS-004, DB-AUD-001

- **Request contract:** If-Match; Body: CancelIncidentRequest

- **Success:** 200 IncidentResource

- **Errors:** `INCIDENT_NOT_FOUND, INCIDENT_ALREADY_RESOLVED, REASON_REQUIRED, RESOURCE_VERSION_STALE`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.12. Audit


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-AUDIT-001` | `GET` `/api/v1/organizations/{organizationId}/audit-events` | Own GYM_ADMIN or SUPER_ADMIN | Query: page, pageSize, branchId, actorId, action, entityType, entityId, from, to, correlationId, sort | 200 Page<AuditEventSummaryResource> | ACCESS_ROLE_FORBIDDEN, REQUEST_VALIDATION_FAILED | No | AUDIT-02, NFR-04 |
| `API-AUDIT-002` | `GET` `/api/v1/audit-events/{auditEventId}` | Own GYM_ADMIN or SUPER_ADMIN | Path UUID | 200 AuditEventDetailsResource | AUDIT_EVENT_NOT_FOUND | No | AUDIT-02, NFR-04 |



#### API-AUDIT-001 — `GET /api/v1/organizations/{organizationId}/audit-events`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `AUDIT-02, NFR-04`

- **Frontend/UI consumers:** SCR-AUDIT-001

- **Database contract:** DB-AUD-001

- **Request contract:** Query: page, pageSize, branchId, actorId, action, entityType, entityId, from, to, correlationId, sort

- **Success:** 200 Page<AuditEventSummaryResource>

- **Errors:** `ACCESS_ROLE_FORBIDDEN, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-AUDIT-002 — `GET /api/v1/audit-events/{auditEventId}`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `AUDIT-02, NFR-04`

- **Frontend/UI consumers:** DRW-AUDIT-001

- **Database contract:** DB-AUD-001

- **Request contract:** Path UUID

- **Success:** 200 AuditEventDetailsResource

- **Errors:** `AUDIT_EVENT_NOT_FOUND`

- **Idempotency:** No

- **Additional requirements:** Sensitive fields must remain redacted.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.13. Dashboards and reports


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-REPORT-001` | `GET` `/api/v1/organizations/{organizationId}/dashboard` | Own GYM_ADMIN or SUPER_ADMIN | Query: branchId optional, businessDate optional | 200 GymDashboardResource | ACCESS_ORGANIZATION_FORBIDDEN, REPORT_QUERY_INVALID | No | REPORT-01, REPORT-02, REPORT-03, NFR-01 |
| `API-REPORT-002` | `GET` `/api/v1/branches/{branchId}/dashboard/reception` | Assigned staff or own GYM_ADMIN | No body; optional businessDate | 200 ReceptionDashboardResource | BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN | No | VISIT-05, KEY-02, NFR-01 |
| `API-REPORT-003` | `GET` `/api/v1/organizations/{organizationId}/reports/daily-visits` | Own GYM_ADMIN or SUPER_ADMIN | Query required: from,to; optional branchId, groupBy; page/pageSize for detail rows | 200 DailyVisitsReportResponse | REPORT_DATE_RANGE_INVALID, REPORT_RANGE_TOO_LARGE, ACCESS_ORGANIZATION_FORBIDDEN | No | REPORT-01 |
| `API-REPORT-004` | `GET` `/api/v1/organizations/{organizationId}/reports/key-status` | Own GYM_ADMIN or SUPER_ADMIN | Query: branchId optional, asOf optional | 200 KeyStatusReportResponse | REPORT_QUERY_INVALID, ACCESS_ORGANIZATION_FORBIDDEN | No | REPORT-02 |
| `API-REPORT-005` | `GET` `/api/v1/organizations/{organizationId}/reports/employee-activity` | Own GYM_ADMIN or SUPER_ADMIN | Query required: from,to; optional branchId, staffUserId; page/pageSize | 200 EmployeeActivityReportResponse | REPORT_DATE_RANGE_INVALID, REPORT_RANGE_TOO_LARGE, ACCESS_ORGANIZATION_FORBIDDEN | No | REPORT-03 |
| `API-REPORT-006` | `GET` `/api/v1/organizations/{organizationId}/reports/sync-status` | Own GYM_ADMIN or SUPER_ADMIN; post-MVP | No body | 200 ReportingSyncStatusResponse | REPORTING_SERVICE_UNAVAILABLE | No | EVENT-02, NFR-02, NFR-06 |



#### API-REPORT-001 — `GET /api/v1/organizations/{organizationId}/dashboard`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `REPORT-01, REPORT-02, REPORT-03, NFR-01`

- **Frontend/UI consumers:** SCR-GYM-001

- **Database contract:** DB-OPS-001, DB-OPS-002, DB-OPS-004; post-MVP DB-RPT-*

- **Request contract:** Query: branchId optional, businessDate optional

- **Success:** 200 GymDashboardResource

- **Errors:** `ACCESS_ORGANIZATION_FORBIDDEN, REPORT_QUERY_INVALID`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-REPORT-002 — `GET /api/v1/branches/{branchId}/dashboard/reception`


- **Authorization:** Assigned staff or own GYM_ADMIN

- **Stories:** `VISIT-05, KEY-02, NFR-01`

- **Frontend/UI consumers:** SCR-REC-001

- **Database contract:** DB-OPS-001, DB-OPS-002

- **Request contract:** No body; optional businessDate

- **Success:** 200 ReceptionDashboardResource

- **Errors:** `BRANCH_NOT_FOUND, ACCESS_BRANCH_FORBIDDEN`

- **Idempotency:** No

- **Additional requirements:** Returns active visits, available keys count, long-running alerts; bounded payload.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-REPORT-003 — `GET /api/v1/organizations/{organizationId}/reports/daily-visits`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `REPORT-01`

- **Frontend/UI consumers:** SCR-REPORT-002

- **Database contract:** DB-OPS-002; post-MVP DB-RPT-001, DB-RPT-002

- **Request contract:** Query required: from,to; optional branchId, groupBy; page/pageSize for detail rows

- **Success:** 200 DailyVisitsReportResponse

- **Errors:** `REPORT_DATE_RANGE_INVALID, REPORT_RANGE_TOO_LARGE, ACCESS_ORGANIZATION_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-REPORT-004 — `GET /api/v1/organizations/{organizationId}/reports/key-status`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `REPORT-02`

- **Frontend/UI consumers:** SCR-REPORT-003

- **Database contract:** DB-OPS-001, DB-OPS-002; post-MVP DB-RPT-001, DB-RPT-002

- **Request contract:** Query: branchId optional, asOf optional

- **Success:** 200 KeyStatusReportResponse

- **Errors:** `REPORT_QUERY_INVALID, ACCESS_ORGANIZATION_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-REPORT-005 — `GET /api/v1/organizations/{organizationId}/reports/employee-activity`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN

- **Stories:** `REPORT-03`

- **Frontend/UI consumers:** SCR-REPORT-004

- **Database contract:** DB-AUD-001, DB-OPS-002, DB-OPS-003, DB-OPS-004; post-MVP DB-RPT-003

- **Request contract:** Query required: from,to; optional branchId, staffUserId; page/pageSize

- **Success:** 200 EmployeeActivityReportResponse

- **Errors:** `REPORT_DATE_RANGE_INVALID, REPORT_RANGE_TOO_LARGE, ACCESS_ORGANIZATION_FORBIDDEN`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-REPORT-006 — `GET /api/v1/organizations/{organizationId}/reports/sync-status`


- **Authorization:** Own GYM_ADMIN or SUPER_ADMIN; post-MVP

- **Stories:** `EVENT-02, NFR-02, NFR-06`

- **Frontend/UI consumers:** SCR-REPORT-002..004

- **Database contract:** DB-RPT-004

- **Request contract:** No body

- **Success:** 200 ReportingSyncStatusResponse

- **Errors:** `REPORTING_SERVICE_UNAVAILABLE`

- **Idempotency:** No

- **Additional requirements:** Frontend shows freshness/consistency indicator.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.14. Client portal (post-MVP)


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-PORTAL-001` | `POST` `/api/v1/portal/auth/login` | Public; post-MVP | Body: ClientPortalLoginRequest | 200 ClientAuthSessionResponse; sets separate portal refresh cookie | AUTH_INVALID_CREDENTIALS, AUTH_RATE_LIMITED | No | PORTAL-01 |
| `API-PORTAL-002` | `POST` `/api/v1/portal/auth/refresh` | Portal refresh cookie + CSRF | No body | 200 AccessTokenResponse; rotates portal refresh cookie | AUTH_REFRESH_INVALID, AUTH_REFRESH_REUSED, CSRF_VALIDATION_FAILED | No | PORTAL-01, AUTH-03 |
| `API-PORTAL-003` | `POST` `/api/v1/portal/auth/logout` | Portal refresh cookie + CSRF | No body | 204 | CSRF_VALIDATION_FAILED | Yes | PORTAL-01 |
| `API-PORTAL-004` | `GET` `/api/v1/portal/me` | Bearer client access token | No body | 200 CurrentClientSessionResponse | AUTH_TOKEN_INVALID, AUTH_SESSION_STALE | No | PORTAL-01 |
| `API-PORTAL-005` | `GET` `/api/v1/portal/visits` | Bearer client access token | Query: page, pageSize, from, to, status, sort | 200 Page<ClientOwnVisitResource> | AUTH_TOKEN_INVALID, REQUEST_VALIDATION_FAILED | No | PORTAL-02 |



#### API-PORTAL-001 — `POST /api/v1/portal/auth/login`


- **Authorization:** Public; post-MVP

- **Stories:** `PORTAL-01`

- **Frontend/UI consumers:** SCR-PORTAL-001

- **Database contract:** DB-PORTAL-001, DB-IDN-003, DB-AUD-001

- **Request contract:** Body: ClientPortalLoginRequest

- **Success:** 200 ClientAuthSessionResponse; sets separate portal refresh cookie

- **Errors:** `AUTH_INVALID_CREDENTIALS, AUTH_RATE_LIMITED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PORTAL-002 — `POST /api/v1/portal/auth/refresh`


- **Authorization:** Portal refresh cookie + CSRF

- **Stories:** `PORTAL-01, AUTH-03`

- **Frontend/UI consumers:** SCR-PORTAL-002

- **Database contract:** DB-IDN-003

- **Request contract:** No body

- **Success:** 200 AccessTokenResponse; rotates portal refresh cookie

- **Errors:** `AUTH_REFRESH_INVALID, AUTH_REFRESH_REUSED, CSRF_VALIDATION_FAILED`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PORTAL-003 — `POST /api/v1/portal/auth/logout`


- **Authorization:** Portal refresh cookie + CSRF

- **Stories:** `PORTAL-01`

- **Frontend/UI consumers:** SCR-PORTAL-002

- **Database contract:** DB-IDN-003, DB-AUD-001

- **Request contract:** No body

- **Success:** 204

- **Errors:** `CSRF_VALIDATION_FAILED`

- **Idempotency:** Yes

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PORTAL-004 — `GET /api/v1/portal/me`


- **Authorization:** Bearer client access token

- **Stories:** `PORTAL-01`

- **Frontend/UI consumers:** SCR-PORTAL-002

- **Database contract:** DB-PORTAL-001, DB-CRM-001

- **Request contract:** No body

- **Success:** 200 CurrentClientSessionResponse

- **Errors:** `AUTH_TOKEN_INVALID, AUTH_SESSION_STALE`

- **Idempotency:** No

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-PORTAL-005 — `GET /api/v1/portal/visits`


- **Authorization:** Bearer client access token

- **Stories:** `PORTAL-02`

- **Frontend/UI consumers:** SCR-PORTAL-003

- **Database contract:** DB-PORTAL-001, DB-OPS-002

- **Request contract:** Query: page, pageSize, from, to, status, sort

- **Success:** 200 Page<ClientOwnVisitResource>

- **Errors:** `AUTH_TOKEN_INVALID, REQUEST_VALIDATION_FAILED`

- **Idempotency:** No

- **Additional requirements:** Client ID always derived from token; never accepted from query/path.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



### 9.15. Test support (LOCAL/CI only)


| API ID | Method and path | Authorization | Request | Success response | Endpoint-specific errors | Idempotency | Stories |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `API-TEST-001` | `POST` `/api/test-support/seed` | LOCAL/CI only with test-support secret | Body: TestSeedRequest with testRunId | 201 TestSeedResponse | TEST_SUPPORT_DISABLED, TEST_SEED_INVALID | No | NFR-05 |
| `API-TEST-002` | `DELETE` `/api/test-support/test-runs/{testRunId}` | LOCAL/CI only | Path testRunId | 204 | TEST_SUPPORT_DISABLED, TEST_RUN_NOT_FOUND | No | NFR-05 |



#### API-TEST-001 — `POST /api/test-support/seed`


- **Authorization:** LOCAL/CI only with test-support secret

- **Stories:** `NFR-05`

- **Frontend/UI consumers:** Automation setup

- **Database contract:** All test-relevant tables

- **Request contract:** Body: TestSeedRequest with testRunId

- **Success:** 201 TestSeedResponse

- **Errors:** `TEST_SUPPORT_DISABLED, TEST_SEED_INVALID`

- **Idempotency:** No

- **Additional requirements:** Endpoint must not be registered in staging/production.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



#### API-TEST-002 — `DELETE /api/test-support/test-runs/{testRunId}`


- **Authorization:** LOCAL/CI only

- **Stories:** `NFR-05`

- **Frontend/UI consumers:** Automation cleanup

- **Database contract:** All test-relevant tables

- **Request contract:** Path testRunId

- **Success:** 204

- **Errors:** `TEST_SUPPORT_DISABLED, TEST_RUN_NOT_FOUND`

- **Idempotency:** No

- **Additional requirements:** Cleanup only records tagged to the run; never global truncate outside disposable CI.

- **Required tests:** positive; schema/contract; authentication; role; tenant/branch isolation; validation; not-found; documented conflict/concurrency/idempotency cases when applicable.



## 10. Critical endpoint examples

### 10.1. Staff login

```http
POST /api/v1/auth/login
Content-Type: application/json
Origin: https://app.gymops.example

{
  "email": "reception@northstar.example",
  "password": "correct horse battery staple"
}
```

```http
HTTP/1.1 200 OK
Cache-Control: no-store
Set-Cookie: gymops_staff_refresh=<opaque>; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict
Set-Cookie: gymops_staff_csrf=<random>; Path=/api/v1/auth; Secure; SameSite=Strict
X-Correlation-ID: 0f21...

{
  "data": {
    "accessToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresInSeconds": 600,
    "session": {
      "staffUserId": "7b...",
      "email": "reception@northstar.example",
      "firstName": "Anna",
      "lastName": "Koval",
      "role": "EMPLOYEE",
      "organizationId": "d1...",
      "branches": [
        {
          "id": "b1...",
          "name": "Northstar Center",
          "isPrimary": true
        }
      ],
      "primaryBranchId": "b1...",
      "permissionsVersion": 12
    }
  },
  "meta": {
    "requestId": "01J...",
    "correlationId": "0f21..."
  }
}
```

### 10.2. Membership eligibility

Ordinary business ineligibility is a successful evaluation, not a transport error:

```http
GET /api/v1/clients/{clientId}/membership-eligibility?branchId={branchId}
Authorization: Bearer <token>
```

```json
{
  "data": {
    "eligible": false,
    "reasonCodes": ["MEMBERSHIP_FROZEN"],
    "evaluatedAt": "2026-07-31T18:45:12.123Z",
    "branchId": "b1...",
    "membership": {
      "id": "m1...",
      "status": "FROZEN",
      "planName": "Monthly Unlimited"
    },
    "remainingVisits": null,
    "warnings": []
  },
  "meta": {
    "requestId": "01J...",
    "correlationId": "0f21..."
  }
}
```

### 10.3. Check-in

```http
POST /api/v1/branches/{branchId}/visits/check-in
Authorization: Bearer <token>
Idempotency-Key: 7b6c6587-5b0d-4a79-a95a-13cd30876b72
Content-Type: application/json

{
  "clientId": "c1...",
  "membershipId": "m1...",
  "lockerKeyId": "k17...",
  "startedAt": "2026-07-31T18:45:00.000Z"
}
```

The server performs one transaction:

1. validates actor/branch scope;
2. locks/validates client, membership and key;
3. confirms no ACTIVE visit;
4. confirms key AVAILABLE;
5. creates visit;
6. sets key ISSUED;
7. consumes membership visit where applicable;
8. stores idempotency response;
9. stores audit;
10. writes outbox event when enabled.

```http
HTTP/1.1 201 Created
Location: /api/v1/visits/v1...
X-Correlation-ID: 0f21...
```

```json
{
  "data": {
    "id": "v1...",
    "status": "ACTIVE",
    "branchId": "b1...",
    "client": {
      "id": "c1...",
      "clientNumber": "C-10042",
      "firstName": "Oleksii",
      "lastName": "Bondar"
    },
    "membership": {
      "id": "m1...",
      "planCode": "UNLIMITED-MONTH",
      "remainingVisits": null
    },
    "lockerKey": {
      "id": "k17...",
      "keyNumber": "17",
      "status": "ISSUED"
    },
    "startedAt": "2026-07-31T18:45:00.000Z",
    "version": 1
  },
  "meta": {
    "requestId": "01J...",
    "correlationId": "0f21..."
  }
}
```

### 10.4. Concurrent key conflict

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
```

```json
{
  "type": "https://api.gymops.example/problems/locker-key-not-available",
  "title": "Locker key is not available",
  "status": 409,
  "detail": "The selected key was assigned by another employee.",
  "instance": "/api/v1/branches/b1.../visits/check-in",
  "code": "LOCKER_KEY_NOT_AVAILABLE",
  "correlationId": "0f21...",
  "requestId": "01J...",
  "retryable": false,
  "errors": [
    {
      "pointer": "/lockerKeyId",
      "code": "LOCKER_KEY_NOT_AVAILABLE",
      "message": "Refresh available keys and select another key."
    }
  ],
  "timestamp": "2026-07-31T18:45:12.123Z"
}
```

### 10.5. Check-out by key

```http
POST /api/v1/branches/{branchId}/visits/checkout-by-key
Authorization: Bearer <token>
Idempotency-Key: 3af...
Content-Type: application/json

{
  "keyNumber": "17",
  "finishedAt": "2026-07-31T20:02:00.000Z"
}
```

The server atomically closes the visit, computes duration, releases the key, stores audit/idempotency and emits the event.

### 10.6. Stale edit

```http
PATCH /api/v1/clients/{clientId}
If-Match: W/"4"
```

When current version is `5`:

```http
HTTP/1.1 412 Precondition Failed
Content-Type: application/problem+json
```

```json
{
  "type": "https://api.gymops.example/problems/resource-version-stale",
  "title": "The resource changed",
  "status": 412,
  "detail": "Reload the client before saving your changes.",
  "code": "RESOURCE_VERSION_STALE",
  "currentVersion": 5,
  "correlationId": "0f21...",
  "timestamp": "2026-07-31T18:45:12.123Z"
}
```


## 11. Canonical error-code catalog

| Code | HTTP | Meaning |
| --- | --- | --- |
| `REQUEST_MALFORMED_JSON` | 400 | Malformed JSON or unsupported media type. |
| `REQUEST_VALIDATION_FAILED` | 422 | One or more path/query/body fields are invalid; `errors[]` contains JSON Pointers. |
| `AUTH_INVALID_CREDENTIALS` | 401 | Generic login failure; never reveals account existence/status. |
| `AUTH_TOKEN_MISSING` | 401 | Bearer token missing. |
| `AUTH_TOKEN_INVALID` | 401 | Signature/issuer/audience/claims invalid. |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired; frontend may attempt one refresh. |
| `AUTH_SESSION_STALE` | 401 | Permissions/session version changed; re-authentication or refresh required. |
| `AUTH_REFRESH_MISSING` | 401 | Refresh cookie missing. |
| `AUTH_REFRESH_INVALID` | 401 | Refresh token unknown/revoked/malformed. |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh token expired. |
| `AUTH_REFRESH_REUSED` | 401 | Rotated token replay detected; entire token family revoked. |
| `CSRF_VALIDATION_FAILED` | 403 | Cookie-authenticated request failed Origin/CSRF validation. |
| `ACCESS_ROLE_FORBIDDEN` | 403 | Role does not permit operation. |
| `ACCESS_ORGANIZATION_FORBIDDEN` | 403 | Principal is not authorized for organization. |
| `ACCESS_BRANCH_FORBIDDEN` | 403 | Principal is not assigned to branch. |
| `RESOURCE_NOT_FOUND` | 404 | Generic not-found; tenant-scoped APIs may return this instead of disclosing foreign resource existence. |
| `RESOURCE_VERSION_STALE` | 412 | `If-Match` does not match current resource version. |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | Critical command omitted Idempotency-Key. |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Same key used with different canonical request payload. |
| `RATE_LIMITED` | 429 | Rate limit exceeded; `Retry-After` required. |
| `DEPENDENCY_UNAVAILABLE` | 503 | Required dependency unavailable; safe retry guidance may be included. |
| `INTERNAL_ERROR` | 500 | Unexpected failure; no stack trace or sensitive detail. |
| `ORGANIZATION_CODE_EXISTS` | 409 | Organization code already exists. |
| `ORGANIZATION_INACTIVE` | 409 | Organization is not ACTIVE. |
| `BRANCH_CODE_EXISTS` | 409 | Branch code already exists in organization. |
| `BRANCH_HAS_ACTIVE_VISITS` | 409 | Branch cannot be deactivated while active visits exist. |
| `STAFF_EMAIL_EXISTS` | 409 | Staff email already exists. |
| `STAFF_ROLE_NOT_ALLOWED` | 403 | Actor cannot create/change requested role. |
| `BRANCH_ASSIGNMENT_INVALID` | 422 | Assignment references invalid/foreign/inactive branch. |
| `PRIMARY_BRANCH_REQUIRED` | 422 | Exactly one primary branch required for EMPLOYEE. |
| `CLIENT_POTENTIAL_DUPLICATE` | 409 | Potential duplicate found; includes minimal candidates and override token. |
| `CLIENT_NUMBER_EXISTS` | 409 | Client number exists in organization. |
| `CLIENT_BLOCKED` | 409 | Client state blocks requested operation. |
| `MEMBERSHIP_PLAN_CODE_EXISTS` | 409 | Plan code exists in organization. |
| `MEMBERSHIP_PLAN_INACTIVE` | 409 | Inactive plan cannot be assigned. |
| `MEMBERSHIP_OVERLAP_CONFLICT` | 409 | Conflicting active membership policy. |
| `MEMBERSHIP_NOT_ELIGIBLE` | 409 | Membership cannot be used for check-in; includes stable reason codes. |
| `MEMBERSHIP_FREEZE_NOT_ALLOWED` | 409 | Plan/membership cannot be frozen. |
| `MEMBERSHIP_FREEZE_OVERLAP` | 409 | Freeze period overlaps another active period. |
| `LOCKER_KEY_NUMBER_EXISTS` | 409 | Key number exists in branch. |
| `LOCKER_KEY_NOT_AVAILABLE` | 409 | Key is not AVAILABLE at commit time. |
| `LOCKER_KEY_ACTIVE_ASSIGNMENT` | 409 | Transition would conflict with an active visit. |
| `LOCKER_KEY_INVALID_TRANSITION` | 409 | Requested key state transition is invalid. |
| `CLIENT_ALREADY_CHECKED_IN` | 409 | Database-enforced active visit conflict. |
| `ACTIVE_VISIT_NOT_FOUND` | 404 | No active visit for provided key/client context. |
| `VISIT_ALREADY_CLOSED` | 409 | Visit is no longer ACTIVE. |
| `VISIT_CORRECTION_INVALID` | 409 | Correction violates domain/transaction rules. |
| `AUTO_CLOSE_THRESHOLD_NOT_REACHED` | 409 | Visit is not yet eligible for auto-close. |
| `INCIDENT_RELATION_INVALID` | 422 | Related client/key/visit do not form a valid same-tenant relation. |
| `INCIDENT_ALREADY_RESOLVED` | 409 | Resolved incident cannot be mutated as requested. |
| `RESOLUTION_REQUIRED` | 422 | Resolution text required. |
| `REPORT_DATE_RANGE_INVALID` | 422 | From/to dates invalid. |
| `REPORT_RANGE_TOO_LARGE` | 422 | Requested report range exceeds configured maximum. |
| `REPORTING_SERVICE_UNAVAILABLE` | 503 | Post-MVP reporting read service unavailable. |
| `TEST_SUPPORT_DISABLED` | 404 | Test support routes are not registered in this environment. |
| `SERVICE_UNHEALTHY` | 503 | Liveness check failed. |
| `DATABASE_UNAVAILABLE` | 503 | Required database connectivity check failed. |
| `MIGRATION_NOT_READY` | 503 | Database schema is not at the expected application migration level. |
| `AUTH_RATE_LIMITED` | 429 | Authentication attempt limit exceeded; generic response and Retry-After. |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization is absent or not visible to principal. |
| `ORGANIZATION_ALREADY_DEACTIVATED` | 409 | Organization is already deactivated. |
| `ORGANIZATION_HAS_BLOCKING_STATE` | 409 | Organization cannot transition because of blocking active state. |
| `BRANCH_NOT_FOUND` | 404 | Branch is absent or not visible to principal. |
| `BRANCH_ALREADY_DEACTIVATED` | 409 | Branch is already deactivated. |
| `BRANCH_INACTIVE` | 409 | Operation requires an ACTIVE branch. |
| `STAFF_NOT_FOUND` | 404 | Staff user is absent or not visible. |
| `STAFF_ALREADY_DEACTIVATED` | 409 | Staff user is already deactivated. |
| `CANNOT_DEACTIVATE_SELF` | 409 | Current principal cannot deactivate their own required admin account. |
| `LAST_GYM_ADMIN_CONFLICT` | 409 | Operation would leave organization without an active Gym Admin. |
| `CLIENT_NOT_FOUND` | 404 | Client is absent or not visible. |
| `CLIENT_ALREADY_BLOCKED` | 409 | Client is already blocked. |
| `CLIENT_NOT_BLOCKED` | 409 | Client is not blocked. |
| `CLIENT_HAS_ACTIVE_VISIT` | 409 | Client state transition is blocked by an active visit. |
| `DUPLICATE_OVERRIDE_INVALID` | 409 | Duplicate override token is missing, expired or does not match submitted data. |
| `SEARCH_QUERY_TOO_SHORT` | 422 | Search term does not meet minimum length. |
| `MEMBERSHIP_PLAN_NOT_FOUND` | 404 | Membership plan is absent or not visible. |
| `MEMBERSHIP_PLAN_ALREADY_INACTIVE` | 409 | Membership plan is already inactive. |
| `MEMBERSHIP_PLAN_IMMUTABLE_FIELD` | 409 | Requested update would alter fields frozen for existing assignments. |
| `MEMBERSHIP_NOT_FOUND` | 404 | Membership is absent or not visible. |
| `MEMBERSHIP_NOT_ACTIVE` | 409 | Operation requires an ACTIVE membership. |
| `MEMBERSHIP_ALREADY_CANCELLED` | 409 | Membership is already cancelled. |
| `MEMBERSHIP_HAS_ACTIVE_VISIT` | 409 | Membership cannot be cancelled while used by an active visit. |
| `FREEZE_PERIOD_NOT_FOUND` | 404 | Freeze period is absent or not visible. |
| `FREEZE_PERIOD_NOT_ACTIVE` | 409 | Freeze period cannot be ended from current state. |
| `LOCKER_KEY_NOT_FOUND` | 404 | Locker key is absent or not visible. |
| `LOCKER_KEY_NOT_ISSUED` | 409 | Locker key is not currently issued to an active visit. |
| `VISIT_NOT_FOUND` | 404 | Visit is absent or not visible. |
| `VISIT_NOT_ACTIVE` | 409 | Operation requires an ACTIVE visit. |
| `INCIDENT_NOT_FOUND` | 404 | Incident is absent or not visible. |
| `AUDIT_EVENT_NOT_FOUND` | 404 | Audit event is absent or not visible. |
| `REASON_REQUIRED` | 422 | A reason is mandatory for this state transition. |
| `REPORT_QUERY_INVALID` | 422 | Report filters are invalid or unsupported. |
| `TEST_RUN_NOT_FOUND` | 404 | No records exist for the requested test run. |
| `TEST_SEED_INVALID` | 422 | Requested test seed scenario or overrides are invalid. |

## 12. High-level authorization matrix

| Resource/action | SUPER_ADMIN | GYM_ADMIN | EMPLOYEE | CLIENT |
|---|---:|---:|---:|---:|
| Organizations CRUD | Yes | Own organization read/limited settings | No | No |
| Branch CRUD | Yes | Own organization | Assigned branch read only | No |
| Staff management | Yes | Own organization; cannot create SUPER_ADMIN | No | No |
| Client create/search/view | Platform support only by policy | Own organization | Assigned branches/organization according to policy | Self only in portal |
| Client block/unblock | Yes/support | Yes | No | No |
| Membership plans | Read/support | CRUD own organization | Read active plans | No |
| Membership assign/freeze/cancel | Support | Yes | Eligibility read only | Self read later |
| Locker keys | Support | CRUD/status | Read and operational use | No |
| Check-in/check-out | Support only | Yes | Assigned branches | No |
| Visit correction | Support only by policy | Yes | No | No |
| Incident report | Support | Yes | Yes | No |
| Incident resolve | Support | Yes | No | No |
| Audit/reports | Yes | Own organization | Restricted operational dashboard only | No |
| Client portal history | No | No | No | Self only |

Authorization is enforced by backend guards/policies and database tenant constraints. Hidden frontend controls are not authorization.


## 13. Idempotency requirements

Required operations:

- `API-VISIT-002` check-in;
- `API-VISIT-003` checkout by key;
- `API-VISIT-005` checkout by visit;
- `API-VISIT-007` correction;
- `API-VISIT-009` auto-close.

Recommended:

- membership assignment;
- key status transition;
- incident creation;
- organization deactivation.

Behavior:

1. Key scope is actor + organization + operation + key.
2. Server stores canonical request hash.
3. Same key + same request:
   - while PROCESSING: return `409/425` policy or wait bounded time;
   - after success: replay original status/body;
   - after deterministic business failure: replay stable failure as configured.
4. Same key + different request: `409 IDEMPOTENCY_KEY_REUSED`.
5. Records have bounded retention, minimum 24 hours for operational commands.
6. Sensitive response fields are never stored in idempotency response snapshots.


## 14. OpenAPI and contract requirements

- OpenAPI 3.1 document generated from NestJS code.
- Every endpoint has stable `operationId` equal to API ID in lower/camel form or an explicit mapped name.
- Every endpoint documents:
  - security scheme;
  - roles/scopes;
  - path/query/header parameters;
  - request DTO;
  - all success statuses;
  - standard Problem Details schema;
  - endpoint-specific error codes;
  - pagination;
  - ETag/If-Match;
  - Idempotency-Key when applicable.
- Swagger UI is available in LOCAL/STAGING behind authentication or environment allow-list.
- Raw JSON document is published as a CI artifact.
- CI validates OpenAPI syntax and detects breaking changes.
- Generated frontend types/API client may consume OpenAPI, but domain wrappers remain hand-owned.
- API and UI must not invent fields outside the contract.

Recommended endpoints:

```text
/api/docs
/api/openapi.json
```

Production exposure is controlled by environment policy.


## 15. Post-MVP internal event contracts

These are not public HTTP endpoints but are part of the API contract after Reporting/Audit extraction.

| Event ID | Event type | Producer | Consumers | Minimum payload |
|---|---|---|---|---|
| `EVT-001` | `visit.checked_in.v1` | Operations | Reporting, Audit | eventId, occurredAt, org/branch, visitId, clientId, membershipId, keyId/number, actor, startedAt, aggregateVersion |
| `EVT-002` | `visit.checked_out.v1` | Operations | Reporting, Audit | visitId, finishedAt, duration, check-out actor, key |
| `EVT-003` | `visit.corrected.v1` | Operations | Reporting, Audit | visitId, correctionId/type, whitelisted old/new values, reason, actor |
| `EVT-004` | `visit.auto_closed.v1` | Operations | Reporting, Audit | visitId, finishedAt, reason |
| `EVT-005` | `locker_key.status_changed.v1` | Operations | Reporting, Audit | keyId, branch, old/new status, reason, actor |
| `EVT-006` | `incident.reported.v1` | Operations | Reporting, Audit | incidentId/type/severity, relations, actor |
| `EVT-007` | `incident.resolved.v1` | Operations | Reporting, Audit | incidentId, resolution, actor |

All events use an envelope containing event ID, type, version, aggregate ID/version, organization ID, correlation ID, causation ID, trace ID and occurredAt.


## 16. API test requirements

### 16.1. Every endpoint

At minimum:

- happy path;
- OpenAPI schema validation;
- missing/invalid token;
- role denial;
- tenant/branch isolation;
- path/query/body validation;
- not-found;
- no sensitive fields;
- response headers/correlation ID.

### 16.2. Mutations

Additionally:

- DB side effect;
- audit event;
- ETag/version;
- stale update;
- rollback on failure;
- idempotency when applicable;
- repeated command;
- concurrency.

### 16.3. Authentication

- generic invalid credentials;
- deactivated/locked account;
- rate limit;
- access expiration;
- refresh rotation;
- old refresh replay;
- token family revocation;
- wrong issuer/audience/algorithm;
- staff permissions version change;
- CSRF/Origin failure;
- no token in logs.

### 16.4. Critical concurrency

Run real PostgreSQL tests for:

- two check-ins for one client;
- two assignments of one key;
- duplicate checkout;
- check-out during key status change;
- correction against stale version;
- duplicate idempotency key with different payload.

### 16.5. Contract pipeline

PR pipeline:

```text
build OpenAPI
→ validate OpenAPI
→ compare breaking changes
→ run unit/integration
→ start PostgreSQL/application
→ API smoke
→ publish OpenAPI + Playwright reports
```


## 17. User story → API traceability


| Story/NFR | API contract |
| --- | --- |
| `AUTH-01` | `API-AUTH-001`, `API-AUTH-004` |
| `AUTH-02` | `API-AUTH-003` |
| `AUTH-03` | `API-AUTH-002` |
| `AUTH-04` | `API-AUTH-004` |
| `AUTH-05` | `API-AUTH-004`, `API-BRANCH-001`, `API-BRANCH-003`, `API-STAFF-005` |
| `ORG-01` | `API-ORG-001`, `API-ORG-002`, `API-ORG-003` |
| `ORG-02` | `API-ORG-001`, `API-ORG-003`, `API-ORG-004` |
| `ORG-03` | `API-ORG-001`, `API-ORG-005` |
| `BRANCH-01` | `API-BRANCH-001`, `API-BRANCH-002`, `API-BRANCH-003`, `API-BRANCH-004` |
| `BRANCH-02` | `API-BRANCH-001`, `API-BRANCH-005` |
| `STAFF-01` | `API-STAFF-001`, `API-STAFF-002` |
| `STAFF-02` | `API-STAFF-001`, `API-STAFF-002` |
| `STAFF-03` | `API-STAFF-001`, `API-STAFF-003`, `API-STAFF-004`, `API-STAFF-005` |
| `STAFF-04` | `API-STAFF-001`, `API-STAFF-003`, `API-STAFF-006` |
| `CLIENT-01` | `API-CLIENT-002`, `API-CLIENT-003` |
| `CLIENT-02` | `API-CLIENT-001` |
| `CLIENT-03` | `API-CLIENT-001`, `API-CLIENT-004`, `API-CLIENT-008`, `API-MEM-001` |
| `CLIENT-04` | `API-CLIENT-005` |
| `CLIENT-05` | `API-CLIENT-006`, `API-CLIENT-007` |
| `PLAN-01` | `API-PLAN-001`, `API-PLAN-002`, `API-PLAN-003`, `API-PLAN-004`, `API-PLAN-005` |
| `MEMBERSHIP-01` | `API-PLAN-001`, `API-MEM-001`, `API-MEM-002`, `API-MEM-003`, `API-MEM-007` |
| `MEMBERSHIP-02` | `API-MEM-004`, `API-VISIT-002` |
| `MEMBERSHIP-03` | `API-MEM-001`, `API-MEM-003`, `API-MEM-005`, `API-MEM-006`, `API-MEM-007` |
| `MEMBERSHIP-04` | `API-VISIT-002` |
| `KEY-01` | `API-KEY-002`, `API-KEY-004` |
| `KEY-02` | `API-KEY-001`, `API-KEY-003`, `API-REPORT-002` |
| `KEY-03` | `API-KEY-003`, `API-KEY-004`, `API-KEY-005` |
| `VISIT-01` | `API-MEM-004`, `API-KEY-001`, `API-VISIT-002` |
| `VISIT-02` | `API-VISIT-002` |
| `VISIT-03` | `API-VISIT-002` |
| `VISIT-04` | `API-VISIT-002` |
| `VISIT-05` | `API-VISIT-001`, `API-VISIT-004`, `API-REPORT-002` |
| `VISIT-06` | `API-VISIT-003`, `API-VISIT-005` |
| `VISIT-07` | `API-VISIT-003`, `API-VISIT-005` |
| `VISIT-08` | `API-VISIT-004`, `API-VISIT-006` |
| `VISIT-09` | `API-VISIT-004`, `API-VISIT-007` |
| `VISIT-10` | `API-VISIT-001`, `API-VISIT-008`, `API-VISIT-009` |
| `INCIDENT-01` | `API-CLIENT-008`, `API-KEY-005`, `API-INC-001`, `API-INC-002`, `API-INC-003` |
| `INCIDENT-02` | `API-CLIENT-008`, `API-KEY-005`, `API-INC-001`, `API-INC-002`, `API-INC-003` |
| `INCIDENT-03` | `API-INC-001`, `API-INC-003`, `API-INC-004`, `API-INC-005`, `API-INC-006` |
| `AUDIT-01` | All mutation endpoints, `API-AUDIT-001`, `API-AUDIT-002` |
| `AUDIT-02` | `API-AUDIT-001`, `API-AUDIT-002` |
| `REPORT-01` | `API-REPORT-001`, `API-REPORT-003` |
| `REPORT-02` | `API-REPORT-001`, `API-REPORT-004` |
| `REPORT-03` | `API-REPORT-001`, `API-REPORT-005` |
| `PORTAL-01` | `API-PORTAL-001`, `API-PORTAL-002`, `API-PORTAL-003`, `API-PORTAL-004` |
| `PORTAL-02` | `API-VISIT-006`, `API-PORTAL-005` |
| `EVENT-01` | Internal event contracts EVT-001..007, `API-REPORT-006` |
| `EVENT-02` | `API-REPORT-006` |
| `NFR-01` | `API-REPORT-001`, `API-REPORT-002` |
| `NFR-02` | `API-SYS-001`, `API-SYS-002`, `API-REPORT-006` |
| `NFR-03` | `API-AUTH-001..004`, All protected endpoints |
| `NFR-04` | `API-AUDIT-001`, `API-AUDIT-002` |
| `NFR-05` | `API-TEST-001`, `API-TEST-002` |
| `NFR-06` | `API-SYS-001`, `API-SYS-002`, `API-SYS-003`, `API-REPORT-006` |
| `NFR-07` | `API-VISIT-002`, `API-VISIT-003`, `API-VISIT-005`, `API-VISIT-007`, `API-KEY-005`, `API-MEM-002`, `API-INC-002` |



## 18. API implementation order

| Phase | API groups |
|---|---|
| Phase 2 | `API-SYS-001..003`, Problem Details filter, correlation ID, OpenAPI skeleton |
| Phase 4 | `API-AUTH-001..004`; technical single-branch guard foundation |
| Phase 5 | MVP subset: `API-STAFF-001..002`, `API-CLIENT-001..004` |
| Phase 6 | MVP subset: `API-PLAN-001..005`, `API-MEM-001..004`, `API-MEM-007`, `API-KEY-001..004` |
| Phase 7 | `API-VISIT-001..006`, `API-REPORT-002`; idempotent check-in/check-out |
| Phase 8 | `API-TEST-*` for LOCAL/CI, OpenAPI/test hardening; not deployed to staging/production |
| Phase 9 | No new product endpoints; Docker runtime validation |
| Phase 10 | No new product endpoints; Jenkins API/OpenAPI quality gates |
| Phase 11–13 | No new product endpoints; AWS staging, Jenkins CD and post-deploy/nightly validation |
| Phase 14 | `API-ORG-*`, `API-BRANCH-*`; expand `API-STAFF-001..002` for Gym Admin creation and branch administration |
| Phase 15 | `API-STAFF-003..006`, `API-CLIENT-005..007`; full `AUTH-05` branch-assignment lifecycle |
| Phase 16 | `API-MEM-005..006`, `API-KEY-005` |
| Phase 17 | `API-VISIT-007..009`, `API-CLIENT-008`, `API-INC-*` |
| Phase 18 | `API-AUDIT-*`, `API-REPORT-001`, `API-REPORT-003..005` |
| Phase 19 | `API-PORTAL-*` optional |
| Phase 20 | internal event contracts and `API-REPORT-006` |

## 19. Definition of Done for an endpoint

An endpoint is Done when:

1. API ID and OpenAPI operation are defined.
2. Auth, role and tenant/branch policy are implemented.
3. DTO validation and documented error codes exist.
4. Service/domain behavior exists.
5. PostgreSQL transaction/constraints are covered where applicable.
6. Audit and correlation requirements are satisfied.
7. Idempotency/ETag requirements are implemented where applicable.
8. Unit and real-DB integration tests pass.
9. Playwright API tests pass.
10. OpenAPI contract test passes.
11. Frontend API wrapper uses the generated/typed contract.
12. No sensitive data appears in logs, response or error.
13. `requirements.md`, `database-requirements.md` and this document remain traceable.
