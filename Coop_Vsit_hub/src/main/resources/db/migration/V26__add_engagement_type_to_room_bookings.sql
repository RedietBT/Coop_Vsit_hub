-- =============================================================================
-- Migration V26: Add Engagement Type to Room Bookings (Internal vs External)
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS engagement_type VARCHAR(30) DEFAULT 'INTERNAL';

-- Update existing records to default 'INTERNAL' if null
UPDATE room_bookings SET engagement_type = 'INTERNAL' WHERE engagement_type IS NULL;
