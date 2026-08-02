# GymOps — Canonical UI Contract

## 1. Purpose

This document is the single source of truth connecting user stories, Figma Make, Figma MCP and the future frontend codebase.

> The frontend paths in this document are target contracts. They do not claim that the files already exist.

## 2. Traceability model

```text
Story ID -> UI ID -> Figma root -> route -> React component -> tests
```

Rules:

- UI IDs never change after implementation begins.
- Visible screen titles may change without changing UI IDs.
- Figma root node names and React component names are exact and case-sensitive.
- One screen state is a separate sibling frame or a documented component variant.
- Shared components are instances, never detached copies.

## 3. Figma node naming

| Node type          | Pattern                                              | Example                                                           |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Screen             | `Screen/<UI-ID>/<Role>/<Feature>/<Viewport>/<State>` | `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default` |
| Overlay            | `Overlay/<UI-ID>/<Domain>/<Action>/<State>`          | `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`                     |
| Reusable component | `Component/GymOps/<Name>`                            | `Component/GymOps/ClientSummaryCard`                              |
| HeroUI primitive   | `Component/HeroUI/<Name>`                            | `Component/HeroUI/Button`                                         |
| Field              | `Field/<Domain>/<Name>`                              | `Field/Client/Phone`                                              |
| Action             | `Action/<Domain>/<VerbObject>`                       | `Action/Visit/ConfirmCheckIn`                                     |
| Feedback           | `Feedback/<Domain>/<Name>`                           | `Feedback/Visit/CheckInError`                                     |

## 4. Screen registry

