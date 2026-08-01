CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS membership;
CREATE SCHEMA IF NOT EXISTS operations;
CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TYPE identity.organization_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
CREATE TYPE identity.branch_status AS ENUM ('ACTIVE', 'DEACTIVATED');
CREATE TYPE identity.staff_role AS ENUM ('SUPER_ADMIN', 'GYM_ADMIN', 'EMPLOYEE');
CREATE TYPE identity.staff_status AS ENUM ('INVITED', 'ACTIVE', 'DEACTIVATED', 'LOCKED');

CREATE TABLE identity.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL,
  name varchar(160) NOT NULL,
  legal_name varchar(200),
  status identity.organization_status NOT NULL DEFAULT 'ACTIVE',
  default_timezone varchar(64) NOT NULL DEFAULT 'Europe/Kyiv',
  deactivation_reason varchar(500),
  deactivated_at timestamptz,
  created_by_staff_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT organizations_deactivation_requires_reason CHECK (
    status <> 'DEACTIVATED'
    OR (deactivation_reason IS NOT NULL AND deactivated_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX organizations_code_upper_key ON identity.organizations (upper(code));
CREATE UNIQUE INDEX organizations_id_code_key ON identity.organizations (id, code);
CREATE INDEX organizations_status_idx ON identity.organizations (status);

CREATE TABLE identity.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES identity.organizations(id) ON DELETE RESTRICT,
  code varchar(40) NOT NULL,
  name varchar(160) NOT NULL,
  address_line_1 varchar(200),
  address_line_2 varchar(200),
  city varchar(120),
  timezone varchar(64) NOT NULL,
  status identity.branch_status NOT NULL DEFAULT 'ACTIVE',
  auto_close_after_minutes integer,
  deactivation_reason varchar(500),
  deactivated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT branches_auto_close_positive CHECK (
    auto_close_after_minutes IS NULL OR auto_close_after_minutes > 0
  ),
  CONSTRAINT branches_deactivation_requires_reason CHECK (
    status <> 'DEACTIVATED'
    OR (deactivation_reason IS NOT NULL AND deactivated_at IS NOT NULL)
  ),
  CONSTRAINT branches_id_organization_unique UNIQUE (id, organization_id)
);

CREATE UNIQUE INDEX branches_organization_code_upper_key ON identity.branches (organization_id, upper(code));
CREATE INDEX branches_organization_status_idx ON identity.branches (organization_id, status);
CREATE INDEX branches_organization_name_idx ON identity.branches (organization_id, name);

CREATE TABLE identity.staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES identity.organizations(id) ON DELETE RESTRICT,
  email varchar(254) NOT NULL,
  email_normalized varchar(254) NOT NULL,
  password_hash varchar(255) NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  phone varchar(32),
  phone_normalized varchar(32),
  role identity.staff_role NOT NULL,
  status identity.staff_status NOT NULL DEFAULT 'INVITED',
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  password_changed_at timestamptz,
  deactivated_at timestamptz,
  created_by_staff_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT staff_users_role_organization_scope CHECK (
    (role = 'SUPER_ADMIN' AND organization_id IS NULL)
    OR (role <> 'SUPER_ADMIN' AND organization_id IS NOT NULL)
  ),
  CONSTRAINT staff_users_failed_login_count_nonnegative CHECK (failed_login_count >= 0),
  CONSTRAINT staff_users_id_organization_unique UNIQUE (id, organization_id)
);

ALTER TABLE identity.staff_users
  ADD CONSTRAINT staff_users_created_by_fk
  FOREIGN KEY (created_by_staff_user_id) REFERENCES identity.staff_users(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX staff_users_email_normalized_key ON identity.staff_users (email_normalized);
CREATE INDEX staff_users_organization_role_status_idx ON identity.staff_users (organization_id, role, status);
CREATE INDEX staff_users_organization_name_idx ON identity.staff_users (organization_id, last_name, first_name);

CREATE TABLE identity.staff_branch_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  staff_user_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  assigned_by_staff_user_id uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  revoked_by_staff_user_id uuid,
  revoked_at timestamptz,
  CONSTRAINT staff_branch_assignments_staff_fk
    FOREIGN KEY (staff_user_id, organization_id)
    REFERENCES identity.staff_users(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT staff_branch_assignments_branch_fk
    FOREIGN KEY (branch_id, organization_id)
    REFERENCES identity.branches(id, organization_id)
    ON DELETE RESTRICT,
  CONSTRAINT staff_branch_assignments_assigned_by_fk
    FOREIGN KEY (assigned_by_staff_user_id)
    REFERENCES identity.staff_users(id)
    ON DELETE RESTRICT,
  CONSTRAINT staff_branch_assignments_revoked_by_fk
    FOREIGN KEY (revoked_by_staff_user_id)
    REFERENCES identity.staff_users(id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX staff_branch_assignments_active_key
  ON identity.staff_branch_assignments (staff_user_id, branch_id)
  WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX staff_branch_assignments_primary_key
  ON identity.staff_branch_assignments (staff_user_id)
  WHERE revoked_at IS NULL AND is_primary;

CREATE INDEX staff_branch_assignments_org_branch_revoked_idx
  ON identity.staff_branch_assignments (organization_id, branch_id, revoked_at);

CREATE TABLE identity.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid REFERENCES identity.staff_users(id) ON DELETE RESTRICT,
  client_account_id uuid,
  token_hash varchar(255) NOT NULL,
  family_id uuid NOT NULL DEFAULT gen_random_uuid(),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoke_reason varchar(120),
  replaced_by_token_id uuid REFERENCES identity.refresh_tokens(id) ON DELETE RESTRICT,
  ip_hash varchar(128),
  user_agent varchar(500),
  CONSTRAINT refresh_tokens_one_principal CHECK (
    (staff_user_id IS NOT NULL AND client_account_id IS NULL)
    OR (staff_user_id IS NULL AND client_account_id IS NOT NULL)
  ),
  CONSTRAINT refresh_tokens_expires_after_issue CHECK (expires_at > issued_at)
);

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON identity.refresh_tokens (token_hash);
CREATE INDEX refresh_tokens_staff_active_idx ON identity.refresh_tokens (staff_user_id, revoked_at, expires_at);
CREATE INDEX refresh_tokens_client_active_idx ON identity.refresh_tokens (client_account_id, revoked_at, expires_at);
CREATE INDEX refresh_tokens_family_idx ON identity.refresh_tokens (family_id);
