-- =============================================================================
-- CoopBank Visit Hub: Cleanup Test Users Script (Run Before Production Go-Live)
-- =============================================================================
-- Completely removes all test personas, their role assignments, and test bookings.
-- Leaves real system administrators and production records intact.
-- =============================================================================

DO $$
DECLARE
    test_usernames TEXT[] := ARRAY['director_corp', 'secretary_corp', 'director_retail', 'secretary_retail', 'staff_test', 'rm_test', 'security_test'];
BEGIN
    -- 1. Remove room bookings created by test users
    DELETE FROM room_bookings 
    WHERE booked_by_username = ANY(test_usernames);

    -- 2. Remove visits created by test users
    DELETE FROM visits 
    WHERE requester_username = ANY(test_usernames);

    -- 3. Remove user_roles mappings for test users
    DELETE FROM user_roles 
    WHERE user_id IN (SELECT id FROM users WHERE username = ANY(test_usernames));

    -- 4. Delete the test user records
    DELETE FROM users 
    WHERE username = ANY(test_usernames);

    RAISE NOTICE 'Successfully purged all test users and associated temporary test data.';
END $$;
