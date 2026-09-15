-- =============================================================================
-- Migration V15: Remove Development/Test Users for Production Deployment
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================
-- This migration safely removes any non-system users that may have been created
-- during development and testing. The permanent system administrator seeded in V2
-- (username: 'admin') is preserved.
-- =============================================================================

-- Remove refresh tokens for test/dev users first (FK constraint)
DELETE FROM refresh_tokens
WHERE user_id NOT IN (
    SELECT id FROM users WHERE username = 'admin'
);

-- Remove user_roles assignments for test/dev users
DELETE FROM user_roles
WHERE user_id NOT IN (
    SELECT id FROM users WHERE username = 'admin'
);

-- Delete test/dev users — keeping only the seeded admin
DELETE FROM users
WHERE username != 'admin';
