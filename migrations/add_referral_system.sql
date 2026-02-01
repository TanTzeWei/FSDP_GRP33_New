-- Migration: Referral links + rewards (viral loop)
-- 1. Add referral_code to users (unique, per-user code like REF123)
-- 2. Create referrals table: referrer_id, referee_id, created_at
-- 3. Allow 'referral' in points_history.transaction_type

-- Add referral_code to users (Supabase/PostgreSQL)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create unique index for fast lookups (if not already unique from above)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Backfill referral codes for existing users (format: REF + zero-padded user_id for uniqueness)
UPDATE users
SET referral_code = 'REF' || LPAD(user_id::TEXT, 6, '0')
WHERE referral_code IS NULL;

-- Referrals table: who referred whom, when
CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  referee_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(created_at DESC);

-- Allow 'referral' in points_history (PostgreSQL: drop constraint and re-add)
ALTER TABLE points_history
DROP CONSTRAINT IF EXISTS points_history_transaction_type_check;

ALTER TABLE points_history
ADD CONSTRAINT points_history_transaction_type_check
CHECK (transaction_type IN ('upload','upvote','redeem','adjust','referral'));
