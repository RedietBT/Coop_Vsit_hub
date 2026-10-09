-- =============================================================================
-- Migration V22: Add assigned user / custodian to meeting_rooms table
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

ALTER TABLE meeting_rooms
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE meeting_rooms
ADD COLUMN IF NOT EXISTS assigned_user_name VARCHAR(150);
