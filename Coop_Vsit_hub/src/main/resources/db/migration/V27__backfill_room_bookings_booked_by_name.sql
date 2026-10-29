-- =============================================================================
-- Migration V27: Backfill booked_by_name, booked_by_email, booked_by_phone on existing room_bookings
-- Ensures booker identity is always accurately captured and displayed across calendar & audit rosters.
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

-- 1. Backfill from users table where booked_by_user_id is set
UPDATE room_bookings rb
SET booked_by_name = TRIM(CONCAT(u.first_name, ' ', COALESCE(NULLIF(u.middle_name, '') || ' ', ''), u.last_name)),
    booked_by_email = COALESCE(NULLIF(rb.booked_by_email, ''), u.email),
    booked_by_phone = COALESCE(NULLIF(rb.booked_by_phone, ''), u.phone_number),
    host_department = COALESCE(NULLIF(rb.host_department, ''), u.department)
FROM users u
WHERE rb.booked_by_user_id = u.id
  AND (
      rb.booked_by_name IS NULL
      OR rb.booked_by_name = ''
      OR LOWER(TRIM(rb.booked_by_name)) IN ('coop staff member', 'staff member', 'bank staff', 'staff')
      OR (rb.guest_name IS NOT NULL AND LOWER(TRIM(rb.booked_by_name)) = LOWER(TRIM(rb.guest_name)))
  );

-- 2. Backfill from users table matching email
UPDATE room_bookings rb
SET booked_by_name = TRIM(CONCAT(u.first_name, ' ', COALESCE(NULLIF(u.middle_name, '') || ' ', ''), u.last_name)),
    booked_by_user_id = COALESCE(rb.booked_by_user_id, u.id),
    booked_by_phone = COALESCE(NULLIF(rb.booked_by_phone, ''), u.phone_number),
    host_department = COALESCE(NULLIF(rb.host_department, ''), u.department)
FROM users u
WHERE rb.booked_by_email IS NOT NULL AND LOWER(TRIM(rb.booked_by_email)) = LOWER(TRIM(u.email))
  AND (
      rb.booked_by_name IS NULL
      OR rb.booked_by_name = ''
      OR LOWER(TRIM(rb.booked_by_name)) IN ('coop staff member', 'staff member', 'bank staff', 'staff')
      OR (rb.guest_name IS NOT NULL AND LOWER(TRIM(rb.booked_by_name)) = LOWER(TRIM(rb.guest_name)))
  );

-- 3. Backfill from users table matching username
UPDATE room_bookings rb
SET booked_by_name = TRIM(CONCAT(u.first_name, ' ', COALESCE(NULLIF(u.middle_name, '') || ' ', ''), u.last_name)),
    booked_by_user_id = COALESCE(rb.booked_by_user_id, u.id),
    booked_by_email = COALESCE(NULLIF(rb.booked_by_email, ''), u.email),
    booked_by_phone = COALESCE(NULLIF(rb.booked_by_phone, ''), u.phone_number),
    host_department = COALESCE(NULLIF(rb.host_department, ''), u.department)
FROM users u
WHERE rb.booked_by_username IS NOT NULL AND LOWER(TRIM(rb.booked_by_username)) = LOWER(TRIM(u.username))
  AND (
      rb.booked_by_name IS NULL
      OR rb.booked_by_name = ''
      OR LOWER(TRIM(rb.booked_by_name)) IN ('coop staff member', 'staff member', 'bank staff', 'staff')
      OR (rb.guest_name IS NOT NULL AND LOWER(TRIM(rb.booked_by_name)) = LOWER(TRIM(rb.guest_name)))
  );

-- 4. Backfill from linked visits table where visit requester is set
UPDATE room_bookings rb
SET booked_by_name = TRIM(CONCAT(u.first_name, ' ', COALESCE(NULLIF(u.middle_name, '') || ' ', ''), u.last_name)),
    booked_by_user_id = COALESCE(rb.booked_by_user_id, u.id),
    booked_by_email = COALESCE(NULLIF(rb.booked_by_email, ''), u.email),
    booked_by_phone = COALESCE(NULLIF(rb.booked_by_phone, ''), u.phone_number),
    host_department = COALESCE(NULLIF(rb.host_department, ''), v.requesting_department, u.department)
FROM visits v
JOIN users u ON v.requester_id = u.id
WHERE rb.linked_visit_id = v.id
  AND (
      rb.booked_by_name IS NULL
      OR rb.booked_by_name = ''
      OR LOWER(TRIM(rb.booked_by_name)) IN ('coop staff member', 'staff member', 'bank staff', 'staff')
      OR (rb.guest_name IS NOT NULL AND LOWER(TRIM(rb.booked_by_name)) = LOWER(TRIM(rb.guest_name)))
  );