| UI ID              | Figma root                                                              | Route                                         | React component              | Target file                                                                         | Stories                                                     |
| ------------------ | ----------------------------------------------------------------------- | --------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `SCR-AUTH-001`     | `Screen/SCR-AUTH-001/Auth/StaffLogin/Desktop/Default`                   | `/login`                                      | `StaffLoginPage`             | `apps/frontend/src/app/(auth)/login/page.tsx`                                       | AUTH-01, AUTH-03                                            |
| `SCR-SYS-403`      | `Screen/SCR-SYS-403/System/Forbidden/Desktop/Default`                   | `/403`                                        | `ForbiddenPage`              | `apps/frontend/src/app/(system)/403/page.tsx`                                       | AUTH-04, AUTH-05                                            |
| `SCR-SYS-404`      | `Screen/SCR-SYS-404/System/NotFound/Desktop/Default`                    | `/404`                                        | `NotFoundPage`               | `apps/frontend/src/app/not-found.tsx`                                               | NFR-05                                                      |
| `SCR-PLATFORM-001` | `Screen/SCR-PLATFORM-001/SuperAdmin/PlatformDashboard/Desktop/Default`  | `/super-admin/dashboard`                      | `PlatformDashboardPage`      | `apps/frontend/src/app/(staff)/super-admin/dashboard/page.tsx`                      | ORG-01..03, BRANCH-01..02, NFR-06                           |
| `SCR-ORG-001`      | `Screen/SCR-ORG-001/SuperAdmin/OrganizationsList/Desktop/Default`       | `/super-admin/organizations`                  | `OrganizationsPage`          | `apps/frontend/src/app/(staff)/super-admin/organizations/page.tsx`                  | ORG-01..03                                                  |
| `SCR-ORG-002`      | `Screen/SCR-ORG-002/SuperAdmin/OrganizationDetails/Desktop/Overview`    | `/super-admin/organizations/[organizationId]` | `OrganizationDetailsPage`    | `apps/frontend/src/app/(staff)/super-admin/organizations/[organizationId]/page.tsx` | ORG-02..03, BRANCH-01..02, STAFF-01                         |
| `SCR-GYM-001`      | `Screen/SCR-GYM-001/GymAdmin/GymDashboard/Desktop/Default`              | `/app/dashboard`                              | `GymDashboardPage`           | `apps/frontend/src/app/(staff)/app/dashboard/page.tsx`                              | VISIT-05, REPORT-01..03                                     |
| `SCR-STAFF-001`    | `Screen/SCR-STAFF-001/GymAdmin/StaffList/Desktop/Default`               | `/app/staff`                                  | `StaffPage`                  | `apps/frontend/src/app/(staff)/app/staff/page.tsx`                                  | STAFF-01..04                                                |
| `SCR-CLIENT-001`   | `Screen/SCR-CLIENT-001/Staff/ClientsList/Desktop/Default`               | `/app/clients`                                | `ClientsPage`                | `apps/frontend/src/app/(staff)/app/clients/page.tsx`                                | CLIENT-01..05                                               |
| `SCR-CLIENT-002`   | `Screen/SCR-CLIENT-002/Staff/ClientProfile/Desktop/Overview`            | `/app/clients/[clientId]`                     | `ClientProfilePage`          | `apps/frontend/src/app/(staff)/app/clients/[clientId]/page.tsx`                     | CLIENT-03..05, MEMBERSHIP-01..03, VISIT-08, INCIDENT-01..03 |
| `SCR-PLAN-001`     | `Screen/SCR-PLAN-001/GymAdmin/MembershipPlans/Desktop/Default`          | `/app/membership-plans`                       | `MembershipPlansPage`        | `apps/frontend/src/app/(staff)/app/membership-plans/page.tsx`                       | PLAN-01                                                     |
| `SCR-KEY-001`      | `Screen/SCR-KEY-001/Operations/LockerKeys/Desktop/Default`              | `/app/locker-keys`                            | `LockerKeysPage`             | `apps/frontend/src/app/(staff)/app/locker-keys/page.tsx`                            | KEY-01..03, INCIDENT-01..02                                 |
| `SCR-REC-001`      | `Screen/SCR-REC-001/Reception/ReceptionWorkspace/Desktop/Default`       | `/app/reception`                              | `ReceptionPage`              | `apps/frontend/src/app/(staff)/app/reception/page.tsx`                              | CLIENT-02, MEMBERSHIP-02, VISIT-01..07                      |
| `SCR-VISIT-001`    | `Screen/SCR-VISIT-001/Operations/ActiveVisits/Desktop/Default`          | `/app/active-visits`                          | `ActiveVisitsPage`           | `apps/frontend/src/app/(staff)/app/active-visits/page.tsx`                          | VISIT-05..10                                                |
| `SCR-INCIDENT-001` | `Screen/SCR-INCIDENT-001/Operations/Incidents/Desktop/Default`          | `/app/incidents`                              | `IncidentsPage`              | `apps/frontend/src/app/(staff)/app/incidents/page.tsx`                              | INCIDENT-01..03                                             |
| `SCR-AUDIT-001`    | `Screen/SCR-AUDIT-001/Admin/AuditLog/Desktop/Default`                   | `/app/audit                                   | /super-admin/audit`          | `AuditLogPage`                                                                      | `apps/frontend/src/app/(staff)/app/audit/page.tsx`          | AUDIT-01..02 |
| `SCR-REPORT-001`   | `Screen/SCR-REPORT-001/GymAdmin/ReportsLanding/Desktop/Default`         | `/app/reports`                                | `ReportsPage`                | `apps/frontend/src/app/(staff)/app/reports/page.tsx`                                | REPORT-01..03                                               |
| `SCR-REPORT-002`   | `Screen/SCR-REPORT-002/GymAdmin/DailyVisitsReport/Desktop/Default`      | `/app/reports/daily-visits`                   | `DailyVisitsReportPage`      | `apps/frontend/src/app/(staff)/app/reports/daily-visits/page.tsx`                   | REPORT-01, EVENT-02                                         |
| `SCR-REPORT-003`   | `Screen/SCR-REPORT-003/GymAdmin/KeyStatusReport/Desktop/Default`        | `/app/reports/key-status`                     | `KeyStatusReportPage`        | `apps/frontend/src/app/(staff)/app/reports/key-status/page.tsx`                     | REPORT-02, EVENT-02                                         |
| `SCR-REPORT-004`   | `Screen/SCR-REPORT-004/GymAdmin/EmployeeActivityReport/Desktop/Default` | `/app/reports/employee-activity`              | `EmployeeActivityReportPage` | `apps/frontend/src/app/(staff)/app/reports/employee-activity/page.tsx`              | REPORT-03, EVENT-02                                         |
| `SCR-SETTINGS-001` | `Screen/SCR-SETTINGS-001/GymAdmin/OrganizationSettings/Desktop/Default` | `/app/settings/organization`                  | `OrganizationSettingsPage`   | `apps/frontend/src/app/(staff)/app/settings/organization/page.tsx`                  | ORG-02, NFR-03                                              |
| `SCR-SETTINGS-002` | `Screen/SCR-SETTINGS-002/GymAdmin/BranchSettings/Desktop/Default`       | `/app/settings/branches/[branchId]`           | `BranchSettingsPage`         | `apps/frontend/src/app/(staff)/app/settings/branches/[branchId]/page.tsx`           | BRANCH-01..02                                               |
| `SCR-PROFILE-001`  | `Screen/SCR-PROFILE-001/Staff/Profile/Desktop/Default`                  | `/app/profile`                                | `StaffProfilePage`           | `apps/frontend/src/app/(staff)/app/profile/page.tsx`                                | AUTH-02, NFR-03                                             |
| `SCR-PORTAL-001`   | `Screen/SCR-PORTAL-001/ClientPortal/Login/Mobile/Default`               | `/portal/login`                               | `ClientPortalLoginPage`      | `apps/frontend/src/app/(portal)/portal/login/page.tsx`                              | PORTAL-01                                                   |
| `SCR-PORTAL-002`   | `Screen/SCR-PORTAL-002/ClientPortal/Dashboard/Mobile/Default`           | `/portal/dashboard`                           | `ClientPortalDashboardPage`  | `apps/frontend/src/app/(portal)/portal/dashboard/page.tsx`                          | PORTAL-01..02                                               |
| `SCR-PORTAL-003`   | `Screen/SCR-PORTAL-003/ClientPortal/VisitHistory/Mobile/Default`        | `/portal/visits`                              | `ClientVisitHistoryPage`     | `apps/frontend/src/app/(portal)/portal/visits/page.tsx`                             | PORTAL-02                                                   |

