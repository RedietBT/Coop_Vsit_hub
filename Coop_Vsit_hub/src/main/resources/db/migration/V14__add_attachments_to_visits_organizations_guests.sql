-- =============================================================================
-- Migration V14: Add Optional Attachment Metadata to Visits, Organizations & Guests
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

ALTER TABLE visits ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

ALTER TABLE individual_guests ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE individual_guests ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);
