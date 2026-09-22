-- =============================================================================
-- Migration V17: Add ROLE_FRONT_DESK and Link Existing Security Desk Users
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

-- 1. Insert ROLE_FRONT_DESK into roles if not exists
INSERT INTO roles (name, description)
VALUES (
    'ROLE_FRONT_DESK',
    'Front Desk Reception — Visitor check-in, ID verification, badge issuance (COOPV), check-out'
)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- 2. Link any user currently holding ROLE_SECURITY_DESK to also have ROLE_FRONT_DESK
DO $$
DECLARE
    security_role_id BIGINT;
    front_desk_role_id BIGINT;
BEGIN
    SELECT id INTO security_role_id FROM roles WHERE name = 'ROLE_SECURITY_DESK';
    SELECT id INTO front_desk_role_id FROM roles WHERE name = 'ROLE_FRONT_DESK';

    IF security_role_id IS NOT NULL AND front_desk_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        SELECT user_id, front_desk_role_id
        FROM user_roles
        WHERE role_id = security_role_id
          AND user_id NOT IN (SELECT user_id FROM user_roles WHERE role_id = front_desk_role_id);
    END IF;
END $$;