## 5. Overlay registry

| UI ID            | Figma root                                                | Opened from                               | React component                     | Target file                                                                                 | Stories                         |
| ---------------- | --------------------------------------------------------- | ----------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| `OVL-AUTH-001`   | `Overlay/OVL-AUTH-001/Auth/SessionExpired/Default`        | `Global AppShell`                         | `SessionExpiredModal`               | `apps/frontend/src/features/auth/components/SessionExpiredModal.tsx`                        | AUTH-03                         |
| `OVL-ORG-001`    | `Overlay/OVL-ORG-001/Organization/Create/Default`         | `SCR-ORG-001`                             | `CreateOrganizationModal`           | `apps/frontend/src/features/organizations/components/CreateOrganizationModal.tsx`           | ORG-01                          |
| `OVL-ORG-002`    | `Overlay/OVL-ORG-002/Organization/Edit/Default`           | `SCR-ORG-001, SCR-ORG-002`                | `EditOrganizationModal`             | `apps/frontend/src/features/organizations/components/EditOrganizationModal.tsx`             | ORG-02                          |
| `OVL-ORG-003`    | `Overlay/OVL-ORG-003/Organization/Deactivate/Default`     | `SCR-ORG-001, SCR-ORG-002`                | `DeactivateOrganizationAlertDialog` | `apps/frontend/src/features/organizations/components/DeactivateOrganizationAlertDialog.tsx` | ORG-03                          |
| `OVL-BRANCH-001` | `Overlay/OVL-BRANCH-001/Branch/Create/Default`            | `SCR-ORG-002`                             | `CreateBranchModal`                 | `apps/frontend/src/features/branches/components/CreateBranchModal.tsx`                      | BRANCH-01                       |
| `OVL-BRANCH-002` | `Overlay/OVL-BRANCH-002/Branch/Edit/Default`              | `SCR-ORG-002, SCR-SETTINGS-002`           | `EditBranchModal`                   | `apps/frontend/src/features/branches/components/EditBranchModal.tsx`                        | BRANCH-01                       |
| `OVL-BRANCH-003` | `Overlay/OVL-BRANCH-003/Branch/Deactivate/Default`        | `SCR-ORG-002, SCR-SETTINGS-002`           | `DeactivateBranchAlertDialog`       | `apps/frontend/src/features/branches/components/DeactivateBranchAlertDialog.tsx`            | BRANCH-02                       |
| `OVL-STAFF-001`  | `Overlay/OVL-STAFF-001/Staff/CreateGymAdmin/Default`      | `SCR-ORG-002`                             | `CreateGymAdminModal`               | `apps/frontend/src/features/staff/components/CreateGymAdminModal.tsx`                       | STAFF-01                        |
| `OVL-STAFF-002`  | `Overlay/OVL-STAFF-002/Staff/CreateEmployee/Default`      | `SCR-STAFF-001`                           | `CreateEmployeeModal`               | `apps/frontend/src/features/staff/components/CreateEmployeeModal.tsx`                       | STAFF-02                        |
| `OVL-STAFF-003`  | `Overlay/OVL-STAFF-003/Staff/EditEmployee/Default`        | `SCR-STAFF-001, DRW-STAFF-001`            | `EditEmployeeModal`                 | `apps/frontend/src/features/staff/components/EditEmployeeModal.tsx`                         | STAFF-03                        |
| `OVL-STAFF-004`  | `Overlay/OVL-STAFF-004/Staff/Deactivate/Default`          | `SCR-STAFF-001, DRW-STAFF-001`            | `DeactivateEmployeeAlertDialog`     | `apps/frontend/src/features/staff/components/DeactivateEmployeeAlertDialog.tsx`             | STAFF-04                        |
| `DRW-STAFF-001`  | `Overlay/DRW-STAFF-001/Staff/Details/Default`             | `SCR-STAFF-001`                           | `StaffDetailsDrawer`                | `apps/frontend/src/features/staff/components/StaffDetailsDrawer.tsx`                        | STAFF-03..04                    |
| `OVL-CLIENT-001` | `Overlay/OVL-CLIENT-001/Client/Create/Default`            | `SCR-CLIENT-001, SCR-REC-001`             | `CreateClientModal`                 | `apps/frontend/src/features/clients/components/CreateClientModal.tsx`                       | CLIENT-01                       |
| `OVL-CLIENT-002` | `Overlay/OVL-CLIENT-002/Client/Edit/Default`              | `SCR-CLIENT-001, SCR-CLIENT-002`          | `EditClientModal`                   | `apps/frontend/src/features/clients/components/EditClientModal.tsx`                         | CLIENT-04                       |
| `OVL-CLIENT-003` | `Overlay/OVL-CLIENT-003/Client/PossibleDuplicate/Default` | `OVL-CLIENT-001`                          | `PossibleDuplicateClientModal`      | `apps/frontend/src/features/clients/components/PossibleDuplicateClientModal.tsx`            | CLIENT-01                       |
| `OVL-CLIENT-004` | `Overlay/OVL-CLIENT-004/Client/Block/Default`             | `SCR-CLIENT-001, SCR-CLIENT-002`          | `BlockClientAlertDialog`            | `apps/frontend/src/features/clients/components/BlockClientAlertDialog.tsx`                  | CLIENT-05                       |
| `OVL-CLIENT-005` | `Overlay/OVL-CLIENT-005/Client/Unblock/Default`           | `SCR-CLIENT-001, SCR-CLIENT-002`          | `UnblockClientAlertDialog`          | `apps/frontend/src/features/clients/components/UnblockClientAlertDialog.tsx`                | CLIENT-05                       |
| `OVL-PLAN-001`   | `Overlay/OVL-PLAN-001/MembershipPlan/Create/Default`      | `SCR-PLAN-001`                            | `CreateMembershipPlanModal`         | `apps/frontend/src/features/membership-plans/components/CreateMembershipPlanModal.tsx`      | PLAN-01                         |
| `OVL-PLAN-002`   | `Overlay/OVL-PLAN-002/MembershipPlan/Edit/Default`        | `SCR-PLAN-001`                            | `EditMembershipPlanModal`           | `apps/frontend/src/features/membership-plans/components/EditMembershipPlanModal.tsx`        | PLAN-01                         |
| `OVL-MEM-001`    | `Overlay/OVL-MEM-001/Membership/Assign/Default`           | `SCR-CLIENT-002`                          | `AssignMembershipModal`             | `apps/frontend/src/features/memberships/components/AssignMembershipModal.tsx`               | MEMBERSHIP-01                   |
| `OVL-MEM-002`    | `Overlay/OVL-MEM-002/Membership/Freeze/Default`           | `SCR-CLIENT-002`                          | `FreezeMembershipModal`             | `apps/frontend/src/features/memberships/components/FreezeMembershipModal.tsx`               | MEMBERSHIP-03                   |
| `OVL-MEM-003`    | `Overlay/OVL-MEM-003/Membership/Cancel/Default`           | `SCR-CLIENT-002`                          | `CancelMembershipAlertDialog`       | `apps/frontend/src/features/memberships/components/CancelMembershipAlertDialog.tsx`         | MEMBERSHIP-01..03               |
| `OVL-KEY-001`    | `Overlay/OVL-KEY-001/LockerKey/Add/Default`               | `SCR-KEY-001`                             | `AddLockerKeyModal`                 | `apps/frontend/src/features/locker-keys/components/AddLockerKeyModal.tsx`                   | KEY-01                          |
| `OVL-KEY-002`    | `Overlay/OVL-KEY-002/LockerKey/Edit/Default`              | `SCR-KEY-001, DRW-KEY-001`                | `EditLockerKeyModal`                | `apps/frontend/src/features/locker-keys/components/EditLockerKeyModal.tsx`                  | KEY-01, KEY-03                  |
| `OVL-KEY-003`    | `Overlay/OVL-KEY-003/LockerKey/ChangeStatus/Default`      | `SCR-KEY-001, DRW-KEY-001`                | `ChangeLockerKeyStatusModal`        | `apps/frontend/src/features/locker-keys/components/ChangeLockerKeyStatusModal.tsx`          | KEY-03                          |
| `DRW-KEY-001`    | `Overlay/DRW-KEY-001/LockerKey/Details/Default`           | `SCR-KEY-001`                             | `LockerKeyDetailsDrawer`            | `apps/frontend/src/features/locker-keys/components/LockerKeyDetailsDrawer.tsx`              | KEY-02..03                      |
| `OVL-VISIT-001`  | `Overlay/OVL-VISIT-001/Visit/CheckIn/Default`             | `SCR-REC-001`                             | `CheckInModal`                      | `apps/frontend/src/features/visits/components/CheckInModal.tsx`                             | MEMBERSHIP-02..04, VISIT-01..04 |
| `OVL-VISIT-002`  | `Overlay/OVL-VISIT-002/Visit/CheckInSuccess/Default`      | `OVL-VISIT-001`                           | `CheckInSuccessModal`               | `apps/frontend/src/features/visits/components/CheckInSuccessModal.tsx`                      | VISIT-01                        |
| `OVL-VISIT-003`  | `Overlay/OVL-VISIT-003/Visit/CheckoutByKey/Lookup`        | `SCR-REC-001, SCR-VISIT-001`              | `CheckoutByKeyModal`                | `apps/frontend/src/features/visits/components/CheckoutByKeyModal.tsx`                       | VISIT-06..07                    |
| `DRW-VISIT-001`  | `Overlay/DRW-VISIT-001/Visit/Details/Default`             | `SCR-VISIT-001, SCR-CLIENT-002`           | `VisitDetailsDrawer`                | `apps/frontend/src/features/visits/components/VisitDetailsDrawer.tsx`                       | VISIT-05..10, AUDIT-01          |
| `OVL-VISIT-004`  | `Overlay/OVL-VISIT-004/Visit/Correct/Default`             | `DRW-VISIT-001`                           | `CorrectVisitModal`                 | `apps/frontend/src/features/visits/components/CorrectVisitModal.tsx`                        | VISIT-09                        |
| `OVL-INC-001`    | `Overlay/OVL-INC-001/Incident/Report/Default`             | `SCR-REC-001, SCR-KEY-001, DRW-VISIT-001` | `ReportIncidentModal`               | `apps/frontend/src/features/incidents/components/ReportIncidentModal.tsx`                   | INCIDENT-01..02                 |
| `DRW-INC-001`    | `Overlay/DRW-INC-001/Incident/Details/Default`            | `SCR-INCIDENT-001`                        | `IncidentDetailsDrawer`             | `apps/frontend/src/features/incidents/components/IncidentDetailsDrawer.tsx`                 | INCIDENT-01..03                 |
| `OVL-INC-002`    | `Overlay/OVL-INC-002/Incident/Resolve/Default`            | `DRW-INC-001`                             | `ResolveIncidentModal`              | `apps/frontend/src/features/incidents/components/ResolveIncidentModal.tsx`                  | INCIDENT-03                     |
| `DRW-AUDIT-001`  | `Overlay/DRW-AUDIT-001/Audit/EventDetails/Default`        | `SCR-AUDIT-001`                           | `AuditEventDetailsDrawer`           | `apps/frontend/src/features/audit/components/AuditEventDetailsDrawer.tsx`                   | AUDIT-01..02                    |

