-- Migration: Add rent estimate columns to deals table
-- Date: 2024-11-28
-- Description: Add separate columns for Zillow and RentCast rent estimates

-- Add Zillow rent estimate column (from rentZestimate)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS zillow_rent_estimate NUMERIC(10,2);

-- Add RentCast rent estimate column
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rentcast_rent_estimate NUMERIC(10,2);

-- Add comment explaining the columns
COMMENT ON COLUMN deals.zillow_rent_estimate IS 'Rent estimate from Zillow rentZestimate';
COMMENT ON COLUMN deals.rentcast_rent_estimate IS 'Rent estimate from RentCast API';
COMMENT ON COLUMN deals.estimated_rent IS 'Best available rent estimate: rentcast > zillow > calculated (0.7% rule)';

-- Create index for filtering by rent estimates
CREATE INDEX IF NOT EXISTS idx_deals_zillow_rent ON deals(zillow_rent_estimate) WHERE zillow_rent_estimate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_rentcast_rent ON deals(rentcast_rent_estimate) WHERE rentcast_rent_estimate IS NOT NULL;
