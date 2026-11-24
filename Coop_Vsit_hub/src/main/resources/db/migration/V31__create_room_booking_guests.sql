-- Guests invited to a room booking (receive reservation / cancellation emails)
CREATE TABLE IF NOT EXISTS room_booking_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES room_bookings(id) ON DELETE CASCADE,
    guest_name VARCHAR(150) NOT NULL,
    guest_email VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_room_booking_guests_booking ON room_booking_guests(booking_id);