## 6. Reusable component registry

| Component ID       | Figma component                               | React component              | Target file                                                                        | Canonical props                                                |
| ------------------ | --------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `CMP-SHELL-001`    | `Component/GymOps/AppShell`                   | `AppShell`                   | `apps/frontend/src/shared/layout/AppShell.tsx`                                     | `role, organization, branches, currentBranch, navigationItems` |
| `CMP-NAV-001`      | `Component/GymOps/BranchSelector`             | `BranchSelector`             | `apps/frontend/src/features/branches/components/BranchSelector.tsx`                | `branches, value, isReadOnly, onChange`                        |
| `CMP-PAGE-001`     | `Component/GymOps/PageHeader`                 | `PageHeader`                 | `apps/frontend/src/shared/ui/PageHeader.tsx`                                       | `breadcrumbs, title, description, primaryAction`               |
| `CMP-TABLE-001`    | `Component/GymOps/DataTable`                  | `DataTable`                  | `apps/frontend/src/shared/ui/DataTable.tsx`                                        | `columns, rows, sorting, pagination, loading, emptyState`      |
| `CMP-STATE-001`    | `Component/GymOps/StatusChip`                 | `StatusChip`                 | `apps/frontend/src/shared/ui/StatusChip.tsx`                                       | `domain, status, label`                                        |
| `CMP-FEEDBACK-001` | `Component/GymOps/EmptyState`                 | `EmptyState`                 | `apps/frontend/src/shared/ui/EmptyState.tsx`                                       | `title, description, action`                                   |
| `CMP-FEEDBACK-002` | `Component/GymOps/ErrorState`                 | `ErrorState`                 | `apps/frontend/src/shared/ui/ErrorState.tsx`                                       | `title, description, retryAction, correlationId`               |
| `CMP-OVERLAY-001`  | `Component/GymOps/FormDialog`                 | `FormDialog`                 | `apps/frontend/src/shared/ui/FormDialog.tsx`                                       | `title, description, isOpen, isSubmitting, onSubmit, onClose`  |
| `CMP-OVERLAY-002`  | `Component/GymOps/DetailsDrawer`              | `DetailsDrawer`              | `apps/frontend/src/shared/ui/DetailsDrawer.tsx`                                    | `title, isOpen, onClose, actions`                              |
| `CMP-OVERLAY-003`  | `Component/GymOps/ConfirmAlertDialog`         | `ConfirmAlertDialog`         | `apps/frontend/src/shared/ui/ConfirmAlertDialog.tsx`                               | `title, description, confirmLabel, danger, onConfirm`          |
| `CMP-CLIENT-001`   | `Component/GymOps/ClientSummaryCard`          | `ClientSummaryCard`          | `apps/frontend/src/features/clients/components/ClientSummaryCard.tsx`              | `client, membership, activeVisit`                              |
| `CMP-MEM-001`      | `Component/GymOps/MembershipEligibilityPanel` | `MembershipEligibilityPanel` | `apps/frontend/src/features/memberships/components/MembershipEligibilityPanel.tsx` | `eligibility, reasons, membership`                             |
| `CMP-KEY-001`      | `Component/GymOps/LockerKeyStatusChip`        | `LockerKeyStatusChip`        | `apps/frontend/src/features/locker-keys/components/LockerKeyStatusChip.tsx`        | `status`                                                       |
| `CMP-VISIT-001`    | `Component/GymOps/VisitStatusChip`            | `VisitStatusChip`            | `apps/frontend/src/features/visits/components/VisitStatusChip.tsx`                 | `status`                                                       |
| `CMP-VISIT-002`    | `Component/GymOps/ActiveVisitTable`           | `ActiveVisitTable`           | `apps/frontend/src/features/visits/components/ActiveVisitTable.tsx`                | `visits, filters, onCheckout, onOpenDetails`                   |
| `CMP-INC-001`      | `Component/GymOps/IncidentStatusChip`         | `IncidentStatusChip`         | `apps/frontend/src/features/incidents/components/IncidentStatusChip.tsx`           | `status`                                                       |
| `CMP-AUDIT-001`    | `Component/GymOps/AuditEventDiff`             | `AuditEventDiff`             | `apps/frontend/src/features/audit/components/AuditEventDiff.tsx`                   | `before, after, changedFields`                                 |
| `CMP-REPORT-001`   | `Component/GymOps/ReportFilterBar`            | `ReportFilterBar`            | `apps/frontend/src/features/reports/components/ReportFilterBar.tsx`                | `dateRange, branch, employee, onApply`                         |
| `CMP-REPORT-002`   | `Component/GymOps/ConsistencyStatusIndicator` | `ConsistencyStatusIndicator` | `apps/frontend/src/features/reports/components/ConsistencyStatusIndicator.tsx`     | `status, lastUpdatedAt, retryAfter`                            |

