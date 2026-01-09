-- Migration: Add image_url column to stalls table
-- Run this migration in your Supabase SQL Editor

-- Add image_url column to stalls table if it doesn't exist
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN stalls.image_url IS 'URL of the stall banner/cover image';
