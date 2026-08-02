# GymOps — Figma Make Prompts

## 1. Як використовувати цей файл

Цей файл містить окремі prompts для генерації дизайну всіх сторінок, modal dialogs, drawers та alert dialogs GymOps у Figma Make.

Рекомендований порядок:

1. Створити один новий Figma Make file.
2. У Plan mode вставити `PROMPT 00 — Global product and design system`.
3. Після погодження плану генерувати екрани по одному, у порядку цього документа.
4. Не вставляти всі prompts одним повідомленням.
5. Для кожного наступного prompt використовувати той самий Make file, щоб Figma Make зберігав design context.
6. Після генерації сторінки окремими follow-up prompts виправляти лише конкретні елементи через Point and edit.
7. Не передавати у prompts реальні персональні дані, API keys або production credentials.

Prompts написані англійською для точнішої генерації. Видимий текст інтерфейсу також англійською, але layout повинен бути localization-ready.

---

## 2. Загальні правила для всіх prompts

- Product: `GymOps`, a mini ERP/CRM for gym networks and reception operations.
- Primary operational audience: gym reception employees working quickly on desktop or tablet while a client waits.
- Secondary audience: gym administrators managing staff, clients, memberships, keys, incidents, reports and audit.
- Platform audience: super administrators managing organizations and branches.
- Optional post-MVP audience: gym clients viewing membership and visit history.
- UI stack: React 19+, TypeScript, Tailwind CSS v4, HeroUI v3 compound components.
- Desktop-first frame: 1440×1024. Also preserve a usable 1024×768 tablet layout.
- Use semantic HeroUI variants: one primary action per context, secondary alternatives, tertiary dismissals, danger only for destructive actions.
- Use real HeroUI patterns for `Button`, `Card`, `Table`, `Chip`, `SearchField`, `TextField`, `Input`, `Select`, `Autocomplete`, `ComboBox`, `DatePicker`, `DateRangePicker`, `TimeField`, `Form`, `Tabs`, `Modal`, `Drawer`, `AlertDialog`, `Alert`, `Toast`, `Skeleton`, `Spinner`, `Pagination`, `Dropdown`, `Accordion`, `Tooltip`, `ProgressBar`, and `ProgressCircle`.
- Use accessible labels, visible keyboard focus, logical tab order, 44px minimum hit areas, readable contrast, and do not communicate status by color alone.
- Use HeroUI compound component anatomy rather than custom imitation components.
- Keep the product light, calm and operational: no dark theme for MVP, no glassmorphism, no neon, no large marketing gradients, no gym-body photography, no oversized decorative typography.
- Use a clean B2B SaaS visual language suitable for 2026: generous but efficient spacing, clear hierarchy, compact data tables, progressive disclosure, subtle motion, immediate feedback and excellent empty/error/loading states.
- Use Inter or another neutral open-source sans-serif.
- Use an 8px spacing system represented by Figma variables: `space/1`, `space/2`, `space/3`, `space/4`, `space/6`, `space/8`.
- Create and apply semantic Figma variables instead of raw one-off values:
  - `color/background/base` = `#F6F8FB`;
  - `color/background/elevated` = `#FFFFFF`;
  - `color/action/primary` = `#2563EB`;
  - `color/action/primary-soft` = `#EFF6FF`;
  - `color/content/primary` = `#111827`;
  - `color/content/secondary` = `#667085`;
  - `color/border/default` = `#E4E7EC`;
  - `color/status/success` = `#15803D`;
  - `color/status/warning` = `#B54708`;
  - `color/status/danger` = `#B42318`.
- Create radius variables `radius/sm`, `radius/md`, `radius/lg`, `radius/full`; use 12–16px only as reference values, not detached raw values.
- Use subtle 1px borders, restrained shadows, and avoid excessive pill shapes.
- Staff application shell: 248px left sidebar, 64px top bar, organization/branch context, breadcrumbs, profile dropdown, role chip, global toast region.
- Tables: sticky header, medium density, clear row hover, sortable columns where relevant, row action dropdown, pagination, empty/loading/error states.
- Details are shown in right-side drawers when preserving list context matters.
- Create/edit flows use modal dialogs; destructive actions use alert dialogs.
- Use realistic sample data consistently across screens:
  - Organization: `Northstar Fitness`;
  - Branches: `Podil`, `Pechersk`, `Obolon`;
  - Gym Admin: `Dmytro Shevchenko`;
  - Employee: `Iryna Melnyk`;
  - Client: `Olena Kovalenko`;
  - Membership: `Unlimited Monthly`;
  - Locker key: `K-017`, locker `117`;
  - Active visit start: `18:42`;
  - Current branch: `Podil`.
- Do not invent features, pages or fields beyond the prompt.
- Generate a functional prototype with realistic interactions, but use mock data only.

---

<!-- BEGIN GENERATED UI NAMING CONTRACT -->

## 2.1. Canonical UI naming contract for Figma MCP and frontend

Every generated design must follow the canonical registry in `ui-contract.md`.

The stable integration key is the **UI ID**, not the visible title. The same UI ID links:

```text
User story
  -> UI ID
  -> exact Figma root node
  -> frontend route
  -> React page/component
  -> Playwright-visible accessible behavior
```

Naming namespaces:

- `Screen/<UI-ID>/<Role>/<Feature>/<Viewport>/<State>` — final page frames.
- `Overlay/<UI-ID>/<Domain>/<Action>/<State>` — modal, drawer and alert-dialog roots.
- `Component/HeroUI/<ComponentName>` — HeroUI-compatible reusable primitives.
- `Component/GymOps/<ComponentName>` — domain components.
- `Layout/<Name>` — application/page layout containers.
- `Section/<Name>` — semantic page sections.
- `Form/<Name>` — forms.
- `Field/<Domain>/<Name>` — labeled input controls.
- `Table/<Domain>/<Name>` and `Column/<Domain>/<Name>` — data tables.
- `Action/<Domain>/<VerbObject>` — buttons and actionable links.
- `Feedback/<Domain>/<Name>` — alerts, toasts, progress and validation summaries.

Do not rename generated root nodes or required semantic child layers. Visible copy can evolve; the contract names remain stable.
<!-- END GENERATED UI NAMING CONTRACT -->

## PROMPT 00 — Global product and design system

```text
Create the global product foundation and reusable design system for GymOps, a light desktop-first mini ERP/CRM for gym networks.

Context:
- Reception employees must check clients in and out within seconds while a client is waiting.
- Gym administrators manage clients, memberships, locker keys, staff, incidents, reports and audit.
- Super administrators manage gym organizations and branches.
- The interface must feel calm, trustworthy, fast and operational rather than promotional or fitness-themed.

Technical and component constraints:
- Use React 19+, TypeScript, Tailwind CSS v4 and HeroUI v3 compound components.
- Build reusable primitives and patterns instead of one-off custom controls.
- Use HeroUI semantic action hierarchy: primary, secondary, tertiary and danger.
- Use accessible HeroUI form, table, modal, drawer, alert dialog, feedback and navigation patterns.

Create these reusable foundations:
1. A light staff application shell with a 248px sidebar and 64px top bar.
2. Sidebar states for SUPER_ADMIN, GYM_ADMIN and EMPLOYEE.
3. Header with organization name, branch selector, user avatar, role chip and profile dropdown.
4. Page header pattern with breadcrumbs, title, short description and one primary action.
5. List page pattern with search, filters, table, pagination, skeleton, empty state and error state.
6. Details page pattern with summary cards, tabs and activity timeline.
7. Form modal pattern with labels, helper text, validation errors, cancel and primary submit.
8. Right-side details drawer pattern.
9. Destructive alert dialog pattern.
10. Status chips for ACTIVE, BLOCKED, SUSPENDED, EXPIRED, FROZEN, AVAILABLE, ISSUED, LOST, DAMAGED, MAINTENANCE, COMPLETED, AUTO_CLOSED, INCIDENT and RESOLVED.
11. Toast, alert, skeleton and spinner feedback patterns.
12. A compact icon set using Lucide-style line icons.

Visual direction:
- Frame 1440×1024, usable at 1024×768.
- App background #F6F8FB, white surfaces, blue primary #2563EB, dark text #111827, border #E4E7EC.
- Inter typography, 8px spacing system, 12–16px surface radius, subtle borders and restrained shadows.
- No gradients, glassmorphism, neon, gym photography or decorative hero content.
- Dense enough for operational work, but never cramped.
- One primary action per view.
- Visible focus states, 44px minimum targets, WCAG AA-minded contrast and status labels that do not rely on color alone.

Deliverable:
Create a reusable component and layout foundation plus one neutral example dashboard frame demonstrating the system. Do not generate product-specific pages yet.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SYS-DS-001`.
- Root Figma frame name: `Library/GymOps/DesignSystem`.
- Route: `N/A`.
- Frontend page component: `GymOpsDesignSystem`.
- Target frontend file: `apps/frontend/src/shared/ui`.
- Feature boundary: `shared-ui`.
- Related stories: `Cross-cutting`.
- Required semantic Figma child layer names:
  - `Foundation/ColorVariables`
  - `Foundation/SpacingVariables`
  - `Foundation/TypographyVariables`
  - `Component/GymOps/AppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/DataTable`
  - `Component/GymOps/StatusChip`
  - `Component/GymOps/FormDialog`
  - `Component/GymOps/DetailsDrawer`
  - `Component/GymOps/ConfirmAlertDialog`
  - `Component/GymOps/EmptyState`
  - `Component/GymOps/ErrorState`
- Required screen/state variants:
  - `Light mode`
  - `Desktop 1440`
  - `Compact desktop 1280`
  - `Tablet 1024`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

# 3. Prompts для сторінок

## PROMPT 01 — Staff Login

```text
Create the GymOps staff login page at route `/login` using the established GymOps design system.

Audience: SUPER_ADMIN, GYM_ADMIN and EMPLOYEE.
Goal: authenticate quickly and confidently without exposing security details.

Layout:
- Full-screen light background with a centered 420px authentication card.
- Small GymOps wordmark above the form.
- Concise heading: “Welcome back”.
- Supporting text: “Sign in to continue to GymOps”.
- No marketing illustration.

HeroUI components:
- Card, Form, TextField, Input, Button, Checkbox, Alert, Spinner, Link and Tooltip.

Fields:
- Email, required, email keyboard and visible label.
- Password, required, show/hide control.
- Remember this device, optional and visually secondary.

Actions:
- Primary: Sign in.
- Tertiary text link: Forgot password, marked as not yet available or omitted for MVP.

Show design variants in the same frame or as nearby component states:
- default;
- submitting with spinner and disabled submit;
- generic invalid credentials alert;
- deactivated account alert;
- organization suspended alert;
- rate limit alert.

Use secure, generic error wording. Keep the page light, precise and distraction-free.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-AUTH-001`.
- Root Figma frame name: `Screen/SCR-AUTH-001/Auth/StaffLogin/Desktop/Default`.
- Route: `/login`.
- Frontend page component: `StaffLoginPage`.
- Target frontend file: `apps/frontend/src/app/(auth)/login/page.tsx`.
- Feature boundary: `features/auth`.
- Related stories: `AUTH-01, AUTH-03`.
- Required semantic Figma child layer names:
  - `Layout/AuthShell`
  - `Section/LoginCard`
  - `Form/StaffLoginForm`
  - `Field/Auth/Email`
  - `Field/Auth/Password`
  - `Control/Auth/RememberDevice`
  - `Action/Auth/SignIn`
  - `Action/Auth/ForgotPassword`
  - `Feedback/Auth/LoginAlert`
  - `Feedback/Auth/SubmitProgress`
- Required screen/state variants:
  - `Default`
  - `Submitting`
  - `InvalidCredentials`
  - `Deactivated`
  - `OrganizationSuspended`
  - `RateLimited`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 02 — Forbidden 403