## 7. Required Figma variables

Use variable aliases rather than raw values:

- `color/background/base`, `color/background/subtle`, `color/background/elevated`;
- `color/content/primary`, `color/content/secondary`, `color/content/disabled`;
- `color/action/primary`, `color/action/primary-hover`;
- `color/status/success`, `color/status/warning`, `color/status/danger`, `color/status/info`;
- `space/1`, `space/2`, `space/3`, `space/4`, `space/6`, `space/8`;
- `radius/sm`, `radius/md`, `radius/lg`, `radius/full`;
- `type/body/sm`, `type/body/md`, `type/label/md`, `type/heading/sm`, `type/heading/md`, `type/heading/lg`.

Domain status aliases:

- `membership/active`, `membership/frozen`, `membership/expired`, `membership/blocked`;
- `key/available`, `key/issued`, `key/lost`, `key/damaged`, `key/maintenance`;
- `visit/active`, `visit/completed`, `visit/incident`, `visit/auto-closed`;
- `incident/open`, `incident/resolved`.

## 8. Frontend implementation rules

- Use existing HeroUI primitives; do not recreate `Button`, `Input`, `Select`, `Modal`, `Drawer`, `AlertDialog`, `Chip` or `Table`.
- Reusable GymOps components must use the React names in this registry.
- Route-level components use the exact page component names.
- Component props should mirror HeroUI props where practical: `isDisabled`, `isLoading`, `isInvalid`, `isRequired`, `variant`, `color`, `size`.
- Playwright should prefer role, label and accessible-name locators. `data-testid` is allowed only where semantic locators are insufficient.
- API/domain names do not have to equal visible labels, but their mapping must remain explicit in form adapters.

