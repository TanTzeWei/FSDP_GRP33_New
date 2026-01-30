-- Add OAuth fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),  -- 'google', 'facebook', etc.
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),        -- unique ID from provider
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),      -- profile picture URL
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Password is optional for OAuth users
ALTER TABLE users 
ALTER COLUMN password DROP NOT NULL;

-- Create unique constraint on oauth_provider + oauth_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth 
ON users(oauth_provider, oauth_id) 
WHERE oauth_provider IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
