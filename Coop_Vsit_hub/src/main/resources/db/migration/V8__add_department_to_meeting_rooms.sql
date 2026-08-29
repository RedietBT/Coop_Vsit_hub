-- =============================================================================
-- Migration: V8__add_department_to_meeting_rooms.sql
-- Description: Associate meeting rooms with managing departments and decouple visits from visitor departments
-- =============================================================================

-- 1. Add department column to meeting_rooms
ALTER TABLE meeting_rooms ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 2. Link existing seed meeting rooms to initial departments
UPDATE meeting_rooms SET department = 'Executive Office' WHERE name LIKE '%Executive%' AND department IS NULL;
UPDATE meeting_rooms SET department = 'Digital Banking & MSME' WHERE name LIKE '%FinTech%' AND department IS NULL;
UPDATE meeting_rooms SET department = 'Retail Banking & MSME' WHERE name LIKE '%Strategic%' AND department IS NULL;
UPDATE meeting_rooms SET department = 'Operations & Front Desk' WHERE name LIKE '%VIP Lounge%' AND department IS NULL;
UPDATE meeting_rooms SET department = 'Executive Office' WHERE department IS NULL;

-- 3. Make requesting_department in visits table nullable
ALTER TABLE visits ALTER COLUMN requesting_department DROP NOT NULL;
