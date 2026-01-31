// Script to run social media migration
const supabase = require('../dbConfig');

async function runSocialMediaMigration() {
  console.log('Running social media migration...');

  try {
    // Check if columns already exist
    const { data: existingStalls, error: fetchError } = await supabase
      .from('stalls')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('Error checking stalls table:', fetchError);
      return;
    }

    // If we can query, the table exists. Now we'll use raw SQL via rpc if available,
    // or we can use Supabase client directly.
    
    // For Supabase, we can't run ALTER TABLE directly from the client
    // You need to run this in the Supabase SQL Editor
    console.log('\n⚠️  IMPORTANT: Run the following SQL in your Supabase SQL Editor:\n');
    console.log(`
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
    `);

    console.log('\n✅ Steps to run migration:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute the migration\n');

  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runSocialMediaMigration();
}

module.exports = { runSocialMediaMigration };
