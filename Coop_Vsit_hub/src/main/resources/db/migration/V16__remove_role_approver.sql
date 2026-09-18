-- =============================================================================
-- Migration V16: Remove ROLE_APPROVER and Align Roles with Visit Hub Specifications
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================
-- Active System Roles:
-- 1. ROLE_ADMIN                - System Administrator
-- 2. ROLE_RELATIONSHIP_MANAGER - Relationship Manager
-- 3. ROLE_DIRECTOR             - Executive Director
-- 4. ROLE_SECRETARY            - Department Secretary
-- 5. ROLE_SECURITY_DESK        - Front Desk Reception
-- =============================================================================

DO $$
DECLARE
    approver_role_id BIGINT;
    director_role_id BIGINT;
BEGIN
    SELECT id INTO approver_role_id FROM roles WHERE name = 'ROLE_APPROVER';
    SELECT id INTO director_role_id FROM roles WHERE name = 'ROLE_DIRECTOR';

    IF approver_role_id IS NOT NULL THEN
        IF director_role_id IS NOT NULL THEN
            -- Migrate any users with ROLE_APPROVER to ROLE_DIRECTOR
            UPDATE user_roles
            SET role_id = director_role_id
            WHERE role_id = approver_role_id
              AND user_id NOT IN (SELECT user_id FROM user_roles WHERE role_id = director_role_id);
        END IF;

        -- Remove any remaining user assignments for ROLE_APPROVER
        DELETE FROM user_roles WHERE role_id = approver_role_id;

        -- Remove ROLE_APPROVER from roles catalog
        DELETE FROM roles WHERE id = approver_role_id;
    END IF;
END $$;

-- Update role descriptions for clarity
UPDATE roles 
SET description = 'Front Desk Reception — Visitor check-in, ID verification, badge issuance (COOPV), check-out'
WHERE name = 'ROLE_SECURITY_DESK';

UPDATE roles 
SET description = 'Relationship Manager — Creates & hosts delegation visits, manages corporate partners & VIPs'
WHERE name = 'ROLE_RELATIONSHIP_MANAGER';

UPDATE roles 
SET description = 'Executive Director — Department or Executive Director with visit hosting, sign-off, and analytics oversight'
WHERE name = 'ROLE_DIRECTOR';

UPDATE roles 
SET description = 'Department Secretary — Manages department meeting rooms, reservations, and visitor coordination'
WHERE name = 'ROLE_SECRETARY';

UPDATE roles 
SET description = 'System Administrator — Full system control, master data, staff onboarding & system audit'
WHERE name = 'ROLE_ADMIN';
