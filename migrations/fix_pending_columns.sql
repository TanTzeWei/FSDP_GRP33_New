-- Fix: Add missing pending_stall_name and pending_hawker_centre_id columns to users table
-- Run this in your Supabase SQL Editor

-- Add pending_stall_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pending_stall_name'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN pending_stall_name TEXT;
        
        COMMENT ON COLUMN users.pending_stall_name IS 'Store requested stall name during signup (before approval)';
        
        RAISE NOTICE 'Added pending_stall_name column';
    ELSE
        RAISE NOTICE 'Column pending_stall_name already exists';
    END IF;
END $$;

-- Add pending_hawker_centre_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'pending_hawker_centre_id'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN pending_hawker_centre_id BIGINT REFERENCES hawker_centres(id) ON DELETE SET NULL;
        
        COMMENT ON COLUMN users.pending_hawker_centre_id IS 'Store requested hawker centre ID during signup (before approval)';
        
        RAISE NOTICE 'Added pending_hawker_centre_id column';
    ELSE
        RAISE NOTICE 'Column pending_hawker_centre_id already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('pending_stall_name', 'pending_hawker_centre_id')
ORDER BY column_name;

