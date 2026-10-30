ALTER TABLE meeting_rooms
    ADD COLUMN IF NOT EXISTS refreshment_options TEXT;

ALTER TABLE meeting_rooms
    ADD COLUMN IF NOT EXISTS refreshments_available BOOLEAN NOT NULL DEFAULT FALSE;