```text
Create the GymOps `/403` forbidden page inside the staff application shell.

Purpose: clearly explain that the signed-in user does not have access to this area without sounding alarming.

Layout and components:
- Centered Card inside the content area.
- Small lock icon, heading “Access restricted”, concise explanation, current role Chip.
- Primary Button: “Go to my dashboard”.
- Secondary Button: “Go back”.
- Optional small support text with correlation ID, visually de-emphasized.

Do not show technical stack traces. Preserve the sidebar and header appropriate to the user’s role.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-SYS-403`.
- Root Figma frame name: `Screen/SCR-SYS-403/System/Forbidden/Desktop/Default`.
- Route: `/403`.
- Frontend page component: `ForbiddenPage`.
- Target frontend file: `apps/frontend/src/app/(system)/403/page.tsx`.
- Feature boundary: `features/system-pages`.
- Related stories: `AUTH-04, AUTH-05`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Section/ForbiddenCard`
  - `Component/GymOps/RoleChip`
  - `Action/System/GoToDashboard`
  - `Action/System/GoBack`
  - `Text/System/CorrelationId`
- Required screen/state variants:
  - `Default`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 03 — Not Found 404

```text
Create the GymOps `/404` page inside the staff application shell.

Use a compact centered Card with:
- subtle map/search icon;
- heading “Page not found”;
- short explanation;
- primary Button “Go to dashboard”;
- secondary Button “Go back”.

Keep the interface consistent with the light GymOps system. Do not use a large illustration or playful visual treatment that would feel out of place in operational software.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-SYS-404`.
- Root Figma frame name: `Screen/SCR-SYS-404/System/NotFound/Desktop/Default`.
- Route: `/404`.
- Frontend page component: `NotFoundPage`.
- Target frontend file: `apps/frontend/src/app/not-found.tsx`.
- Feature boundary: `features/system-pages`.
- Related stories: `NFR-05`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Section/NotFoundCard`
  - `Action/System/GoToDashboard`
  - `Action/System/GoBack`
- Required screen/state variants:
  - `Default`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 04 — Super Admin Platform Dashboard

```text
Create the SUPER_ADMIN Platform Dashboard at `/super-admin/dashboard`.

User goal: understand platform health and jump to organization management.

Use the SUPER_ADMIN shell with sidebar items Dashboard, Organizations, System Audit and Profile.

Page header:
- Title “Platform dashboard”.
- Short subtitle.
- Primary Button “Create organization”.

Content:
1. Six compact summary Cards: active organizations, suspended organizations, active branches, gym admins, organizations created this month, failed logins today.
2. “Recently created organizations” Table with name, branches, admins, status and created date.
3. “Recent platform audit” Table with timestamp, actor, event, entity, result and correlation ID.
4. Small persistent Alert only when platform services are degraded.

No charts. Prioritize scanability and clear status chips. Include loading skeleton and empty state variants.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-PLATFORM-001`.
- Root Figma frame name: `Screen/SCR-PLATFORM-001/SuperAdmin/PlatformDashboard/Desktop/Default`.
- Route: `/super-admin/dashboard`.
- Frontend page component: `PlatformDashboardPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/super-admin/dashboard/page.tsx`.
- Feature boundary: `features/platform-dashboard`.
- Related stories: `ORG-01..03, BRANCH-01..02, NFR-06`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Section/PlatformMetrics`
  - `Component/GymOps/MetricCard/Organizations`
  - `Component/GymOps/MetricCard/Branches`
  - `Component/GymOps/MetricCard/ActiveStaff`
  - `Section/RecentOrganizations`
  - `Table/Organizations/Recent`
  - `Section/PlatformAlerts`
  - `Action/Organization/Create`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 05 — Organizations List

```text
Create the SUPER_ADMIN Organizations List page at `/super-admin/organizations`.

User goal: find, review, create and manage gym organizations.

Page header:
- Breadcrumbs: Platform / Organizations.
- Title “Organizations”.
- Primary Button “Create organization”.

Filter toolbar:
- SearchField for display name, legal name or slug.
- Status Select: All, Active, Suspended.
- Clear filters tertiary action.

HeroUI Table columns:
- Display name;
- Legal name;
- Slug;
- Timezone;
- Branches;
- Gym admins;
- Status Chip;
- Created at;
- Actions Dropdown.

Row actions: View, Edit, Deactivate or Activate according to state.
Include sticky table header, pagination, result count, row hover, loading skeleton, no-results state and first-use empty state.
Use realistic data for Northstar Fitness and two additional organizations.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-ORG-001`.
- Root Figma frame name: `Screen/SCR-ORG-001/SuperAdmin/OrganizationsList/Desktop/Default`.
- Route: `/super-admin/organizations`.
- Frontend page component: `OrganizationsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/super-admin/organizations/page.tsx`.
- Feature boundary: `features/organizations`.
- Related stories: `ORG-01..03`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Action/Organization/Create`
  - `Toolbar/Organizations/Filters`
  - `Field/Organization/Search`
  - `Field/Organization/StatusFilter`
  - `Table/Organizations/List`
  - `Column/Organization/Name`
  - `Column/Organization/Branches`
  - `Column/Organization/Admins`
  - `Column/Organization/Status`
  - `Column/Organization/CreatedAt`
  - `Column/Organization/Actions`
  - `Component/GymOps/Pagination`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 06 — Organization Details

```text
Create the SUPER_ADMIN Organization Details page at `/super-admin/organizations/[organizationId]` for `Northstar Fitness`.

Header:
- Breadcrumbs;
- organization name;
- ACTIVE status Chip;
- small organization ID with copy action;
- secondary Button “Edit”;
- danger tertiary action “Deactivate”.

Use HeroUI Tabs:
1. Overview;
2. Branches;
3. Gym admins;
4. Settings;
5. Audit.

Overview tab:
- two-column definition layout for display name, legal name, slug, timezone, status, created and updated timestamps;
- compact summary Cards for branch count and admin count.

Branches tab:
- SearchField, status Select, primary Button “Add branch”;
- Table with name, code, address, timezone, staff count, active visits, status and actions.

Gym admins tab:
- Table with name, email, status and created date;
- primary Button “Add gym admin”.

Settings and Audit tabs may show realistic structured placeholders matching the established system, not blank content.
Preserve a strong information hierarchy without overcrowding.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-ORG-002`.
- Root Figma frame name: `Screen/SCR-ORG-002/SuperAdmin/OrganizationDetails/Desktop/Overview`.
- Route: `/super-admin/organizations/[organizationId]`.
- Frontend page component: `OrganizationDetailsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/super-admin/organizations/[organizationId]/page.tsx`.
- Feature boundary: `features/organizations`.
- Related stories: `ORG-02..03, BRANCH-01..02, STAFF-01`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/OrganizationStatusChip`
  - `Action/Organization/Edit`
  - `Action/Organization/Deactivate`
  - `Tabs/Organization/Details`
  - `Section/Organization/Overview`
  - `Table/Branches/List`
  - `Table/GymAdmins/List`
  - `Action/Branch/Create`
  - `Action/Staff/CreateGymAdmin`
- Required screen/state variants:
  - `Overview`
  - `Branches`
  - `GymAdmins`
  - `Loading`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 07 — Gym Admin Dashboard

```text
Create the GYM_ADMIN dashboard at `/app/dashboard` for Northstar Fitness, current branch Podil.

Goal: give the gym administrator an immediate operational overview.

Page header:
- Title “Gym dashboard”.
- Branch context Chip or selector.
- Primary Button “Go to reception”.

Summary Cards:
- total clients;
- active memberships;
- active visits now;
- available keys;
- issued keys;
- unresolved incidents.

Operational content:
- top Alert for long-running visits when any exist;
- Active visits preview Table with client, key, start time, duration and warning status;
- Unresolved incidents preview Table with type, client/key, age and status;
- compact links to Clients, Locker keys, Incidents and Reports.

No chart is required. Use strong scanning hierarchy and prioritize live operational exceptions over totals.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-GYM-001`.
- Root Figma frame name: `Screen/SCR-GYM-001/GymAdmin/GymDashboard/Desktop/Default`.
- Route: `/app/dashboard`.
- Frontend page component: `GymDashboardPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/dashboard/page.tsx`.
- Feature boundary: `features/gym-dashboard`.
- Related stories: `VISIT-05, REPORT-01..03`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/BranchSelector`
  - `Section/GymMetrics`
  - `Component/GymOps/MetricCard/ActiveVisits`
  - `Component/GymOps/MetricCard/AvailableKeys`
  - `Component/GymOps/MetricCard/Incidents`
  - `Section/RecentActivity`
  - `Table/Visits/Recent`
  - `Section/OperationalAlerts`
  - `Action/Reception/Open`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 08 — Staff List

```text
Create the GYM_ADMIN Staff List page at `/app/staff`.

Goal: find and manage gym employees across allowed branches.

Page header:
- Title “Staff”.
- Primary Button “Add employee”.

Filters:
- SearchField by name or email;
- role Select;
- status Select;
- branch Autocomplete;
- clear filters action.

Table columns:
- full name with Avatar initials;
- email;
- role Chip;
- assigned branches;
- status Chip;
- last login;
- created at;
- Actions Dropdown.

Actions: View details, Edit, Deactivate.
Selecting a row opens the Staff Details Drawer.
Include pagination, result count, loading skeleton, no results and empty organization state.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-STAFF-001`.
- Root Figma frame name: `Screen/SCR-STAFF-001/GymAdmin/StaffList/Desktop/Default`.
- Route: `/app/staff`.
- Frontend page component: `StaffPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/staff/page.tsx`.
- Feature boundary: `features/staff`.
- Related stories: `STAFF-01..04`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Action/Staff/Create`
  - `Toolbar/Staff/Filters`
  - `Field/Staff/Search`
  - `Field/Staff/RoleFilter`
  - `Field/Staff/BranchFilter`
  - `Field/Staff/StatusFilter`
  - `Table/Staff/List`
  - `Column/Staff/Name`
  - `Column/Staff/Email`
  - `Column/Staff/Role`
  - `Column/Staff/Branches`
  - `Column/Staff/Status`
  - `Column/Staff/Actions`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 09 — Clients List

```text
Create the GymOps Clients CRM list page at `/app/clients`.

Primary users: GYM_ADMIN and EMPLOYEE.
Goal: find a client within seconds and start check-in or open the profile.

Page header:
- Title “Clients”.
- Primary Button “Add client” for permitted roles.

Prominent filter area:
- large SearchField with placeholder “Search by name, phone, email or client ID”;
- client status Select;
- home branch Autocomplete;
- membership status Select.

Table columns:
- client name;
- phone;
- email;
- home branch;
- client status Chip;
- membership status Chip;
- last visit;
- Actions Dropdown.

Row actions:
- View profile;
- Start check-in;
- Edit;
- Block or unblock.

Optimize for keyboard use, quick scanning and exact search. Include no-results suggestions, loading skeleton, pagination and a first-client empty state.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-CLIENT-001`.
- Root Figma frame name: `Screen/SCR-CLIENT-001/Staff/ClientsList/Desktop/Default`.
- Route: `/app/clients`.
- Frontend page component: `ClientsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/clients/page.tsx`.
- Feature boundary: `features/clients`.
- Related stories: `CLIENT-01..05`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Action/Client/Create`
  - `Toolbar/Clients/Filters`
  - `Field/Client/Search`
  - `Field/Client/StatusFilter`
  - `Field/Client/MembershipFilter`
  - `Table/Clients/List`
  - `Column/Client/Name`
  - `Column/Client/Phone`
  - `Column/Client/Membership`
  - `Column/Client/LastVisit`
  - `Column/Client/Status`
  - `Column/Client/Actions`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 10 — Client Profile

