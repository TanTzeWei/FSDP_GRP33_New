-- Add social media URL columns to stalls table
ALTER TABLE stalls 
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);

-- Add indexes for searching
CREATE INDEX IF NOT EXISTS idx_stalls_facebook ON stalls(facebook_url);
CREATE INDEX IF NOT EXISTS idx_stalls_instagram ON stalls(instagram_url);
