-- Keep the room-booking and visit records in sync when either side is deleted.
ALTER TABLE room_bookings
    DROP CONSTRAINT IF EXISTS room_bookings_linked_visit_id_fkey;

ALTER TABLE room_bookings
    ADD CONSTRAINT room_bookings_linked_visit_id_fkey
        FOREIGN KEY (linked_visit_id) REFERENCES visits(id) ON DELETE CASCADE;

ALTER TABLE visits
    DROP CONSTRAINT IF EXISTS visits_linked_booking_id_fkey;

ALTER TABLE visits
    ADD CONSTRAINT visits_linked_booking_id_fkey
        FOREIGN KEY (linked_booking_id) REFERENCES room_bookings(id) ON DELETE CASCADE;
