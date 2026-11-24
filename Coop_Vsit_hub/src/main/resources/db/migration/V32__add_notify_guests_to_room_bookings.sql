-- Whether invited guests should receive reservation / reschedule / cancellation emails
ALTER TABLE room_bookings
    ADD COLUMN IF NOT EXISTS notify_guests BOOLEAN NOT NULL DEFAULT TRUE;