```text
Create the Client Profile page at `/app/clients/[clientId]` for Olena Kovalenko.

Header:
- Avatar initials, full name, client ID and ACTIVE status Chip;
- primary Button “Check in”;
- secondary Button “Edit”;
- overflow menu with Block/Unblock.

Summary Cards:
- current membership and status;
- remaining visits;
- last visit;
- active visit indicator;
- unresolved incidents count.

HeroUI Tabs:
1. Overview;
2. Memberships;
3. Visit history;
4. Incidents;
5. Audit, visible only to GYM_ADMIN.

Overview:
- definition layout for first name, last name, phone, email, home branch, notes, created and updated dates.

Memberships Table:
- plan, type, start, end, status, visits used/allowed, allowed branches and actions.
- primary contextual action “Assign membership”.

Visit History Table:
- start, finish, duration, branch, key, status, check-in employee, check-out employee and correction indicator.

Incidents Table:
- type, key, visit, status, reported at/by and resolved at.

Use progressive disclosure, status chips and a clean two-level hierarchy. Do not expose internal audit fields to EMPLOYEE when not permitted.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-CLIENT-002`.
- Root Figma frame name: `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`.
- Route: `/app/clients/[clientId]`.
- Frontend page component: `ClientProfilePage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/clients/[clientId]/page.tsx`.
- Feature boundary: `features/clients`.
- Related stories: `CLIENT-03..05, MEMBERSHIP-01..03, VISIT-08, INCIDENT-01..03`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/ClientSummaryCard`
  - `Component/GymOps/ClientStatusChip`
  - `Action/Client/Edit`
  - `Action/Client/Block`
  - `Tabs/Client/Profile`
  - `Section/Client/Overview`
  - `Section/Client/Memberships`
  - `Table/Client/VisitHistory`
  - `Table/Client/Incidents`
  - `Action/Membership/Assign`
- Required screen/state variants:
  - `Overview`
  - `Memberships`
  - `VisitHistory`
  - `Incidents`
  - `Blocked`
  - `Loading`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 11 — Membership Plans List

```text
Create the Membership Plans page at `/app/membership-plans` for GYM_ADMIN.

Page header:
- Title “Membership plans”.
- Primary Button “Create plan”.

Filters:
- SearchField;
- type Select;
- active status Select.

Table columns:
- plan name;
- type;
- validity period;
- visit limit;
- allowed branches;
- active status Chip;
- clients assigned count;
- Actions Dropdown.

Use clear human-readable values such as “30 days”, “Unlimited”, “12 visits” and “All branches”.
Include pagination, loading, no-results and first-plan empty states.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-PLAN-001`.
- Root Figma frame name: `Screen/SCR-PLAN-001/GymAdmin/MembershipPlans/Desktop/Default`.
- Route: `/app/membership-plans`.
- Frontend page component: `MembershipPlansPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/membership-plans/page.tsx`.
- Feature boundary: `features/membership-plans`.
- Related stories: `PLAN-01`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Action/MembershipPlan/Create`
  - `Toolbar/MembershipPlans/Filters`
  - `Field/MembershipPlan/Search`
  - `Field/MembershipPlan/TypeFilter`
  - `Field/MembershipPlan/StatusFilter`
  - `Table/MembershipPlans/List`
  - `Column/MembershipPlan/Name`
  - `Column/MembershipPlan/Type`
  - `Column/MembershipPlan/Duration`
  - `Column/MembershipPlan/VisitLimit`
  - `Column/MembershipPlan/Status`
  - `Column/MembershipPlan/Actions`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 12 — Locker Keys Inventory

```text
Create the Locker Keys inventory page at `/app/locker-keys`.

Goal: let staff and administrators instantly understand key availability and exceptions.

Page header:
- Title “Locker keys”.
- Primary Button “Add key” for GYM_ADMIN.

Summary strip:
- Available, Issued, Lost, Damaged and Maintenance counts using compact Cards or segmented chips.

Filters:
- SearchField by key or locker number;
- branch Autocomplete;
- status Select.

Table columns:
- key number;
- locker number;
- branch;
- status Chip with icon and text;
- assigned client when issued;
- active visit start when issued;
- updated at;
- Actions Dropdown.

Selecting a row opens Key Details Drawer.
Use status semantics: Available green, Issued blue, Lost red, Damaged/Maintenance amber, Deactivated gray, always with text labels.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-KEY-001`.
- Root Figma frame name: `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`.
- Route: `/app/locker-keys`.
- Frontend page component: `LockerKeysPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/locker-keys/page.tsx`.
- Feature boundary: `features/locker-keys`.
- Related stories: `KEY-01..03, INCIDENT-01..02`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Action/LockerKey/Add`
  - `Toolbar/LockerKeys/Filters`
  - `Field/LockerKey/Search`
  - `Field/LockerKey/StatusFilter`
  - `Field/LockerKey/BranchFilter`
  - `Table/LockerKeys/List`
  - `Column/LockerKey/Number`
  - `Column/LockerKey/Locker`
  - `Column/LockerKey/Status`
  - `Column/LockerKey/AssignedClient`
  - `Column/LockerKey/IssuedAt`
  - `Column/LockerKey/Actions`
  - `Component/GymOps/LockerKeyStatusChip`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 13 — Reception

```text
Create the main EMPLOYEE Reception page at `/app/reception` for the Podil branch.

This is the most important operational screen. Optimize for speed, keyboard use and clarity while a client is waiting.

Layout:
- Branch context at the top, read-only when only one branch is assigned.
- Left/main column: large client SearchField and search results.
- Right column: quick checkout by key and key availability summary.
- Bottom section: active visits preview.

Client search:
- placeholder “Search client by name, phone, email or ID”.
- Show one selected client result Card for Olena Kovalenko with contact data, ACTIVE client Chip, ACTIVE membership Chip, remaining visits, last visit and active visit warning.
- Primary Button “Check in”.

Quick checkout Card:
- Key number TextField or ComboBox;
- primary Button “Continue”;
- helper text that the key identifies the active visit.

Key availability:
- available and issued counts;
- warning Alert when no keys are available.

Active visits preview Table:
- client, key, start, duration and warning.
- secondary link “View all active visits”.

Include search loading, no client results, blocked client, expired membership, already active and network error states. Keep primary focus on client search.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-REC-001`.
- Root Figma frame name: `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`.
- Route: `/app/reception`.
- Frontend page component: `ReceptionPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/reception/page.tsx`.
- Feature boundary: `features/reception`.
- Related stories: `CLIENT-02, MEMBERSHIP-02, VISIT-01..07`.
- Required semantic Figma child layer names:
  - `Layout/ReceptionShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/BranchSelector`
  - `Section/Reception/ClientSearch`
  - `Field/Reception/ClientSearch`
  - `Component/GymOps/ClientSearchResultCard`
  - `Component/GymOps/MembershipEligibilityPanel`
  - `Action/Visit/OpenCheckIn`
  - `Section/Reception/QuickCheckout`
  - `Field/Reception/LockerKeySearch`
  - `Action/Visit/OpenCheckout`
  - `Section/Reception/ActiveVisitsPreview`
  - `Table/Visits/ActivePreview`
  - `Feedback/Reception/OperationAlert`
- Required screen/state variants:
  - `Default`
  - `Searching`
  - `ClientFound`
  - `NoResults`
  - `MembershipBlocked`
  - `ClientAlreadyActive`
  - `KeyConflict`
  - `NetworkUncertain`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 14 — Active Visits

```text
Create the Active Visits page at `/app/active-visits`.

Goal: monitor everyone currently training and resolve long-running or key-related exceptions.

Page header:
- Title “Active visits”.
- Primary Button “Check out by key”.

Top Alert:
- show count of long-running visits with a filter action.

Filters:
- branch Autocomplete;
- client SearchField;
- duration warning Select: All, Normal, Long-running.

Table columns:
- client;
- key number;
- locker number;
- branch;
- started at;
- live current duration;
- membership;
- check-in employee;
- warning status Chip;
- actions.

Actions:
- View visit;
- Check out;
- Report lost key;
- Report damaged key;
- Correct visit for GYM_ADMIN.

Selecting a row opens Visit Details Drawer. Use sticky header, live duration emphasis without animation noise, pagination and empty/loading/error states.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-VISIT-001`.
- Root Figma frame name: `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`.
- Route: `/app/active-visits`.
- Frontend page component: `ActiveVisitsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/active-visits/page.tsx`.
- Feature boundary: `features/visits`.
- Related stories: `VISIT-05..10`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Toolbar/ActiveVisits/Filters`
  - `Field/Visit/ClientSearch`
  - `Field/Visit/DurationFilter`
  - `Field/Visit/BranchFilter`
  - `Table/Visits/Active`
  - `Column/Visit/Client`
  - `Column/Visit/Membership`
  - `Column/Visit/LockerKey`
  - `Column/Visit/StartedAt`
  - `Column/Visit/Duration`
  - `Column/Visit/CheckInEmployee`
  - `Column/Visit/Actions`
  - `Component/GymOps/VisitStatusChip`
  - `Action/Visit/Checkout`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `LongRunning`
  - `Conflict`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 15 — Incidents List

```text
Create the Incidents page at `/app/incidents`.

Goal: find, review and resolve operational problems such as lost keys or incorrect assignments.

Page header:
- Title “Incidents”.
- Primary Button “Report incident”.

Filters:
- SearchField by incident ID, client or key;
- incident type Select;
- status Select;
- branch Autocomplete;
- DateRangePicker.

Table columns:
- incident ID;
- type;
- client;
- key;
- visit;
- branch;
- status Chip;
- reported by;
- reported at;
- resolved at;
- actions.

Selecting a row opens Incident Details Drawer.
Emphasize unresolved incidents while keeping resolved rows readable. Include empty, no-results, loading and service error states.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-INCIDENT-001`.
- Root Figma frame name: `Screen/SCR-INCIDENT-001/Operations/Incidents/Desktop/Default`.
- Route: `/app/incidents`.
- Frontend page component: `IncidentsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/incidents/page.tsx`.
- Feature boundary: `features/incidents`.
- Related stories: `INCIDENT-01..03`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Action/Incident/Report`
  - `Toolbar/Incidents/Filters`
  - `Field/Incident/Search`
  - `Field/Incident/TypeFilter`
  - `Field/Incident/StatusFilter`
  - `Field/Incident/DateRange`
  - `Table/Incidents/List`
  - `Column/Incident/Type`
  - `Column/Incident/Client`
  - `Column/Incident/LockerKey`
  - `Column/Incident/ReportedBy`
  - `Column/Incident/CreatedAt`
  - `Column/Incident/Status`
  - `Column/Incident/Actions`
  - `Component/GymOps/IncidentStatusChip`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 16 — Audit Log

```text
Create the immutable Audit Log page for GYM_ADMIN at `/app/audit` and make the same design reusable for SUPER_ADMIN at `/super-admin/audit`.

Goal: investigate who changed what, when and in which branch.

Filters:
- DateRangePicker;
- actor Autocomplete;
- entity type Select;
- event type Autocomplete;
- branch Autocomplete;
- correlation ID SearchField.

Table columns:
- timestamp;
- actor;
- event type;
- entity type;
- entity ID;
- branch;
- result Chip;
- correlation ID;
- details action.

Selecting a row opens Audit Details Drawer.
No create, edit or delete actions. Use compact monospace style only for IDs and correlation IDs. Include UTC/local timezone clarity and a persistent read-only/immutable label.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-AUDIT-001`.
- Root Figma frame name: `Screen/SCR-AUDIT-001/Admin/AuditLog/Desktop/Default`.
- Route: `/app/audit | /super-admin/audit`.
- Frontend page component: `AuditLogPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/audit/page.tsx`.
- Feature boundary: `features/audit`.
- Related stories: `AUDIT-01..02`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Toolbar/Audit/Filters`
  - `Field/Audit/Search`
  - `Field/Audit/ActorFilter`
  - `Field/Audit/ActionFilter`
  - `Field/Audit/EntityFilter`
  - `Field/Audit/DateRange`
  - `Table/Audit/Events`
  - `Column/Audit/Timestamp`
  - `Column/Audit/Actor`
  - `Column/Audit/Action`
  - `Column/Audit/Entity`
  - `Column/Audit/Branch`
  - `Column/Audit/CorrelationId`
  - `Column/Audit/Actions`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 17 — Reports Landing

