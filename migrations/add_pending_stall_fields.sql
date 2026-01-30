-- Migration: Add pending_stall_name and pending_hawker_centre_id to users table
-- Run this if you have an existing database

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pending_stall_name TEXT,
ADD COLUMN IF NOT EXISTS pending_hawker_centre_id BIGINT REFERENCES hawker_centres(id) ON DELETE SET NULL;

COMMENT ON COLUMN users.pending_stall_name IS 'Store requested stall name during signup (before approval)';
COMMENT ON COLUMN users.pending_hawker_centre_id IS 'Store requested hawker centre ID during signup (before approval)';