## 9. Definition of Ready for a Figma frame

- [ ] Exact UI ID and root name are present.
- [ ] Auto Layout is used for all structural containers.
- [ ] Shared elements are component instances.
- [ ] Variables are used instead of raw visual values.
- [ ] Default, loading, empty, error and relevant business states exist.
- [ ] Route, story IDs and API notes are attached as annotations.
- [ ] Required semantic child layers from `figma-make-prompts.md` exist.
- [ ] Responsive behavior for desktop and tablet is documented.
- [ ] Destructive operations use an AlertDialog.
- [ ] The frame is placed in `95 — Ready for Development`.

## 10. Change control

When a screen or component changes:

1. Keep the UI ID stable.
2. Update this registry first.
3. Update the Figma prompt and affected stories.
4. Update the React component mapping when code exists.
5. Update affected automated tests and snapshots only when behavior actually changed.

## 11. Figma Make and MCP limitations

- Figma Make instructions improve consistency but do not guarantee exact node names, variable bindings or true library components.
- Every generated design requires the normalization prompt from `figma-make-prompts.md` and a manual spot-check.
- Figma names support design-to-code context; they do not generate application behavior by themselves.
- React component names may be refined before implementation, but changes must be applied in this registry and all affected stories.
- UI IDs must not be used as visible copy.
- UI IDs are not automatically Playwright selectors. Prefer accessible roles, labels and names; add `data-testid` only for ambiguous composite widgets.
- Code Connect is an optional later enhancement after real React components exist.