```text
Create the Reports landing page at `/app/reports`.

Goal: give GYM_ADMIN a simple entry point to three operational reports.

Page header:
- Title “Reports”.
- Reporting freshness Chip: Fresh.
- Last updated timestamp.
- Refresh secondary Button.

Content:
- three equal Cards with icon, title, concise description and “Open report” action:
  1. Daily visits;
  2. Key status;
  3. Employee activity.
- Small Alert variant showing delayed reporting data.

Do not add charts. Keep the page calm and sparse, with a clear relationship to the wider GymOps shell.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-REPORT-001`.
- Root Figma frame name: `Screen/SCR-REPORT-001/GymAdmin/ReportsLanding/Desktop/Default`.
- Route: `/app/reports`.
- Frontend page component: `ReportsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/reports/page.tsx`.
- Feature boundary: `features/reports`.
- Related stories: `REPORT-01..03`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Section/Reports/Catalog`
  - `Component/GymOps/ReportCard/DailyVisits`
  - `Component/GymOps/ReportCard/KeyStatus`
  - `Component/GymOps/ReportCard/EmployeeActivity`
  - `Component/GymOps/ConsistencyStatusIndicator`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Error`
  - `DataUpdating`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 18 — Daily Visits Report

```text
Create the Daily Visits Report page at `/app/reports/daily-visits`.

Header:
- Breadcrumbs Reports / Daily visits;
- Title;
- Freshness Chip and last updated time;
- Refresh Button.

Filters:
- DatePicker;
- branch Autocomplete;
- Checkbox “Include active visits”;
- visible timezone indicator.

Summary Cards:
- total visits;
- completed;
- active;
- average duration;
- corrections;
- incidents.

Use Tabs for Summary and Details.
Summary tab:
- simple visits-by-hour horizontal bars built as lightweight report visualization;
- visits-by-branch table or bars.
Details tab:
- Table with client, branch, start, finish, duration, status, key and correction indicator.

Include Fresh, Updating and Delayed reporting states. Avoid decorative charts and keep exact data readable.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-REPORT-002`.
- Root Figma frame name: `Screen/SCR-REPORT-002/GymAdmin/DailyVisitsReport/Desktop/Default`.
- Route: `/app/reports/daily-visits`.
- Frontend page component: `DailyVisitsReportPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/reports/daily-visits/page.tsx`.
- Feature boundary: `features/reports`.
- Related stories: `REPORT-01, EVENT-02`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/ReportFilterBar`
  - `Field/Report/DateRange`
  - `Field/Report/BranchFilter`
  - `Action/Report/ApplyFilters`
  - `Section/Report/Summary`
  - `Component/GymOps/MetricCard/VisitCount`
  - `Component/GymOps/MetricCard/AverageDuration`
  - `Component/GymOps/MetricCard/PeakOccupancy`
  - `Chart/Report/VisitsByHour`
  - `Table/Report/DailyVisits`
  - `Component/GymOps/ConsistencyStatusIndicator`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `Error`
  - `DataUpdating`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 19 — Key Status Report

```text
Create the Key Status Report page at `/app/reports/key-status`.

Header:
- Breadcrumbs;
- title;
- freshness Chip;
- last updated timestamp;
- Refresh Button.

Filters:
- branch Autocomplete;
- status Select;
- optional snapshot date/time control shown as disabled or post-MVP.

Summary Cards:
- Available;
- Issued;
- Lost;
- Damaged;
- Maintenance;
- Deactivated.

Table columns:
- key;
- locker;
- branch;
- status Chip;
- current client;
- current visit;
- status changed at.

Use no pie chart. The design should make exceptions—lost, damaged and maintenance—easy to locate.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-REPORT-003`.
- Root Figma frame name: `Screen/SCR-REPORT-003/GymAdmin/KeyStatusReport/Desktop/Default`.
- Route: `/app/reports/key-status`.
- Frontend page component: `KeyStatusReportPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/reports/key-status/page.tsx`.
- Feature boundary: `features/reports`.
- Related stories: `REPORT-02, EVENT-02`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/ReportFilterBar`
  - `Field/Report/DateRange`
  - `Field/Report/BranchFilter`
  - `Section/Report/Summary`
  - `Component/GymOps/MetricCard/AvailableKeys`
  - `Component/GymOps/MetricCard/IssuedKeys`
  - `Component/GymOps/MetricCard/LostKeys`
  - `Component/GymOps/MetricCard/DamagedKeys`
  - `Chart/Report/KeyStatusDistribution`
  - `Table/Report/KeyStatus`
  - `Component/GymOps/ConsistencyStatusIndicator`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `Error`
  - `DataUpdating`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 20 — Employee Activity Report

```text
Create the Employee Activity Report page at `/app/reports/employee-activity`.

Filters:
- DateRangePicker;
- branch Autocomplete;
- employee Autocomplete;
- action type Select.

Summary Cards:
- check-ins;
- check-outs;
- corrections;
- incidents created;
- optional average actions per shift.

Table columns:
- employee with Avatar initials;
- branch;
- check-ins;
- check-outs;
- corrections;
- incidents;
- last action.

Add reporting freshness Chip and Refresh Button. Prioritize neutral operational reporting; do not gamify employee performance or use ranking trophies.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-REPORT-004`.
- Root Figma frame name: `Screen/SCR-REPORT-004/GymAdmin/EmployeeActivityReport/Desktop/Default`.
- Route: `/app/reports/employee-activity`.
- Frontend page component: `EmployeeActivityReportPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/reports/employee-activity/page.tsx`.
- Feature boundary: `features/reports`.
- Related stories: `REPORT-03, EVENT-02`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/ReportFilterBar`
  - `Field/Report/DateRange`
  - `Field/Report/BranchFilter`
  - `Field/Report/EmployeeFilter`
  - `Section/Report/Summary`
  - `Component/GymOps/MetricCard/CheckIns`
  - `Component/GymOps/MetricCard/CheckOuts`
  - `Component/GymOps/MetricCard/Corrections`
  - `Component/GymOps/MetricCard/Incidents`
  - `Table/Report/EmployeeActivity`
  - `Component/GymOps/ConsistencyStatusIndicator`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `Error`
  - `DataUpdating`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 21 — Organization Settings

```text
Create the GYM_ADMIN Organization Settings page at `/app/settings/organization`.

Use HeroUI Tabs:
- General;
- Operations;
- Access, shown as limited placeholder if not in MVP.

General form fields:
- organization display name;
- default timezone Autocomplete;
- contact email;
- contact phone.

Operations section:
- concise informational Cards for default policies;
- placeholders for long-running visit defaults and manual time override policy, clearly marked as branch-level where applicable.

Actions:
- primary Save changes;
- tertiary Cancel or Reset.

Show unsaved changes state, inline validation, successful save Toast and service error Alert. No billing or payment settings.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-SETTINGS-001`.
- Root Figma frame name: `Screen/SCR-SETTINGS-001/GymAdmin/OrganizationSettings/Desktop/Default`.
- Route: `/app/settings/organization`.
- Frontend page component: `OrganizationSettingsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/settings/organization/page.tsx`.
- Feature boundary: `features/settings`.
- Related stories: `ORG-02, NFR-03`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Form/OrganizationSettings`
  - `Field/Organization/Name`
  - `Field/Organization/Timezone`
  - `Field/Organization/ContactEmail`
  - `Field/Organization/Phone`
  - `Action/Organization/SaveSettings`
  - `Feedback/Settings/SaveStatus`
- Required screen/state variants:
  - `Default`
  - `Dirty`
  - `Saving`
  - `Saved`
  - `ValidationError`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 22 — Branch Settings

```text
Create the Branch Settings page at `/app/settings/branches/[branchId]` for the Podil branch.

Header:
- Breadcrumbs Settings / Branches / Podil;
- title “Podil branch”.
- ACTIVE Chip.

Form sections:
1. Branch details: name, code, address, timezone, email, phone.
2. Operations: long-running visit threshold NumberField with hours, manual time override policy Select, short explanatory helper text.
3. Status: read-only active state with a separate danger action for deactivation.

Use HeroUI Form, TextField, TextArea, Autocomplete, NumberField, Select, Alert and Buttons.
Keep Save changes as the only primary action.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-SETTINGS-002`.
- Root Figma frame name: `Screen/SCR-SETTINGS-002/GymAdmin/BranchSettings/Desktop/Default`.
- Route: `/app/settings/branches/[branchId]`.
- Frontend page component: `BranchSettingsPage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/settings/branches/[branchId]/page.tsx`.
- Feature boundary: `features/settings`.
- Related stories: `BRANCH-01..02`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Form/BranchSettings`
  - `Field/Branch/Name`
  - `Field/Branch/Address`
  - `Field/Branch/Timezone`
  - `Field/Branch/Phone`
  - `Field/Branch/Status`
  - `Action/Branch/SaveSettings`
  - `Feedback/Settings/SaveStatus`
- Required screen/state variants:
  - `Default`
  - `Dirty`
  - `Saving`
  - `Saved`
  - `ValidationError`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 23 — Staff Profile

```text
Create the staff Profile page at `/app/profile`.

Header:
- title “Profile”.
- Avatar with initials and current role Chip.

Use Tabs:
- Personal details;
- Security.

Personal details form:
- first name;
- last name;
- email read-only;
- phone;
- role read-only;
- organization read-only;
- branch assignments shown as read-only chips.

Security tab:
- compact change password form, visually marked optional/post-MVP if not implemented.

Use clear save feedback and do not expose permission editing on this page.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-PROFILE-001`.
- Root Figma frame name: `Screen/SCR-PROFILE-001/Staff/Profile/Desktop/Default`.
- Route: `/app/profile`.
- Frontend page component: `StaffProfilePage`.
- Target frontend file: `apps/frontend/src/app/(staff)/app/profile/page.tsx`.
- Feature boundary: `features/profile`.
- Related stories: `AUTH-02, NFR-03`.
- Required semantic Figma child layer names:
  - `Layout/StaffAppShell`
  - `Component/GymOps/PageHeader`
  - `Component/GymOps/UserProfileCard`
  - `Section/Profile/Account`
  - `Section/Profile/Assignments`
  - `Action/Auth/Logout`
  - `Action/Profile/ChangePassword`
  - `Feedback/Profile/SessionInfo`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 24 — Client Portal Login

```text
Create the optional post-MVP Client Portal login page at `/portal/login`.

Use a simplified GymOps client-facing identity distinct from the staff shell but visually related.

Layout:
- centered authentication Card on a light background;
- subtle Northstar Fitness name and GymOps-powered label;
- heading “Member sign in”.

Fields:
- email, phone or member ID;
- password;
- show/hide password.

Actions:
- primary Sign in;
- tertiary Forgot password.

Do not show staff navigation, organization administration or internal terminology. Include invalid credentials, blocked portal access and service unavailable states.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-PORTAL-001`.
- Root Figma frame name: `Screen/SCR-PORTAL-001/ClientPortal/Login/Mobile/Default`.
- Route: `/portal/login`.
- Frontend page component: `ClientPortalLoginPage`.
- Target frontend file: `apps/frontend/src/app/(portal)/portal/login/page.tsx`.
- Feature boundary: `features/client-portal`.
- Related stories: `PORTAL-01`.
- Required semantic Figma child layer names:
  - `Layout/PortalAuthShell`
  - `Section/PortalLoginCard`
  - `Form/PortalLoginForm`
  - `Field/Portal/Email`
  - `Field/Portal/Password`
  - `Action/Portal/SignIn`
  - `Feedback/Portal/LoginAlert`
- Required screen/state variants:
  - `Default`
  - `Submitting`
  - `InvalidCredentials`
  - `Blocked`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 25 — Client Portal Dashboard

```text
Create the optional Client Portal Dashboard at `/portal/dashboard` for Olena Kovalenko.

Use a simple client-facing shell with navigation: Overview, Visit history, Profile and Sign out.

Content:
- greeting and ACTIVE membership Chip;
- large membership Card showing Unlimited Monthly, start/end dates and branches;
- visits remaining Card or “Unlimited”;
- last visit Card;
- recent visits Table with date, branch, start, finish and duration;
- secondary Button “View all visits”.

