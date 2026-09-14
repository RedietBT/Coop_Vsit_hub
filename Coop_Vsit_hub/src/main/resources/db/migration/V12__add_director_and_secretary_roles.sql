-- =============================================================================
-- Migration V12: Add Director & Secretary Roles and Retire General Employee Role
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

-- 1. Insert New Standard Executive and Front-Office Roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_DIRECTOR', 'Executive Department Director with visit hosting, executive sign-off, and pipeline review authority'),
    ('ROLE_SECRETARY', 'Department Secretary managing department-scoped meeting rooms, reservations, and visitor logistics')
ON CONFLICT (name) DO NOTHING;

-- 2. Migrate Any Existing ROLE_EMPLOYEE Assignments to ROLE_DIRECTOR
DO $$
DECLARE
    employee_role_id BIGINT;
    director_role_id BIGINT;
BEGIN
    SELECT id INTO employee_role_id FROM roles WHERE name = 'ROLE_EMPLOYEE';
    SELECT id INTO director_role_id FROM roles WHERE name = 'ROLE_DIRECTOR';

    IF employee_role_id IS NOT NULL AND director_role_id IS NOT NULL THEN
        -- Reassign any existing user_roles from employee to director
        UPDATE user_roles SET role_id = director_role_id WHERE role_id = employee_role_id;
        -- Remove legacy role from roles table
        DELETE FROM roles WHERE id = employee_role_id;
    END IF;
END $$;
