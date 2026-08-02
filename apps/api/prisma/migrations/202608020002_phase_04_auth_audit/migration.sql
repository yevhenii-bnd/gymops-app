CREATE TYPE audit.audit_actor_type AS ENUM ('STAFF_USER', 'CLIENT_ACCOUNT', 'SYSTEM');

CREATE TABLE audit.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NULL,
    branch_id uuid NULL,
    actor_type audit.audit_actor_type NOT NULL DEFAULT 'STAFF_USER',
    actor_staff_user_id uuid NULL,
    actor_client_account_id uuid NULL,
    actor_role varchar(50) NULL,
    action varchar(120) NOT NULL,
    entity_type varchar(80) NOT NULL,
    entity_id uuid NULL,
    old_values jsonb NULL,
    new_values jsonb NULL,
    reason varchar(1000) NULL,
    correlation_id uuid NOT NULL,
    request_id varchar(120) NULL,
    ip_hash varchar(128) NULL,
    user_agent varchar(500) NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT audit_logs_actor_consistency_chk CHECK (
        (actor_type = 'STAFF_USER' AND actor_staff_user_id IS NOT NULL AND actor_client_account_id IS NULL)
        OR (actor_type = 'CLIENT_ACCOUNT' AND actor_staff_user_id IS NULL AND actor_client_account_id IS NOT NULL)
        OR (actor_type = 'SYSTEM' AND actor_staff_user_id IS NULL AND actor_client_account_id IS NULL)
    ),
    CONSTRAINT audit_logs_no_password_or_token_hashes_chk CHECK (
        COALESCE(old_values::text, '') !~* '(password|token)_hash'
        AND COALESCE(new_values::text, '') !~* '(password|token)_hash'
    )
);

CREATE INDEX audit_logs_organization_created_idx
    ON audit.audit_logs (organization_id, created_at DESC);

CREATE INDEX audit_logs_entity_idx
    ON audit.audit_logs (organization_id, entity_type, entity_id, created_at DESC);

CREATE INDEX audit_logs_actor_staff_idx
    ON audit.audit_logs (organization_id, actor_staff_user_id, created_at DESC);

CREATE INDEX audit_logs_correlation_idx
    ON audit.audit_logs (correlation_id);

CREATE INDEX audit_logs_action_idx
    ON audit.audit_logs (action);
