-- Fix existing dietary_info values in food_items table
-- This script ensures all dietary_info values are properly formatted as JSONB
-- Run this in your Supabase SQL Editor after running insert-new-stalls.sql

-- First, set all NULL values to empty array JSONB
UPDATE food_items 
SET dietary_info = '[]'::jsonb
WHERE dietary_info IS NULL;

-- Fix empty array strings - convert to proper JSONB
UPDATE food_items 
SET dietary_info = '[]'::jsonb
WHERE dietary_info::text = '[]' 
   OR dietary_info::text = '"[]"';

-- Fix vegetarian entries - ensure they're proper JSONB arrays
UPDATE food_items 
SET dietary_info = '["vegetarian"]'::jsonb
WHERE dietary_info::text LIKE '%vegetarian%'
  AND (jsonb_typeof(dietary_info) != 'array' OR dietary_info::text = '"["vegetarian"]"');

-- For any remaining string values, try to parse them as JSONB
UPDATE food_items 
SET dietary_info = dietary_info::text::jsonb
WHERE dietary_info IS NOT NULL 
  AND jsonb_typeof(dietary_info) = 'string'
  AND dietary_info::text NOT LIKE '%vegetarian%';

-- Verification query (uncomment to check results)
-- SELECT id, name, dietary_info, jsonb_typeof(dietary_info) as type, dietary_info::text as value
-- FROM food_items 
-- WHERE stall_id IN (
--     SELECT id FROM stalls WHERE stall_name IN (
--         'Ah Hock Famous Chicken Rice',
--         'Mak Cik Siti Nasi Padang',
--         'Uncle Lim''s Char Kway Teow',
--         'Rajah''s Banana Leaf Rice',
--         'Ah Ma Handmade Fishball Noodles',
--         'Golden Wok Zi Char'
--     )
-- )
-- ORDER BY stall_id, id;

