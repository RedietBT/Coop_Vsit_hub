-- =============================================================================
-- Migration V18: Update Meeting Rooms with Authentic CoopBank Facility Photography
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

-- 1. Ensure the 5th facility (Hospitality & Dining Suite) exists
INSERT INTO meeting_rooms (name, floor_location, capacity, department, description, is_active)
VALUES (
    'Executive Hospitality & Dining Facility',
    '2nd Floor, Hospitality & Dining Wing',
    16,
    'Operations & Front Desk',
    'Spacious hospitality and executive dining facility equipped with presentation connectivity and catering amenities.',
    true
)
ON CONFLICT (name) DO NOTHING;

-- 2. Update all meeting room images to the authentic CoopBank facility photos
UPDATE meeting_rooms
SET image_url = '/rooms/executive-boardroom.jpg'
WHERE name ILIKE '%Executive%' OR name ILIKE '%Boardroom%';

UPDATE meeting_rooms
SET image_url = '/rooms/fintech-bar-counter.jpg'
WHERE name ILIKE '%FinTech%' OR name ILIKE '%Innovation%' OR name ILIKE '%Room A%';

UPDATE meeting_rooms
SET image_url = '/rooms/africa-table.jpg'
WHERE name ILIKE '%Strategic%' OR name ILIKE '%Peering%' OR name ILIKE '%Room B%' OR name ILIKE '%Africa%';

UPDATE meeting_rooms
SET image_url = '/rooms/creative-lounge-stools.jpg'
WHERE name ILIKE '%VIP%' OR name ILIKE '%Lounge%' OR name ILIKE '%Creative%';

UPDATE meeting_rooms
SET image_url = '/rooms/cafeteria-collaboration-table.jpg'
WHERE name ILIKE '%Hospitality%' OR name ILIKE '%Dining%' OR name ILIKE '%Cafeteria%';
