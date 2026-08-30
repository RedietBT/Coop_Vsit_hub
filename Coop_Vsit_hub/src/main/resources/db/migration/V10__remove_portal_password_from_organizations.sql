-- =========================================================================
-- V10: Remove portal_password column from organizations table
-- =========================================================================

ALTER TABLE organizations DROP COLUMN IF EXISTS portal_password;
