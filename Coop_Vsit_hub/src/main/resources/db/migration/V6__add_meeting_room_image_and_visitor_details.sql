-- =============================================================================
-- Migration: V6__add_meeting_room_image_and_visitor_details.sql
-- Description: Adds image_url to meeting_rooms and comprehensive optional
-- visitor demographic fields to visits table (matching Front Desk registration).
-- =============================================================================

-- 1. Add image_url to meeting_rooms table
ALTER TABLE meeting_rooms ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Add visitor demographic fields to visits table (All Optional)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_first_name VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_middle_name VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_surname VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_id_number VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_phone VARCHAR(50);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_email VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_date_of_birth DATE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_issued_date DATE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_expired_date DATE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_gender VARCHAR(20);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_citizenship VARCHAR(100) DEFAULT 'Ethiopian';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_region VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_zone VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_woreda VARCHAR(100);
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_id_type VARCHAR(50) DEFAULT 'National ID';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visitor_id_photo_url TEXT;

-- Update initial meeting room images with high-resolution representative previews
UPDATE meeting_rooms 
SET image_url = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
WHERE name LIKE '%Boardroom%';

UPDATE meeting_rooms 
SET image_url = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
WHERE name LIKE '%Room A%' OR name LIKE '%Innovation%';

UPDATE meeting_rooms 
SET image_url = 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80'
WHERE name LIKE '%Peering%' OR name LIKE '%Room B%';

UPDATE meeting_rooms 
SET image_url = 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=80'
WHERE name LIKE '%Lounge%' OR name LIKE '%VIP%';
