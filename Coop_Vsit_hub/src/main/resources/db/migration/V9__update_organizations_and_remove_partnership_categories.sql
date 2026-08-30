-- =========================================================================
-- V9: Update Organizations Table & Drop Partnership Categories Table
-- =========================================================================

-- 1. Allow nullable category in organizations
ALTER TABLE organizations ALTER COLUMN category DROP NOT NULL;
ALTER TABLE organizations ALTER COLUMN category SET DEFAULT 'Partner Organization';

-- 2. Add portal_password column for organization credentials
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS portal_password VARCHAR(255);

-- 3. Drop legacy partnership_categories table
DROP TABLE IF EXISTS partnership_categories CASCADE;
