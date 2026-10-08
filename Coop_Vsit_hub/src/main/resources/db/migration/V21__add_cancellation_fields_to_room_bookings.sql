-- =============================================================================
-- Migration V21: Add Cancellation Reason and Metadata to Room Bookings
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS cancelled_by_name VARCHAR(150);
ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
