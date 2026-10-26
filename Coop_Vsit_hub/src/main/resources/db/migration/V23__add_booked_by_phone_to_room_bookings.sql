-- =============================================================================
-- Migration V23: Add Booked By Phone to Room Bookings
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

ALTER TABLE room_bookings ADD COLUMN IF NOT EXISTS booked_by_phone VARCHAR(50);
