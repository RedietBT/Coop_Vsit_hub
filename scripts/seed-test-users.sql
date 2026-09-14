-- =============================================================================
-- CoopBank Visit Hub: Test Users Seed Script (For Staging & Local Testing)
-- =============================================================================
-- Test Password for all accounts: ChangeMe@CoopBank2026!
-- Hash: $2a$12$uvh5MjmixYPbWrWP7MmldubCrxvjbP9F/Ano0xTZjMX6l4hrG.OzW
-- =============================================================================

-- 1. Insert Corporate Banking Test Personas
INSERT INTO users (
    id, username, email, password_hash, first_name, last_name, department, phone_number,
    is_enabled, is_account_non_locked, is_email_verified, must_change_password, failed_login_attempts
) VALUES
    ('10000000-0000-0000-0000-000000000001', 'director_corp', 'director.corp@coopbank.com.et',
     '$2a$12$uvh5MjmixYPbWrWP7MmldubCrxvjbP9F/Ano0xTZjMX6l4hrG.OzW', 'Abebe', 'Girma', 'Corporate Banking', '+251911223344',
     TRUE, TRUE, TRUE, FALSE, 0),
    ('10000000-0000-0000-0000-000000000002', 'secretary_corp', 'secretary.corp@coopbank.com.et',
     '$2a$12$uvh5MjmixYPbWrWP7MmldubCrxvjbP9F/Ano0xTZjMX6l4hrG.OzW', 'Hanna', 'Kebede', 'Corporate Banking', '+251922334455',
     TRUE, TRUE, TRUE, FALSE, 0),

-- 2. Insert Retail Banking Test Personas
    ('10000000-0000-0000-0000-000000000003', 'director_retail', 'director.retail@coopbank.com.et',
     '$2a$12$uvh5MjmixYPbWrWP7MmldubCrxvjbP9F/Ano0xTZjMX6l4hrG.OzW', 'Dawit', 'Tadesse', 'Retail Banking & MSME', '+251933445566',
     TRUE, TRUE, TRUE, FALSE, 0),
    ('10000000-0000-0000-0000-000000000004', 'secretary_retail', 'secretary.retail@coopbank.com.et',
     '$2a$12$uvh5MjmixYPbWrWP7MmldubCrxvjbP9F/Ano0xTZjMX6l4hrG.OzW', 'Selam', 'Alemu', 'Retail Banking & MSME', '+251944556677',
     TRUE, TRUE, TRUE, FALSE, 0)
ON CONFLICT (username) DO UPDATE SET
    department = EXCLUDED.department,
    is_enabled = TRUE,
    is_account_non_locked = TRUE;

-- 3. Assign Roles
-- director_corp -> ROLE_DIRECTOR
INSERT INTO user_roles (user_id, role_id)
SELECT '10000000-0000-0000-0000-000000000001', r.id FROM roles r WHERE r.name = 'ROLE_DIRECTOR'
ON CONFLICT DO NOTHING;

-- secretary_corp -> ROLE_SECRETARY
INSERT INTO user_roles (user_id, role_id)
SELECT '10000000-0000-0000-0000-000000000002', r.id FROM roles r WHERE r.name = 'ROLE_SECRETARY'
ON CONFLICT DO NOTHING;

-- director_retail -> ROLE_DIRECTOR
INSERT INTO user_roles (user_id, role_id)
SELECT '10000000-0000-0000-0000-000000000003', r.id FROM roles r WHERE r.name = 'ROLE_DIRECTOR'
ON CONFLICT DO NOTHING;

-- secretary_retail -> ROLE_SECRETARY
INSERT INTO user_roles (user_id, role_id)
SELECT '10000000-0000-0000-0000-000000000004', r.id FROM roles r WHERE r.name = 'ROLE_SECRETARY'
ON CONFLICT DO NOTHING;
