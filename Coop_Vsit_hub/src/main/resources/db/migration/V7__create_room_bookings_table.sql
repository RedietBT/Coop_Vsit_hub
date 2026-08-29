-- =============================================================================
-- Migration V7: Create Dedicated Room Bookings Table & Decouple from Visits
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

CREATE TABLE IF NOT EXISTS room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(50) NOT NULL UNIQUE,
    room_name VARCHAR(120) NOT NULL,
    meeting_title VARCHAR(255) NOT NULL,
    host_department VARCHAR(120),
    booked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booked_by_name VARCHAR(150),
    booked_by_username VARCHAR(100),
    booked_by_email VARCHAR(150),
    guest_organization_name VARCHAR(150),
    guest_name VARCHAR(150),
    expected_attendees INT DEFAULT 1,
    meeting_agenda TEXT,
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    linked_visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_bookings_room_time ON room_bookings (room_name, scheduled_start_time, scheduled_end_time);
CREATE INDEX IF NOT EXISTS idx_room_bookings_code ON room_bookings (booking_code);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON room_bookings (status);
CREATE INDEX IF NOT EXISTS idx_room_bookings_date ON room_bookings (scheduled_start_time);

-- Add linked_booking_id and guest_tier to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS linked_booking_id UUID REFERENCES room_bookings(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS guest_tier VARCHAR(30) DEFAULT 'NORMAL_GUEST';

-- Remove internal room bookings mistakenly created in visits table to clean the arrivals feed
DELETE FROM visits WHERE visit_type = 'INTERNAL' OR title LIKE 'Room Reservation%' OR title = 'To vist the CEO';
