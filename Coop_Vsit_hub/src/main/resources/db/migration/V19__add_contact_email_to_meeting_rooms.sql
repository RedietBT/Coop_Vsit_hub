-- =============================================================================
-- Migration V19: Add contact_email to meeting_rooms table
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

ALTER TABLE meeting_rooms
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200);
