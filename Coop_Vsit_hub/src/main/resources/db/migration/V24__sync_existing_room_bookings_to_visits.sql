-- =============================================================================
-- Migration V24: Sync and Backfill Existing Room Bookings to Visits
-- Cooperative Bank of Oromia - CoopBank Visit Hub
-- =============================================================================

DO $$
DECLARE
    rec RECORD;
    new_visit_id UUID;
    v_code VARCHAR(30);
    req_id UUID;
    prefix VARCHAR(20);
    counter INT := 1;
BEGIN
    -- Fallback requester if not matched to specific user
    SELECT id INTO req_id FROM users WHERE username = 'admin' LIMIT 1;
    IF req_id IS NULL THEN
        SELECT id INTO req_id FROM users LIMIT 1;
    END IF;

    prefix := 'VIS-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-';

    FOR rec IN 
        SELECT rb.*, u.id AS resolved_user_id
        FROM room_bookings rb
        LEFT JOIN users u ON (
            (rb.booked_by_email IS NOT NULL AND LOWER(u.email) = LOWER(rb.booked_by_email))
            OR (rb.booked_by_username IS NOT NULL AND LOWER(u.username) = LOWER(rb.booked_by_username))
            OR (rb.booked_by_user_id IS NOT NULL AND u.id = rb.booked_by_user_id)
        )
        WHERE rb.linked_visit_id IS NULL
        ORDER BY rb.created_at ASC
    LOOP
        v_code := prefix || LPAD(counter::TEXT, 5, '0');
        WHILE EXISTS (SELECT 1 FROM visits WHERE visit_code = v_code) LOOP
            counter := counter + 1;
            v_code := prefix || LPAD(counter::TEXT, 5, '0');
        END LOOP;

        new_visit_id := gen_random_uuid();

        INSERT INTO visits (
            id,
            visit_code,
            title,
            requesting_department,
            visit_type,
            visit_objective,
            priority_level,
            status,
            location_room,
            visitor_count,
            guest_category,
            visitor_first_name,
            requester_id,
            scheduled_start_time,
            scheduled_end_time,
            linked_booking_id,
            created_at,
            updated_at
        ) VALUES (
            new_visit_id,
            v_code,
            rec.meeting_title,
            COALESCE(NULLIF(rec.host_department, ''), 'General Management'),
            'EXTERNAL',
            COALESCE(NULLIF(rec.meeting_agenda, ''), 'Boardroom reservation for ' || rec.meeting_title),
            'MEDIUM',
            CASE WHEN rec.status = 'CANCELLED' THEN 'CANCELLED' ELSE 'SCHEDULED' END,
            rec.room_name,
            COALESCE(rec.expected_attendees, 1),
            CASE WHEN rec.guest_organization_name IS NOT NULL AND rec.guest_organization_name <> '' THEN 'ORGANIZATION' ELSE 'INDIVIDUAL' END,
            COALESCE(NULLIF(rec.guest_name, ''), NULLIF(rec.guest_organization_name, ''), rec.booked_by_name),
            COALESCE(rec.resolved_user_id, req_id),
            rec.scheduled_start_time,
            rec.scheduled_end_time,
            rec.id,
            rec.created_at,
            rec.updated_at
        );

        UPDATE room_bookings 
        SET linked_visit_id = new_visit_id 
        WHERE id = rec.id;

        counter := counter + 1;
    END LOOP;
END $$;
