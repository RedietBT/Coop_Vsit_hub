-- =============================================================================
-- Migration V25: Add Requested Items to Room Bookings
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS requested_items TEXT;
