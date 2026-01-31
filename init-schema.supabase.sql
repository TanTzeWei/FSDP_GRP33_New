-- =========================================
-- Hawker Hub Database Schema (Supabase / PostgreSQL)
-- =========================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- USERS
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'stall_owner', 'admin'
  is_stall_owner BOOLEAN DEFAULT FALSE,
  stall_id BIGINT REFERENCES stalls(id) ON DELETE SET NULL,
  owner_verified BOOLEAN DEFAULT FALSE,
  approval_status TEXT DEFAULT 'none', -- 'none','pending','approved','rejected'
  pending_stall_name TEXT, -- Store requested stall name during signup
  pending_hawker_centre_id BIGINT REFERENCES hawker_centres(id) ON DELETE SET NULL, -- Store requested hawker centre during signup
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CUISINE TYPES
-- =========================================
CREATE TABLE IF NOT EXISTS cuisine_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- HAWKER CENTRES
-- =========================================
CREATE TABLE IF NOT EXISTS hawker_centres (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  opening_hours TEXT,
  closing_hours TEXT,
  operating_days TEXT,
  total_stalls INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  image_url TEXT,
  facilities JSONB,
  contact_phone TEXT,
  managed_by TEXT,
  status TEXT DEFAULT 'Active'
    CHECK (status IN ('Active', 'Temporarily Closed', 'Under Renovation', 'Closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hawker_coordinates ON hawker_centres(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hawker_name ON hawker_centres(name);
CREATE INDEX IF NOT EXISTS idx_hawker_status ON hawker_centres(status);
CREATE INDEX IF NOT EXISTS idx_hawker_rating ON hawker_centres(rating DESC);

-- =========================================
-- STALLS
-- =========================================
CREATE TABLE IF NOT EXISTS stalls (
  id BIGSERIAL PRIMARY KEY,
  hawker_centre_id BIGINT NOT NULL REFERENCES hawker_centres(id) ON DELETE CASCADE,
  stall_number TEXT,
  stall_name TEXT NOT NULL,
  cuisine_type_id BIGINT REFERENCES cuisine_types(id) ON DELETE SET NULL,
  description TEXT,
  specialties JSONB,
  price_range TEXT DEFAULT '$'
    CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  opening_hours TEXT,
  closing_hours TEXT,
  operating_days TEXT,
  contact_phone TEXT,
  image_url TEXT, -- Stall banner/cover image URL
  status TEXT DEFAULT 'Active'
    CHECK (status IN ('Active', 'Temporarily Closed', 'Closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stall_hawker ON stalls(hawker_centre_id);
CREATE INDEX IF NOT EXISTS idx_stall_cuisine ON stalls(cuisine_type_id);
CREATE INDEX IF NOT EXISTS idx_stall_rating ON stalls(rating);

-- =========================================
-- FOOD ITEMS
-- =========================================
CREATE TABLE IF NOT EXISTS food_items (
  id BIGSERIAL PRIMARY KEY,
  stall_id BIGINT NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  spice_level TEXT CHECK (spice_level IN ('None','Mild','Medium','Hot','Extra Hot')),
  dietary_info JSONB,
  calories INT,
  is_available BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_stall ON food_items(stall_id);
CREATE INDEX IF NOT EXISTS idx_food_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_price ON food_items(price);
CREATE INDEX IF NOT EXISTS idx_food_popular ON food_items(is_popular);

-- =========================================
-- REVIEWS
-- =========================================
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  hawker_centre_id BIGINT REFERENCES hawker_centres(id),
  stall_id BIGINT REFERENCES stalls(id),
  food_item_id BIGINT REFERENCES food_items(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  images JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_hawker ON reviews(hawker_centre_id);
CREATE INDEX IF NOT EXISTS idx_review_stall ON reviews(stall_id);
CREATE INDEX IF NOT EXISTS idx_review_rating ON reviews(rating);

-- =========================================
-- ORDERS
-- =========================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  hawker_centre_id BIGINT NOT NULL REFERENCES hawker_centres(id),
  order_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'Pending'
    CHECK (status IN ('Pending','Confirmed','Preparing','Ready','Completed','Cancelled')),
  order_type TEXT DEFAULT 'Dine In'
    CHECK (order_type IN ('Dine In','Takeaway','Delivery')),
  pickup_time TIMESTAMPTZ,
  special_instructions TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_hawker ON orders(hawker_centre_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON orders(status);

-- =========================================
-- ORDER ITEMS
-- =========================================
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stall_id BIGINT NOT NULL REFERENCES stalls(id),
  food_item_id BIGINT NOT NULL REFERENCES food_items(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(8,2) NOT NULL,
  total_price DECIMAL(8,2) NOT NULL,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_stall ON order_items(stall_id);

-- =========================================
-- POINTS SYSTEM
-- =========================================
CREATE TABLE IF NOT EXISTS user_points (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  total_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS points_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('upload','upvote','redeem','adjust')),
  points INT NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id BIGINT,
  item_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_type ON points_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_date ON points_history(created_at DESC);

-- =========================================
-- VOUCHERS
-- =========================================
CREATE TABLE IF NOT EXISTS vouchers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  voucher_type TEXT NOT NULL
    CHECK (voucher_type IN ('discount','free_item','cashback')),
  discount_value DECIMAL(10,2),
  minimum_purchase DECIMAL(10,2) DEFAULT 0,
  points_required INT NOT NULL,
  validity_days INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  terms_conditions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_active ON vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_voucher_points ON vouchers(points_required);

-- =========================================
-- REDEEMED VOUCHERS
-- =========================================
CREATE TABLE IF NOT EXISTS redeemed_vouchers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  voucher_id BIGINT NOT NULL REFERENCES vouchers(id),
  voucher_code TEXT UNIQUE NOT NULL,
  redeemed_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_date TIMESTAMPTZ,
  order_id BIGINT REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redeem_user ON redeemed_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_redeem_code ON redeemed_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_redeem_expiry ON redeemed_vouchers(expiry_date);

-- =========================================
-- PHOTOS (Cloudinary)
-- =========================================
CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  hawker_centre_id BIGINT NOT NULL REFERENCES hawker_centres(id),
  stall_id BIGINT REFERENCES stalls(id),
  food_item_id BIGINT REFERENCES food_items(id),
  original_filename TEXT NOT NULL,
  file_path TEXT,
  image_url TEXT,
  public_id TEXT,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  description TEXT,
  likes_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_likes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  photo_id BIGINT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_user ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes ON photos(likes_count DESC);

-- =========================================
-- STALL CLOSURES
-- =========================================
CREATE TABLE IF NOT EXISTS stall_closures (
  id BIGSERIAL PRIMARY KEY,
  stall_id BIGINT NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  closure_type TEXT NOT NULL 
    CHECK (closure_type IN ('off_day', 'maintenance', 'public_holiday', 'custom', 'emergency')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB, -- JSON object for recurring patterns, e.g., {"day_of_week": 1} for every Monday
  reason TEXT,
  created_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE, -- Soft delete flag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: end_date must be after start_date
  CONSTRAINT chk_end_after_start CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_stall_closures_stall ON stall_closures(stall_id);
CREATE INDEX IF NOT EXISTS idx_stall_closures_dates ON stall_closures(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_stall_closures_active ON stall_closures(is_active);
CREATE INDEX IF NOT EXISTS idx_stall_closures_type ON stall_closures(closure_type);

COMMENT ON TABLE stall_closures IS 
  'Stores temporary closure schedules for stalls including off days, maintenance periods, and public holidays';

-- =========================================
-- PROMOTIONS/DISCOUNTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS promotions (
  id BIGSERIAL PRIMARY KEY,
  stall_id BIGINT NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  food_item_id BIGINT NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  promo_name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT chk_promo_end_after_start CHECK (end_date > start_date),
  CONSTRAINT unique_active_promo_per_item UNIQUE (food_item_id, is_active) WHERE is_active = TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_promotions_stall ON promotions(stall_id);
CREATE INDEX IF NOT EXISTS idx_promotions_food_item ON promotions(food_item_id);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_created_by ON promotions(created_by);

-- Add table comment
COMMENT ON TABLE promotions IS 'Stores promotional discounts for food items under stalls with validity periods';

-- =========================================
-- SHARE EVENTS (analytics + rewards)
-- =========================================
CREATE TABLE IF NOT EXISTS share_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('centre', 'stall', 'dish')),
  reference_id BIGINT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_events_type ON share_events(share_type);
CREATE INDEX IF NOT EXISTS idx_share_events_reference ON share_events(share_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON share_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_id);

-- =========================================
-- VIEW: HAWKER CENTRE SUMMARY
-- =========================================
CREATE OR REPLACE VIEW hawker_centre_summary AS
SELECT
  hc.*,
  COUNT(DISTINCT s.id) AS active_stalls,
  STRING_AGG(DISTINCT ct.name, ', ') AS available_cuisines,
  AVG(s.rating)::DECIMAL(3,2) AS average_stall_rating
FROM hawker_centres hc
LEFT JOIN stalls s
  ON hc.id = s.hawker_centre_id AND s.status = 'Active'
LEFT JOIN cuisine_types ct
  ON s.cuisine_type_id = ct.id
WHERE hc.status = 'Active'
GROUP BY hc.id;
