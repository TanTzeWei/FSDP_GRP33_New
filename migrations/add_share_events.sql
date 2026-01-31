-- =========================================
-- Share Events Table (for analytics + rewards)
-- =========================================
CREATE TABLE IF NOT EXISTS share_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('centre', 'stall', 'dish')),
  reference_id BIGINT NOT NULL,
  platform TEXT, -- 'whatsapp', 'telegram', 'twitter', 'copy', 'native', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_events_type ON share_events(share_type);
CREATE INDEX IF NOT EXISTS idx_share_events_reference ON share_events(share_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON share_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_id);

COMMENT ON TABLE share_events IS 'Tracks shares for analytics and optional rewards';