Do not display staff names, internal notes, audit records, correction reasons or other clients.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-PORTAL-002`.
- Root Figma frame name: `Screen/SCR-PORTAL-002/ClientPortal/Dashboard/Mobile/Default`.
- Route: `/portal/dashboard`.
- Frontend page component: `ClientPortalDashboardPage`.
- Target frontend file: `apps/frontend/src/app/(portal)/portal/dashboard/page.tsx`.
- Feature boundary: `features/client-portal`.
- Related stories: `PORTAL-01..02`.
- Required semantic Figma child layer names:
  - `Layout/PortalShell`
  - `Component/GymOps/ClientPortalHeader`
  - `Component/GymOps/MembershipSummaryCard`
  - `Component/GymOps/MetricCard/VisitsRemaining`
  - `Section/Portal/RecentVisits`
  - `Action/Portal/ViewVisitHistory`
  - `Action/Auth/Logout`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `NoMembership`
  - `EmptyVisits`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## PROMPT 26 — Client Portal Visit History

```text
Create the optional Client Portal Visit History page at `/portal/visits`.

Filters:
- DateRangePicker;
- branch Select or Autocomplete.

Table columns:
- date;
- branch;
- start;
- finish;
- duration.

Use a clean responsive table, pagination, loading skeleton and friendly empty state. Do not show locker keys, staff members, internal visit status transitions, audit data or correction reasons.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `SCR-PORTAL-003`.
- Root Figma frame name: `Screen/SCR-PORTAL-003/ClientPortal/VisitHistory/Mobile/Default`.
- Route: `/portal/visits`.
- Frontend page component: `ClientVisitHistoryPage`.
- Target frontend file: `apps/frontend/src/app/(portal)/portal/visits/page.tsx`.
- Feature boundary: `features/client-portal`.
- Related stories: `PORTAL-02`.
- Required semantic Figma child layer names:
  - `Layout/PortalShell`
  - `Component/GymOps/PageHeader`
  - `Field/Portal/DateRange`
  - `List/Portal/VisitHistory`
  - `Component/GymOps/VisitHistoryCard`
  - `Component/GymOps/Pagination`
- Required screen/state variants:
  - `Default`
  - `Loading`
  - `Empty`
  - `NoResults`
  - `Error`
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

# 4. Prompts для modal dialogs, drawers та alert dialogs

## DIALOG 01 — Session Expired Modal

```text
Create a centered HeroUI Session Expired Modal shown over the existing staff application.

Content:
- small warning icon;
- heading “Your session has expired”;
- concise explanation that the user must sign in again;
- note that unsaved form data may be lost;
- primary Button “Sign in again”;
- optional tertiary “Cancel” only if a safe local draft remains.

The modal must trap focus, prevent interaction with the page and avoid exposing technical token details.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-AUTH-001`.
- Root Figma overlay name: `Overlay/OVL-AUTH-001/Auth/SessionExpired/Default`.
- Opened from UI IDs: `Global AppShell`.
- Frontend component: `SessionExpiredModal`.
- Target frontend file: `apps/frontend/src/features/auth/components/SessionExpiredModal.tsx`.
- Feature boundary: `features/auth`.
- Related stories: `AUTH-03`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Section/ModalHeader`
  - `Text/SessionExpired/Description`
  - `Action/Auth/SignInAgain`
  - `Action/Auth/Dismiss`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 02 — Create Organization Modal

```text
Create a HeroUI modal titled “Create organization”. Width about 640px, scrollable only if needed.

Fields:
- Display name, required;
- Legal name, required;
- Slug, required, lowercase helper text;
- Timezone Autocomplete, required;
- Status Select default Active;
- Contact email, optional;
- Contact phone, optional.

Use clear field labels, helper text, inline errors and a compact organization icon in the header.
Footer actions:
- tertiary Cancel;
- primary Create organization.

Also show the submitting state and a duplicate slug validation state.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-ORG-001`.
- Root Figma overlay name: `Overlay/OVL-ORG-001/Organization/Create/Default`.
- Opened from UI IDs: `SCR-ORG-001`.
- Frontend component: `CreateOrganizationModal`.
- Target frontend file: `apps/frontend/src/features/organizations/components/CreateOrganizationModal.tsx`.
- Feature boundary: `features/organizations`.
- Related stories: `ORG-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CreateOrganization`
  - `Field/Organization/Name`
  - `Field/Organization/Timezone`
  - `Field/Organization/ContactEmail`
  - `Field/Organization/Phone`
  - `Action/Organization/Create`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 03 — Edit Organization Modal

```text
Create a HeroUI modal titled “Edit organization” for Northstar Fitness.

Use the same fields as Create Organization, prefilled with realistic values. Show immutable organization ID as read-only text outside the form fields. Slug edits should include a warning that links or integrations may be affected.

Footer:
- tertiary Cancel;
- primary Save changes.

Show unsaved changes, validation errors and loading state. Do not include deactivation in this modal.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-ORG-002`.
- Root Figma overlay name: `Overlay/OVL-ORG-002/Organization/Edit/Default`.
- Opened from UI IDs: `SCR-ORG-001, SCR-ORG-002`.
- Frontend component: `EditOrganizationModal`.
- Target frontend file: `apps/frontend/src/features/organizations/components/EditOrganizationModal.tsx`.
- Feature boundary: `features/organizations`.
- Related stories: `ORG-02`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/EditOrganization`
  - `Field/Organization/Name`
  - `Field/Organization/Timezone`
  - `Field/Organization/ContactEmail`
  - `Field/Organization/Phone`
  - `Action/Organization/Save`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 04 — Deactivate Organization AlertDialog

```text
Create a destructive HeroUI AlertDialog titled “Deactivate Northstar Fitness?”.

Content:
- danger icon and clear consequence summary;
- affected branches count;
- affected staff count;
- warning that staff login and gym operations will be blocked;
- required TextArea labeled “Reason for deactivation”.

Footer:
- tertiary Cancel;
- danger Button “Deactivate organization”.

Do not use a simple confirmation checkbox as the only safeguard. Keep consequences visible.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-ORG-003`.
- Root Figma overlay name: `Overlay/OVL-ORG-003/Organization/Deactivate/Default`.
- Opened from UI IDs: `SCR-ORG-001, SCR-ORG-002`.
- Frontend component: `DeactivateOrganizationAlertDialog`.
- Target frontend file: `apps/frontend/src/features/organizations/components/DeactivateOrganizationAlertDialog.tsx`.
- Feature boundary: `features/organizations`.
- Related stories: `ORG-03`.
- Required semantic Figma child layer names:
  - `Overlay/AlertDialogRoot`
  - `Text/Organization/DeactivateImpact`
  - `Field/Confirmation/OrganizationName`
  - `Action/Organization/ConfirmDeactivate`
  - `Action/Overlay/Cancel`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 05 — Create Branch Modal

```text
Create a HeroUI modal titled “Add branch”.

Fields:
- Branch name;
- Branch code;
- Address TextArea;
- Timezone Autocomplete;
- Status Select default Active;
- Phone optional;
- Email optional.

Footer:
- Cancel;
- primary Add branch.

Include duplicate branch code validation and a concise timezone helper.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-BRANCH-001`.
- Root Figma overlay name: `Overlay/OVL-BRANCH-001/Branch/Create/Default`.
- Opened from UI IDs: `SCR-ORG-002`.
- Frontend component: `CreateBranchModal`.
- Target frontend file: `apps/frontend/src/features/branches/components/CreateBranchModal.tsx`.
- Feature boundary: `features/branches`.
- Related stories: `BRANCH-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CreateBranch`
  - `Field/Branch/Name`
  - `Field/Branch/Address`
  - `Field/Branch/Timezone`
  - `Field/Branch/Phone`
  - `Action/Branch/Create`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 06 — Edit Branch Modal

```text
Create a HeroUI modal titled “Edit branch” for Podil.

Prefilled fields:
- Branch name;
- Branch code;
- Address;
- Timezone;
- Status;
- Phone;
- Email.

Show branch ID read-only. Footer has Cancel and primary Save changes. Include an unsaved changes state. Do not include destructive deactivation inside this form.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-BRANCH-002`.
- Root Figma overlay name: `Overlay/OVL-BRANCH-002/Branch/Edit/Default`.
- Opened from UI IDs: `SCR-ORG-002, SCR-SETTINGS-002`.
- Frontend component: `EditBranchModal`.
- Target frontend file: `apps/frontend/src/features/branches/components/EditBranchModal.tsx`.
- Feature boundary: `features/branches`.
- Related stories: `BRANCH-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/EditBranch`
  - `Field/Branch/Name`
  - `Field/Branch/Address`
  - `Field/Branch/Timezone`
  - `Field/Branch/Phone`
  - `Action/Branch/Save`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 07 — Deactivate Branch AlertDialog

```text
Create a destructive HeroUI AlertDialog titled “Deactivate Podil branch?”.

Display:
- branch summary;
- active visits count;
- issued keys count;
- blocking Alert if active visits or issued keys exist;
- required reason TextArea when deactivation is allowed.

If blocked, disable the danger action and provide a secondary link to Active visits. If allowed, show Cancel and danger “Deactivate branch”.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-BRANCH-003`.
- Root Figma overlay name: `Overlay/OVL-BRANCH-003/Branch/Deactivate/Default`.
- Opened from UI IDs: `SCR-ORG-002, SCR-SETTINGS-002`.
- Frontend component: `DeactivateBranchAlertDialog`.
- Target frontend file: `apps/frontend/src/features/branches/components/DeactivateBranchAlertDialog.tsx`.
- Feature boundary: `features/branches`.
- Related stories: `BRANCH-02`.
- Required semantic Figma child layer names:
  - `Overlay/AlertDialogRoot`
  - `Text/Branch/DeactivateImpact`
  - `Action/Branch/ConfirmDeactivate`
  - `Action/Overlay/Cancel`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 08 — Create Gym Admin Modal

```text
Create a HeroUI modal titled “Add gym admin”.

Fields:
- First name;
- Last name;
- Email;
- Phone optional;
- Organization read-only: Northstar Fitness;
- Role read-only Chip: GYM_ADMIN;
- Invitation mode RadioGroup: Generate temporary password, Send invitation;
- Temporary password field shown conditionally with generate/regenerate control.

Footer:
- Cancel;
- primary Add gym admin.

Include duplicate email validation and a safe success state explaining how access details are delivered.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-STAFF-001`.
- Root Figma overlay name: `Overlay/OVL-STAFF-001/Staff/CreateGymAdmin/Default`.
- Opened from UI IDs: `SCR-ORG-002`.
- Frontend component: `CreateGymAdminModal`.
- Target frontend file: `apps/frontend/src/features/staff/components/CreateGymAdminModal.tsx`.
- Feature boundary: `features/staff`.
- Related stories: `STAFF-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CreateGymAdmin`
  - `Field/Staff/FirstName`
  - `Field/Staff/LastName`
  - `Field/Staff/Email`
  - `Field/Staff/Phone`
  - `Field/Staff/Organization`
  - `Field/Staff/BranchAssignments`
  - `Action/Staff/CreateGymAdmin`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 09 — Create Employee Modal

```text
Create a HeroUI modal titled “Add employee”.

Fields:
- First name;
- Last name;
- Email;
- Phone optional;
- Role read-only Chip EMPLOYEE;
- Branch assignments multi-select Autocomplete, at least one required;
- temporary access section consistent with the staff invitation pattern.

Footer: Cancel and primary Add employee.
Show branch validation and duplicate email state.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-STAFF-002`.
- Root Figma overlay name: `Overlay/OVL-STAFF-002/Staff/CreateEmployee/Default`.
- Opened from UI IDs: `SCR-STAFF-001`.
- Frontend component: `CreateEmployeeModal`.
- Target frontend file: `apps/frontend/src/features/staff/components/CreateEmployeeModal.tsx`.
- Feature boundary: `features/staff`.
- Related stories: `STAFF-02`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CreateEmployee`
  - `Field/Staff/FirstName`
  - `Field/Staff/LastName`
  - `Field/Staff/Email`
  - `Field/Staff/Phone`
  - `Field/Staff/Role`
  - `Field/Staff/BranchAssignments`
  - `Action/Staff/CreateEmployee`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 10 — Edit Employee Modal

```text
Create a HeroUI modal titled “Edit employee” for Iryna Melnyk.

