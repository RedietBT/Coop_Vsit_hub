-- Optional Google Maps (or other map) link shown in guest emails
ALTER TABLE meeting_rooms
    ADD COLUMN IF NOT EXISTS map_url TEXT;
