-- =============================================================================
-- Migration V30: Clean up Orphaned Room Booking Visits & Enforce Cascade Triggers
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

-- 1. Remove orphaned visits that were originally generated from room bookings
-- that no longer exist in the room_bookings table (e.g. deleted testing bookings).
DELETE FROM visits 
WHERE linked_booking_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM room_bookings rb WHERE rb.id = visits.linked_booking_id);

DELETE FROM visits 
WHERE linked_booking_id IS NULL
  AND (
      visit_objective LIKE 'Boardroom meeting in %'
      OR visit_objective LIKE 'Boardroom reservation for %'
  )
  AND NOT EXISTS (
      SELECT 1 FROM room_bookings rb 
      WHERE rb.linked_visit_id = visits.id
  );

-- 2. Clean up any notifications whose reference_id points to deleted visits or bookings
DELETE FROM notifications n
WHERE n.reference_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM visits v WHERE v.id = n.reference_id)
  AND NOT EXISTS (SELECT 1 FROM room_bookings rb WHERE rb.id = n.reference_id);

-- 3. Automatic Triggers for Mutual Cascade Deletion:
-- When a room booking is deleted directly from the database or ORM,
-- automatically delete the corresponding visit and notifications so no trace remains.
CREATE OR REPLACE FUNCTION trg_cascade_room_booking_deletion()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM visits 
    WHERE id = OLD.linked_visit_id 
       OR linked_booking_id = OLD.id;

    DELETE FROM notifications 
    WHERE reference_id = OLD.id 
       OR (OLD.booking_code IS NOT NULL AND reference_code = OLD.booking_code);

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_room_booking_cleanup ON room_bookings;
CREATE TRIGGER trg_room_booking_cleanup
AFTER DELETE ON room_bookings
FOR EACH ROW
EXECUTE FUNCTION trg_cascade_room_booking_deletion();

-- When a visit is deleted, delete any linked room booking and notifications
CREATE OR REPLACE FUNCTION trg_cascade_visit_deletion()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM room_bookings 
    WHERE id = OLD.linked_booking_id 
       OR linked_visit_id = OLD.id;

    DELETE FROM notifications 
    WHERE reference_id = OLD.id 
       OR (OLD.visit_code IS NOT NULL AND reference_code = OLD.visit_code);

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_visit_cleanup ON visits;
CREATE TRIGGER trg_visit_cleanup
AFTER DELETE ON visits
FOR EACH ROW
EXECUTE FUNCTION trg_cascade_visit_deletion();