Prefilled fields:
- First name;
- Last name;
- Email;
- Phone;
- Role read-only EMPLOYEE;
- Branch assignments multi-select;
- Status Select.

Show organization read-only. Footer: Cancel and primary Save changes. Include warning when removing the current branch assignment while the employee has an active session.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-STAFF-003`.
- Root Figma overlay name: `Overlay/OVL-STAFF-003/Staff/EditEmployee/Default`.
- Opened from UI IDs: `SCR-STAFF-001, DRW-STAFF-001`.
- Frontend component: `EditEmployeeModal`.
- Target frontend file: `apps/frontend/src/features/staff/components/EditEmployeeModal.tsx`.
- Feature boundary: `features/staff`.
- Related stories: `STAFF-03`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/EditEmployee`
  - `Field/Staff/FirstName`
  - `Field/Staff/LastName`
  - `Field/Staff/Phone`
  - `Field/Staff/Role`
  - `Field/Staff/BranchAssignments`
  - `Field/Staff/Status`
  - `Action/Staff/SaveEmployee`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 11 — Deactivate Employee AlertDialog

```text
Create a destructive AlertDialog titled “Deactivate Iryna Melnyk?”.

Show employee email, role, branch assignments and warning that active sessions will be invalidated. Include reason TextArea according to audit policy.

Actions:
- Cancel;
- danger Deactivate employee.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-STAFF-004`.
- Root Figma overlay name: `Overlay/OVL-STAFF-004/Staff/Deactivate/Default`.
- Opened from UI IDs: `SCR-STAFF-001, DRW-STAFF-001`.
- Frontend component: `DeactivateEmployeeAlertDialog`.
- Target frontend file: `apps/frontend/src/features/staff/components/DeactivateEmployeeAlertDialog.tsx`.
- Feature boundary: `features/staff`.
- Related stories: `STAFF-04`.
- Required semantic Figma child layer names:
  - `Overlay/AlertDialogRoot`
  - `Text/Staff/DeactivateImpact`
  - `Action/Staff/ConfirmDeactivate`
  - `Action/Overlay/Cancel`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DRAWER 12 — Staff Details

```text
Create a right-side HeroUI Staff Details Drawer for Iryna Melnyk, approximately 480px wide.

Sections:
- identity with Avatar, name, email and phone;
- role and status Chips;
- organization;
- branch assignment Chips;
- created and updated timestamps;
- last login;
- recent audit events timeline.

Footer actions:
- secondary Edit;
- danger tertiary Deactivate.

Keep it read-only and preserve the Staff List behind the drawer.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `DRW-STAFF-001`.
- Root Figma overlay name: `Overlay/DRW-STAFF-001/Staff/Details/Default`.
- Opened from UI IDs: `SCR-STAFF-001`.
- Frontend component: `StaffDetailsDrawer`.
- Target frontend file: `apps/frontend/src/features/staff/components/StaffDetailsDrawer.tsx`.
- Feature boundary: `features/staff`.
- Related stories: `STAFF-03..04`.
- Required semantic Figma child layer names:
  - `Overlay/DrawerRoot`
  - `Section/Staff/Summary`
  - `Section/Staff/Assignments`
  - `Section/Staff/Activity`
  - `Action/Staff/Edit`
  - `Action/Staff/Deactivate`
  - `Action/Overlay/Close`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 13 — Create Client Modal

```text
Create a HeroUI modal titled “Add client”.

Fields:
- First name, required;
- Last name, required;
- Phone, conditionally required;
- Email, conditionally required;
- Home branch Autocomplete, optional;
- Date of birth DatePicker, optional;
- Internal notes TextArea, optional.

Requirement: at least phone or email must be provided. Add helper text saying notes are internal.
Footer: Cancel and primary Add client.
Show inline validation and a possible duplicate detection state before final creation.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-CLIENT-001`.
- Root Figma overlay name: `Overlay/OVL-CLIENT-001/Client/Create/Default`.
- Opened from UI IDs: `SCR-CLIENT-001, SCR-REC-001`.
- Frontend component: `CreateClientModal`.
- Target frontend file: `apps/frontend/src/features/clients/components/CreateClientModal.tsx`.
- Feature boundary: `features/clients`.
- Related stories: `CLIENT-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CreateClient`
  - `Field/Client/FirstName`
  - `Field/Client/LastName`
  - `Field/Client/Phone`
  - `Field/Client/Email`
  - `Field/Client/DateOfBirth`
  - `Field/Client/Notes`
  - `Action/Client/Create`
  - `Action/Overlay/Cancel`
  - `Feedback/Client/DuplicateWarning`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 14 — Edit Client Modal

```text
Create a HeroUI modal titled “Edit client” for Olena Kovalenko.

Prefill first name, last name, phone, email, home branch, date of birth, internal notes and Status Select.

Show client ID as read-only. Footer: Cancel and primary Save changes. Include unsaved changes and duplicate phone/email warning states. Do not show membership editing in this modal.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-CLIENT-002`.
- Root Figma overlay name: `Overlay/OVL-CLIENT-002/Client/Edit/Default`.
- Opened from UI IDs: `SCR-CLIENT-001, SCR-CLIENT-002`.
- Frontend component: `EditClientModal`.
- Target frontend file: `apps/frontend/src/features/clients/components/EditClientModal.tsx`.
- Feature boundary: `features/clients`.
- Related stories: `CLIENT-04`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/EditClient`
  - `Field/Client/FirstName`
  - `Field/Client/LastName`
  - `Field/Client/Phone`
  - `Field/Client/Email`
  - `Field/Client/DateOfBirth`
  - `Field/Client/Notes`
  - `Action/Client/Save`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 15 — Possible Duplicate Client Modal

```text
Create a HeroUI warning Modal titled “Possible duplicate client”.

Content:
- warning Alert explaining that similar clients were found;
- compact Table or stacked Cards showing two possible matches with name, phone, email, branch and status;
- visually emphasize the exact matching fields.

Actions:
- primary “Open existing client” for the strongest match;
- secondary “Create anyway” only for permitted roles;
- tertiary Cancel.

Do not make Create anyway the visually dominant action.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-CLIENT-003`.
- Root Figma overlay name: `Overlay/OVL-CLIENT-003/Client/PossibleDuplicate/Default`.
- Opened from UI IDs: `OVL-CLIENT-001`.
- Frontend component: `PossibleDuplicateClientModal`.
- Target frontend file: `apps/frontend/src/features/clients/components/PossibleDuplicateClientModal.tsx`.
- Feature boundary: `features/clients`.
- Related stories: `CLIENT-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Text/Client/DuplicateExplanation`
  - `List/Client/PossibleDuplicates`
  - `Action/Client/OpenExisting`
  - `Action/Client/CreateAnyway`
  - `Action/Overlay/Cancel`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 16 — Block Client AlertDialog

```text
Create a destructive AlertDialog titled “Block Olena Kovalenko?”.

Explain that the client will not be able to check in. Show current membership and any active visit. Require a reason TextArea. Optional Checkbox “Apply immediately” may be shown only if policy needs it.

Actions: Cancel and danger Block client.
If an active visit exists, show a blocking Alert and disable the action until resolved.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-CLIENT-004`.
- Root Figma overlay name: `Overlay/OVL-CLIENT-004/Client/Block/Default`.
- Opened from UI IDs: `SCR-CLIENT-001, SCR-CLIENT-002`.
- Frontend component: `BlockClientAlertDialog`.
- Target frontend file: `apps/frontend/src/features/clients/components/BlockClientAlertDialog.tsx`.
- Feature boundary: `features/clients`.
- Related stories: `CLIENT-05`.
- Required semantic Figma child layer names:
  - `Overlay/AlertDialogRoot`
  - `Field/Client/BlockReason`
  - `Text/Client/BlockImpact`
  - `Action/Client/ConfirmBlock`
  - `Action/Overlay/Cancel`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 17 — Unblock Client AlertDialog

```text
Create a confirmation AlertDialog titled “Unblock Olena Kovalenko?”.

Show the previous block reason and explain that membership eligibility will still be checked at check-in. Use a neutral confirmation style rather than danger.

Actions: Cancel and primary Unblock client.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-CLIENT-005`.
- Root Figma overlay name: `Overlay/OVL-CLIENT-005/Client/Unblock/Default`.
- Opened from UI IDs: `SCR-CLIENT-001, SCR-CLIENT-002`.
- Frontend component: `UnblockClientAlertDialog`.
- Target frontend file: `apps/frontend/src/features/clients/components/UnblockClientAlertDialog.tsx`.
- Feature boundary: `features/clients`.
- Related stories: `CLIENT-05`.
- Required semantic Figma child layer names:
  - `Overlay/AlertDialogRoot`
  - `Text/Client/UnblockImpact`
  - `Action/Client/ConfirmUnblock`
  - `Action/Overlay/Cancel`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 18 — Create Membership Plan Modal

```text
Create a HeroUI modal titled “Create membership plan”.

Fields:
- Name;
- Type Select: Unlimited, Visit limit, Single visit, Trial;
- Validity value NumberField;
- Validity unit Select: Days, Months;
- Visit limit NumberField shown conditionally;
- Allowed branches multi-select Autocomplete;
- Active Switch default on;
- Description TextArea optional.

Use progressive disclosure so visit limit appears only when relevant. Footer: Cancel and primary Create plan.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-PLAN-001`.
- Root Figma overlay name: `Overlay/OVL-PLAN-001/MembershipPlan/Create/Default`.
- Opened from UI IDs: `SCR-PLAN-001`.
- Frontend component: `CreateMembershipPlanModal`.
- Target frontend file: `apps/frontend/src/features/membership-plans/components/CreateMembershipPlanModal.tsx`.
- Feature boundary: `features/membership-plans`.
- Related stories: `PLAN-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CreateMembershipPlan`
  - `Field/MembershipPlan/Name`
  - `Field/MembershipPlan/Type`
  - `Field/MembershipPlan/DurationDays`
  - `Field/MembershipPlan/VisitLimit`
  - `Field/MembershipPlan/AllowedBranches`
  - `Field/MembershipPlan/IsActive`
  - `Action/MembershipPlan/Create`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 19 — Edit Membership Plan Modal

```text
Create a HeroUI modal titled “Edit membership plan” for Unlimited Monthly.

Use the same fields as Create Membership Plan, prefilled. Add a warning that changes apply to new assignments and must not silently alter historical membership snapshots.

Footer: Cancel and primary Save changes.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-PLAN-002`.
- Root Figma overlay name: `Overlay/OVL-PLAN-002/MembershipPlan/Edit/Default`.
- Opened from UI IDs: `SCR-PLAN-001`.
- Frontend component: `EditMembershipPlanModal`.
- Target frontend file: `apps/frontend/src/features/membership-plans/components/EditMembershipPlanModal.tsx`.
- Feature boundary: `features/membership-plans`.
- Related stories: `PLAN-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/EditMembershipPlan`
  - `Field/MembershipPlan/Name`
  - `Field/MembershipPlan/Type`
  - `Field/MembershipPlan/DurationDays`
  - `Field/MembershipPlan/VisitLimit`
  - `Field/MembershipPlan/AllowedBranches`
  - `Field/MembershipPlan/IsActive`
  - `Action/MembershipPlan/Save`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 20 — Assign Membership Modal

