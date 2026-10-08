-- Prevent overlapping confirmed reservations even when two requests arrive concurrently.
-- PostgreSQL's exclusion constraint is the authoritative guard; the service query
-- remains useful for returning a friendly conflict message before insert.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE room_bookings
    ADD CONSTRAINT ex_room_bookings_no_confirmed_overlap
    EXCLUDE USING gist (
        lower(room_name) WITH =,
        tstzrange(scheduled_start_time, scheduled_end_time, '[)') WITH &&
    )
    WHERE (status = 'CONFIRMED');
