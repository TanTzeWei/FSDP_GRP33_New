-- Remove dietary_info column from food_items table
-- Run this in your Supabase SQL Editor

-- Drop the dietary_info column
ALTER TABLE food_items 
DROP COLUMN IF EXISTS dietary_info;

-- Verify the column has been removed
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'food_items' 
-- ORDER BY ordinal_position;

