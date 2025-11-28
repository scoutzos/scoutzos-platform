-- Add coordinates to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing deals with mock coordinates (centered around Austin, TX for demo)
-- Spread them out slightly so they don't overlap
UPDATE deals 
SET 
    latitude = 30.2672 + (random() * 0.1 - 0.05),
    longitude = -97.7431 + (random() * 0.1 - 0.05)
WHERE latitude IS NULL;