```text
Create a HeroUI modal titled “Assign membership” opened from Olena Kovalenko’s profile.

Read-only client summary at the top.
Fields:
- Membership plan Autocomplete;
- Start date DatePicker;
- calculated End date read-only with optional policy override indicator;
- Allowed visits NumberField only for limited plans;
- Allowed branches read-only from plan or controlled override;
- Notes optional.

Show warnings for overlapping membership, blocked client, inactive plan and invalid dates.
Footer: Cancel and primary Assign membership.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-MEM-001`.
- Root Figma overlay name: `Overlay/OVL-MEM-001/Membership/Assign/Default`.
- Opened from UI IDs: `SCR-CLIENT-002`.
- Frontend component: `AssignMembershipModal`.
- Target frontend file: `apps/frontend/src/features/memberships/components/AssignMembershipModal.tsx`.
- Feature boundary: `features/memberships`.
- Related stories: `MEMBERSHIP-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/AssignMembership`
  - `Field/Membership/Plan`
  - `Field/Membership/StartDate`
  - `Field/Membership/EndDate`
  - `Field/Membership/VisitLimitOverride`
  - `Field/Membership/AllowedBranches`
  - `Action/Membership/Assign`
  - `Action/Overlay/Cancel`
  - `Feedback/Membership/OverlapWarning`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 21 — Freeze Membership Modal

```text
Create a HeroUI modal titled “Freeze membership”.

Show client and membership summary.
Fields:
- Freeze start date;
- Freeze end date;
- Reason TextArea required.

Include a read-only policy explanation showing whether the membership end date will shift. Show the calculated new end date when relevant.
Footer: Cancel and primary Freeze membership.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-MEM-002`.
- Root Figma overlay name: `Overlay/OVL-MEM-002/Membership/Freeze/Default`.
- Opened from UI IDs: `SCR-CLIENT-002`.
- Frontend component: `FreezeMembershipModal`.
- Target frontend file: `apps/frontend/src/features/memberships/components/FreezeMembershipModal.tsx`.
- Feature boundary: `features/memberships`.
- Related stories: `MEMBERSHIP-03`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/FreezeMembership`
  - `Field/Membership/FreezeStart`
  - `Field/Membership/FreezeEnd`
  - `Field/Membership/FreezeReason`
  - `Action/Membership/ConfirmFreeze`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 22 — Cancel Membership AlertDialog

```text
Create a destructive AlertDialog titled “Cancel membership?”.

Show client, plan, current status and remaining visits. Fields:
- cancellation date;
- required cancellation reason.

Explain that payment/refund handling is outside GymOps MVP. Actions: Cancel and danger Cancel membership.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-MEM-003`.
- Root Figma overlay name: `Overlay/OVL-MEM-003/Membership/Cancel/Default`.
- Opened from UI IDs: `SCR-CLIENT-002`.
- Frontend component: `CancelMembershipAlertDialog`.
- Target frontend file: `apps/frontend/src/features/memberships/components/CancelMembershipAlertDialog.tsx`.
- Feature boundary: `features/memberships`.
- Related stories: `MEMBERSHIP-01..03`.
- Required semantic Figma child layer names:
  - `Overlay/AlertDialogRoot`
  - `Field/Membership/CancelReason`
  - `Text/Membership/CancelImpact`
  - `Action/Membership/ConfirmCancel`
  - `Action/Overlay/Cancel`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 23 — Add Locker Key Modal

```text
Create a HeroUI modal titled “Add locker key”.

Fields:
- Key number;
- Locker number;
- Branch Autocomplete;
- Initial status read-only Chip AVAILABLE;
- Notes optional.

Footer: Cancel and primary Add key.
Include duplicate key number validation scoped to the selected branch.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-KEY-001`.
- Root Figma overlay name: `Overlay/OVL-KEY-001/LockerKey/Add/Default`.
- Opened from UI IDs: `SCR-KEY-001`.
- Frontend component: `AddLockerKeyModal`.
- Target frontend file: `apps/frontend/src/features/locker-keys/components/AddLockerKeyModal.tsx`.
- Feature boundary: `features/locker-keys`.
- Related stories: `KEY-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/AddLockerKey`
  - `Field/LockerKey/Number`
  - `Field/LockerKey/LockerNumber`
  - `Field/LockerKey/Branch`
  - `Field/LockerKey/Notes`
  - `Action/LockerKey/Add`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 24 — Edit Locker Key Modal

```text
Create a HeroUI modal titled “Edit locker key” for K-017.

Prefilled fields:
- Key number;
- Locker number;
- Branch;
- Notes.

Show current status read-only and direct the user to a separate Change status action. Footer: Cancel and primary Save changes.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-KEY-002`.
- Root Figma overlay name: `Overlay/OVL-KEY-002/LockerKey/Edit/Default`.
- Opened from UI IDs: `SCR-KEY-001, DRW-KEY-001`.
- Frontend component: `EditLockerKeyModal`.
- Target frontend file: `apps/frontend/src/features/locker-keys/components/EditLockerKeyModal.tsx`.
- Feature boundary: `features/locker-keys`.
- Related stories: `KEY-01, KEY-03`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/EditLockerKey`
  - `Field/LockerKey/Number`
  - `Field/LockerKey/LockerNumber`
  - `Field/LockerKey/Notes`
  - `Action/LockerKey/Save`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 25 — Change Key Status Modal

```text
Create a HeroUI modal titled “Change key status” for key K-017.

Content:
- current status read-only Chip;
- linked client and active visit summary if the key is issued;
- New status Select containing only valid transitions;
- required Reason TextArea;
- concise consequence Alert that changes according to the selected status.

Footer: Cancel and primary or danger action depending on the target state.
Show an invalid transition backend error state without losing entered reason text.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-KEY-003`.
- Root Figma overlay name: `Overlay/OVL-KEY-003/LockerKey/ChangeStatus/Default`.
- Opened from UI IDs: `SCR-KEY-001, DRW-KEY-001`.
- Frontend component: `ChangeLockerKeyStatusModal`.
- Target frontend file: `apps/frontend/src/features/locker-keys/components/ChangeLockerKeyStatusModal.tsx`.
- Feature boundary: `features/locker-keys`.
- Related stories: `KEY-03`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/ChangeLockerKeyStatus`
  - `Field/LockerKey/NewStatus`
  - `Field/LockerKey/StatusReason`
  - `Text/LockerKey/StatusImpact`
  - `Action/LockerKey/ConfirmStatusChange`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DRAWER 26 — Locker Key Details

```text
Create a right-side HeroUI Locker Key Details Drawer for K-017, about 500px wide.

Header:
- key number, locker number and current status Chip.

Sections:
- branch;
- current assignment with Olena Kovalenko and linked active visit;
- status history timeline;
- incidents list;
- recent audit records.

Actions:
- secondary Edit key;
- secondary Change status;
- contextual Open visit or Open client.

Keep it read-only and preserve the inventory table context.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `DRW-KEY-001`.
- Root Figma overlay name: `Overlay/DRW-KEY-001/LockerKey/Details/Default`.
- Opened from UI IDs: `SCR-KEY-001`.
- Frontend component: `LockerKeyDetailsDrawer`.
- Target frontend file: `apps/frontend/src/features/locker-keys/components/LockerKeyDetailsDrawer.tsx`.
- Feature boundary: `features/locker-keys`.
- Related stories: `KEY-02..03`.
- Required semantic Figma child layer names:
  - `Overlay/DrawerRoot`
  - `Section/LockerKey/Summary`
  - `Section/LockerKey/CurrentAssignment`
  - `Section/LockerKey/History`
  - `Action/LockerKey/Edit`
  - `Action/LockerKey/ChangeStatus`
  - `Action/Overlay/Close`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 27 — Check-in Modal

```text
Create the critical GymOps Check-in Modal for Olena Kovalenko.

This operation must be extremely clear and fast.

Top content:
- client Card with name and contact;
- client ACTIVE Chip;
- membership eligibility area showing ACTIVE Unlimited Monthly, remaining visits and branch eligibility.

Fields:
- Branch read-only Podil;
- Locker key Autocomplete showing only available keys with key and locker number;
- Start date DatePicker default today;
- Start time TimeField default now;
- Manual time override Checkbox shown only to permitted roles;
- Notes optional.

Confirmation summary:
- client;
- branch;
- selected key;
- start time;
- membership consumption impact.

Footer:
- Cancel;
- primary Confirm check-in.

Design states:
- submitting;
- no available keys;
- membership expired/frozen/blocked;
- client already active;
- key became unavailable due to concurrency;
- network uncertainty after submit with a “Verify status” action.

Never silently retry in a way that could create a duplicate visit.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-VISIT-001`.
- Root Figma overlay name: `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`.
- Opened from UI IDs: `SCR-REC-001`.
- Frontend component: `CheckInModal`.
- Target frontend file: `apps/frontend/src/features/visits/components/CheckInModal.tsx`.
- Feature boundary: `features/visits`.
- Related stories: `MEMBERSHIP-02..04, VISIT-01..04`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CheckIn`
  - `Component/GymOps/ClientSummaryCard`
  - `Component/GymOps/MembershipEligibilityPanel`
  - `Field/Visit/StartTime`
  - `Field/Visit/LockerKey`
  - `Field/Visit/Notes`
  - `Section/Visit/ConfirmationSummary`
  - `Action/Visit/ConfirmCheckIn`
  - `Action/Overlay/Cancel`
  - `Feedback/Visit/CheckInError`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 28 — Check-in Success Modal

```text
Create a compact success Modal shown after check-in only when the key handoff summary must remain visible.

Display:
- success icon;
- heading “Check-in complete”;
- client Olena Kovalenko;
- large key number K-017;
- locker number 117;
- branch Podil;
- start time 18:42.

Actions:
- primary Done;
- secondary View active visit.

The key number must be the strongest visual element after the success heading. Avoid celebratory confetti.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-VISIT-002`.
- Root Figma overlay name: `Overlay/OVL-VISIT-002/Visit/CheckInSuccess/Default`.
- Opened from UI IDs: `OVL-VISIT-001`.
- Frontend component: `CheckInSuccessModal`.
- Target frontend file: `apps/frontend/src/features/visits/components/CheckInSuccessModal.tsx`.
- Feature boundary: `features/visits`.
- Related stories: `VISIT-01`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Feedback/Visit/SuccessIcon`
  - `Text/Visit/ClientName`
  - `Text/Visit/LockerKey`
  - `Text/Visit/StartTime`
  - `Action/Visit/ViewActiveVisits`
  - `Action/Visit/CheckInAnother`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 29 — Checkout by Key Modal

```text
Create the critical two-step Checkout by Key Modal.

Step 1 — Find key:
- branch read-only Podil;
- large key number TextField or ComboBox;
- primary Continue.

Step 2 — Confirm checkout:
- read-only summary with key K-017, client Olena Kovalenko, visit start 18:42, live duration, membership and check-in employee;
- Finish date default today;
- Finish time default now;
- Manual override shown conditionally;
- Notes optional.

Actions:
- tertiary Back or Cancel;
- secondary Report key problem;
- primary Confirm check-out.

Show states for key not found, available key without assignment, branch mismatch, already completed, concurrent checkout, invalid finish time and network uncertainty after submit. Preserve entered data on recoverable errors.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-VISIT-003`.
- Root Figma overlay name: `Overlay/OVL-VISIT-003/Visit/CheckoutByKey/Lookup`.
- Opened from UI IDs: `SCR-REC-001, SCR-VISIT-001`.
- Frontend component: `CheckoutByKeyModal`.
- Target frontend file: `apps/frontend/src/features/visits/components/CheckoutByKeyModal.tsx`.
- Feature boundary: `features/visits`.
- Related stories: `VISIT-06..07`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CheckoutLookup`
  - `Field/Visit/LockerKeyNumber`
  - `Action/Visit/FindActiveVisit`
  - `Section/Visit/CheckoutSummary`
  - `Text/Visit/ClientName`
  - `Text/Visit/StartedAt`
  - `Text/Visit/Duration`
  - `Field/Visit/CheckoutTime`
  - `Action/Visit/ConfirmCheckout`
  - `Action/Overlay/Cancel`
  - `Feedback/Visit/CheckoutError`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DRAWER 30 — Visit Details

```text
Create a right-side HeroUI Visit Details Drawer, approximately 560px wide.

Header:
- client name;
- ACTIVE or COMPLETED status Chip;
- visit ID with copy action.

Sections:
- client and link to profile;
- membership snapshot;
- branch;
- key assignment;
- start, end and duration;
- check-in and check-out employees;
- correction history;
- incidents;
- audit timeline.

