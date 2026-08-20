-- =============================================================================
-- Migration V2: Seed Default Roles & System Administrator
-- Cooperative Bank of Oromia (CoopBank DxValley) - Visit Hub
-- =============================================================================

-- 1. Insert Standard CoopBank System Roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_ADMIN', 'Full System Administrator with security governance and audit privileges'),
    ('ROLE_RELATIONSHIP_MANAGER', 'Relationship Manager who creates visit requests and manages guest organizations'),
    ('ROLE_BUSINESS_SPONSOR', 'Executive Business Sponsor with approval oversight and pipeline analytics access'),
    ('ROLE_APPROVER', 'Departmental or Executive Approver with sign-off authority for visits'),
    ('ROLE_SECURITY_DESK', 'Front-desk security personnel managing visitor check-in, check-out, and badges')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Default CoopBank Administrator User
-- Default Username: admin
-- Default Password: ChangeMe@CoopBank2026! (hashed via BCrypt strength 12)
INSERT INTO users (
    id,
    username,
    email,
    password_hash,
    first_name,
    middle_name,
    last_name,
    department,
    phone_number,
    is_enabled,
    is_account_non_locked,
    failed_login_attempts,
    password_changed_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'admin@coopbank.com.et',
    '$2a$12$K8d2ZgR5YdK1Qz6KzJ8eEOp1L/4m9r5xY8wZ6vK8z9J2YdK1Qz6Kz', -- BCrypt hash of ChangeMe@CoopBank2026!
    'System',
    'DxValley',
    'Administrator',
    'DxValley IT Security',
    '+251911000000',
    TRUE,
    TRUE,
    0,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 3. Assign ROLE_ADMIN to System Administrator User
INSERT INTO user_roles (user_id, role_id)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    r.id
FROM roles r
WHERE r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;