Actions depend on state:
- primary Check out when active;
- secondary Correct visit for GYM_ADMIN;
- secondary Report incident;
- tertiary Open client profile.

Use Accordions for correction and audit detail. Preserve table context behind the drawer.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `DRW-VISIT-001`.
- Root Figma overlay name: `Overlay/DRW-VISIT-001/Visit/Details/Default`.
- Opened from UI IDs: `SCR-VISIT-001, SCR-CLIENT-002`.
- Frontend component: `VisitDetailsDrawer`.
- Target frontend file: `apps/frontend/src/features/visits/components/VisitDetailsDrawer.tsx`.
- Feature boundary: `features/visits`.
- Related stories: `VISIT-05..10, AUDIT-01`.
- Required semantic Figma child layer names:
  - `Overlay/DrawerRoot`
  - `Section/Visit/Summary`
  - `Section/Visit/Client`
  - `Section/Visit/MembershipSnapshot`
  - `Section/Visit/LockerKey`
  - `Section/Visit/AuditTimeline`
  - `Action/Visit/Checkout`
  - `Action/Visit/Correct`
  - `Action/Incident/Report`
  - `Action/Overlay/Close`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 31 — Correct Visit Modal

```text
Create a high-risk HeroUI modal titled “Correct visit”. Width about 720px.

Top:
- warning Alert that corrections are audited;
- Original values Card showing start, end, status, key and membership usage.

Editable fields:
- Start date;
- Start time;
- End date conditional;
- End time conditional;
- Visit status Select;
- Locker key Autocomplete conditional;
- Membership consumption adjustment RadioGroup or read-only policy result;
- Correction reason TextArea required;
- Override conflict Checkbox shown only with permission.

Show a side-by-side or clear before/after summary before submission.
Validation states:
- negative duration;
- key overlap;
- invalid state transition;
- missing reason.

Footer: Cancel and primary Save correction; use danger only if the selected action cancels the visit.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-VISIT-004`.
- Root Figma overlay name: `Overlay/OVL-VISIT-004/Visit/Correct/Default`.
- Opened from UI IDs: `DRW-VISIT-001`.
- Frontend component: `CorrectVisitModal`.
- Target frontend file: `apps/frontend/src/features/visits/components/CorrectVisitModal.tsx`.
- Feature boundary: `features/visits`.
- Related stories: `VISIT-09`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/CorrectVisit`
  - `Field/Visit/StartedAt`
  - `Field/Visit/FinishedAt`
  - `Field/Visit/LockerKey`
  - `Field/Visit/CorrectionReason`
  - `Section/Visit/OriginalValues`
  - `Section/Visit/UpdatedValues`
  - `Action/Visit/ConfirmCorrection`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 32 — Report Incident Modal

```text
Create a HeroUI modal titled “Report incident”.

Fields:
- Incident type Select: Lost key, Damaged key, Incorrect assignment, Client left with key, Other;
- Branch read-only or Autocomplete;
- Key ComboBox conditional;
- linked active visit summary conditional;
- linked client summary conditional;
- Action on visit RadioGroup conditional;
- Notes/reason TextArea required.

Use progressive disclosure: linked entities and visit actions appear after type/key selection.
Show a consequence Alert for Lost key explaining that the key will be marked LOST.
Footer: Cancel and primary Report incident.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-INC-001`.
- Root Figma overlay name: `Overlay/OVL-INC-001/Incident/Report/Default`.
- Opened from UI IDs: `SCR-REC-001, SCR-KEY-001, DRW-VISIT-001`.
- Frontend component: `ReportIncidentModal`.
- Target frontend file: `apps/frontend/src/features/incidents/components/ReportIncidentModal.tsx`.
- Feature boundary: `features/incidents`.
- Related stories: `INCIDENT-01..02`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/ReportIncident`
  - `Field/Incident/Type`
  - `Field/Incident/Client`
  - `Field/Incident/Visit`
  - `Field/Incident/LockerKey`
  - `Field/Incident/Description`
  - `Field/Incident/OccurredAt`
  - `Action/Incident/Report`
  - `Action/Overlay/Cancel`
  - `Feedback/Incident/ImpactWarning`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DRAWER 33 — Incident Details

```text
Create a right-side HeroUI Incident Details Drawer, about 520px wide.

Header:
- incident type;
- status Chip;
- incident ID.

Sections:
- linked client;
- linked visit;
- linked key;
- branch;
- reporter;
- original notes;
- created and resolved timestamps;
- resolution summary;
- audit timeline.

Actions:
- primary Resolve incident when open;
- contextual Open client, Open visit and Open key.

Keep the drawer read-only.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `DRW-INC-001`.
- Root Figma overlay name: `Overlay/DRW-INC-001/Incident/Details/Default`.
- Opened from UI IDs: `SCR-INCIDENT-001`.
- Frontend component: `IncidentDetailsDrawer`.
- Target frontend file: `apps/frontend/src/features/incidents/components/IncidentDetailsDrawer.tsx`.
- Feature boundary: `features/incidents`.
- Related stories: `INCIDENT-01..03`.
- Required semantic Figma child layer names:
  - `Overlay/DrawerRoot`
  - `Section/Incident/Summary`
  - `Section/Incident/RelatedClient`
  - `Section/Incident/RelatedVisit`
  - `Section/Incident/RelatedKey`
  - `Section/Incident/Timeline`
  - `Action/Incident/Resolve`
  - `Action/Overlay/Close`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DIALOG 34 — Resolve Incident Modal

```text
Create a HeroUI modal titled “Resolve incident”.

Show the incident summary at the top.
Fields:
- Resolution status Select;
- Key final status Select;
- Visit final action Select when still active;
- Resolution notes TextArea required;
- Recovered date and time optional.

Show dynamic consequence text based on final key and visit states.
Footer: Cancel and primary Resolve incident.
Include backend conflict state if the visit or key changed while the modal was open.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `OVL-INC-002`.
- Root Figma overlay name: `Overlay/OVL-INC-002/Incident/Resolve/Default`.
- Opened from UI IDs: `DRW-INC-001`.
- Frontend component: `ResolveIncidentModal`.
- Target frontend file: `apps/frontend/src/features/incidents/components/ResolveIncidentModal.tsx`.
- Feature boundary: `features/incidents`.
- Related stories: `INCIDENT-03`.
- Required semantic Figma child layer names:
  - `Overlay/ModalRoot`
  - `Form/ResolveIncident`
  - `Field/Incident/Resolution`
  - `Field/Incident/ResolutionNotes`
  - `Field/Incident/FinalKeyStatus`
  - `Action/Incident/ConfirmResolve`
  - `Action/Overlay/Cancel`
  - `Feedback/Form/ErrorSummary`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

## DRAWER 35 — Audit Details

```text
Create a right-side HeroUI Audit Details Drawer, about 600px wide.

Header:
- event type;
- success/failure Chip;
- timestamp in local time with UTC shown beneath.

Sections:
- actor;
- organization and branch;
- entity type and entity ID;
- reason;
- correlation ID with copy action;
- request/source metadata allowed by policy;
- old values Accordion with formatted read-only JSON;
- new values Accordion with formatted read-only JSON.

No edit or delete actions. Footer contains only Close and optional Copy correlation ID.

Implementation handoff contract — preserve these exact identifiers:
- UI ID: `DRW-AUDIT-001`.
- Root Figma overlay name: `Overlay/DRW-AUDIT-001/Audit/EventDetails/Default`.
- Opened from UI IDs: `SCR-AUDIT-001`.
- Frontend component: `AuditEventDetailsDrawer`.
- Target frontend file: `apps/frontend/src/features/audit/components/AuditEventDetailsDrawer.tsx`.
- Feature boundary: `features/audit`.
- Related stories: `AUDIT-01..02`.
- Required semantic Figma child layer names:
  - `Overlay/DrawerRoot`
  - `Section/Audit/Summary`
  - `Section/Audit/Actor`
  - `Section/Audit/Entity`
  - `Component/GymOps/AuditEventDiff`
  - `Text/Audit/CorrelationId`
  - `Text/Audit/RequestId`
  - `Action/Overlay/Close`
- Required overlay variants: `Default`, `Submitting`, `ValidationError`, `BusinessError`, and `Success` when applicable.
- Use component instances rather than detached copies.
- Use Auto Layout for every non-decorative container; do not flatten the screen or overlay.
- Use variables for color, spacing, radius and typography; do not use raw one-off values.
- Keep visible labels human-readable, but keep the semantic layer names above unchanged.
- Treat these names as the contract for Figma MCP, frontend implementation and story traceability.
```

---

## 5. Follow-up prompts після першої генерації

Використовувати ці короткі prompts через Point and edit лише для конкретного елемента:

### Покращення щільності таблиці

```text
Make this HeroUI table more efficient for daily operational work: reduce unnecessary vertical padding, keep 44px interactive targets, preserve readable line height, use a sticky header, align numeric values, keep row actions easy to reach, and do not reduce accessibility.
```

### Покращення форми

```text
Refine this HeroUI form using progressive disclosure. Keep only fields required for the primary task visible by default, preserve all validation and helper text, use one primary submit action, and improve keyboard navigation and focus order.
```

### Покращення operational page

```text
Make this screen faster for a reception employee using keyboard and tablet. Strengthen the primary task, reduce visual competition, keep exceptions visible, make search and primary actions reachable without scrolling, and preserve the existing GymOps design system.
```

### Додавання станів

```text
Add complete loading, empty, validation error, business rejection, concurrency conflict, and network uncertainty states to this screen. Reuse HeroUI Skeleton, Spinner, Alert, Toast and disabled action patterns. Do not change the page information architecture.
```

### Перевірка accessibility

```text
Audit this screen for accessibility. Add visible labels, logical heading order, visible keyboard focus, accessible names for icon buttons, 44px minimum targets, non-color status cues, correct modal focus trapping, and WCAG AA-minded contrast without changing the visual direction.
```

---

## 5.1. Mandatory normalization prompt after each Figma Make generation

Figma Make may not preserve every requested node name, component instance or variable binding automatically. Run this follow-up prompt after generating each page or overlay:

```text
Normalize the selected GymOps design for Figma MCP and frontend handoff.

Use the UI ID and implementation handoff contract from the original prompt.

Required actions:
1. Rename the root frame or overlay to the exact canonical Figma root name.
2. Rename all required semantic child layers exactly as specified.
3. Convert repeated elements into component instances; do not leave detached copies.
4. Apply Auto Layout to all structural containers.
5. Replace raw color, spacing, radius and typography values with the semantic variables from `ui-contract.md`.
6. Keep visible UI copy human-readable; do not expose internal UI IDs in the interface.
7. Add annotations containing route, story IDs, frontend component name, target file and relevant API endpoints.
8. Verify required Default, Loading, Empty, Error, ValidationError and business-conflict states.
9. Move the final frame to the `95 — Ready for Development` page.
10. Do not flatten the design or rename canonical UI IDs.

Return a short checklist of anything that could not be normalized automatically so it can be fixed manually.
```

> UI IDs and Figma node names are handoff metadata. They must not become visible product copy or default Playwright selectors.

## 6. Критерії приймання згенерованого дизайну

Кожний екран приймається, якщо:

1. Відповідає route, ролі та user stories із `ui-flows.md` і `requirements.md`.
2. Не додає непогоджених функцій або полів.
3. Використовує встановлений GymOps shell і HeroUI-патерни.
4. Має лише одну очевидну primary action у кожному контексті.
5. Основний флоу можна пройти без пояснення дизайнера.
6. Важливі status, errors та permissions зрозумілі не лише за кольором.
7. Є loading, empty, validation і service error states.
8. Critical operations мають submitting, concurrency та network uncertainty states.
9. Таблиці залишаються читабельними при реалістичних даних.
10. UI працездатний на 1440×1024 та 1024×768.
11. Modal, Drawer та AlertDialog мають правильну ієрархію дій.
12. Інтерфейс виглядає як легкий сучасний B2B SaaS, а не маркетинговий сайт або fitness landing page.
