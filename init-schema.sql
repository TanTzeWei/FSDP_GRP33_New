

-- Hawker Hub Database Schema (SQL Server Version)
-- Initialize database for hawker centre locations and user management

-- Users table for authentication
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
END;

-- Hawker centres table with location and details
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'hawker_centres')
BEGIN
    CREATE TABLE hawker_centres (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        address NVARCHAR(500) NOT NULL,
        postal_code NVARCHAR(10),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        opening_hours NVARCHAR(255),
        closing_hours NVARCHAR(255),
        operating_days NVARCHAR(100), -- e.g., "Monday-Sunday" or "Closed on Tuesdays"
        total_stalls INT DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        image_url NVARCHAR(500),
        facilities NVARCHAR(MAX), -- JSON string for facilities
        contact_phone NVARCHAR(20),
        managed_by NVARCHAR(255), -- e.g., "NEA", "HDB", "Private"
        status NVARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Temporarily Closed', 'Under Renovation', 'Closed')),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    -- Create indexes separately
    CREATE INDEX idx_coordinates ON hawker_centres (latitude, longitude);
    CREATE INDEX idx_name ON hawker_centres (name);
    CREATE INDEX idx_status ON hawker_centres (status);
END;

-- Cuisine types table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cuisine_types')
BEGIN
    CREATE TABLE cuisine_types (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(MAX),
        icon NVARCHAR(10), -- emoji or icon identifier
        color NVARCHAR(7), -- hex color code
        created_at DATETIME2 DEFAULT GETDATE()
    );
END;

-- Stalls within hawker centres
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'stalls')
BEGIN
    CREATE TABLE stalls (
        id INT IDENTITY(1,1) PRIMARY KEY,
        hawker_centre_id INT NOT NULL,
        stall_number NVARCHAR(20),
        stall_name NVARCHAR(255) NOT NULL,
        cuisine_type_id INT,
        description NVARCHAR(MAX),
        specialties NVARCHAR(MAX), -- JSON string for signature dishes
        price_range NVARCHAR(10) DEFAULT '$' CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
        rating DECIMAL(3, 2) DEFAULT 0.00,
        total_reviews INT DEFAULT 0,
        opening_hours NVARCHAR(255),
        closing_hours NVARCHAR(255),
        operating_days NVARCHAR(100),
        contact_phone NVARCHAR(20),
        status NVARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Temporarily Closed', 'Closed')),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        FOREIGN KEY (hawker_centre_id) REFERENCES hawker_centres(id) ON DELETE CASCADE,
        FOREIGN KEY (cuisine_type_id) REFERENCES cuisine_types(id) ON DELETE SET NULL
    );
    
    -- Create indexes separately
    CREATE INDEX idx_hawker_centre ON stalls (hawker_centre_id);
    CREATE INDEX idx_cuisine ON stalls (cuisine_type_id);
    CREATE INDEX idx_rating ON stalls (rating);
END;

-- Food items/menu items for each stall
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'food_items')
BEGIN
    CREATE TABLE food_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        stall_id INT NOT NULL,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        price DECIMAL(8, 2) NOT NULL,
        image_url NVARCHAR(500),
        category NVARCHAR(100), -- e.g., "Mains", "Sides", "Beverages", "Desserts"
        spice_level NVARCHAR(20) CHECK (spice_level IN ('None', 'Mild', 'Medium', 'Hot', 'Extra Hot')),
        dietary_info NVARCHAR(MAX), -- JSON string for dietary information
        calories INT,
        is_available BIT DEFAULT 1,
        is_popular BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_food_items_stall FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE CASCADE
    );
    
    -- Create indexes
    CREATE INDEX idx_stall ON food_items (stall_id);
    CREATE INDEX idx_category ON food_items (category);
    CREATE INDEX idx_price ON food_items (price);
    CREATE INDEX idx_popular ON food_items (is_popular);
END;

-- Reviews and ratings
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reviews')
BEGIN
    CREATE TABLE reviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        hawker_centre_id INT,
        stall_id INT,
        food_item_id INT,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment NVARCHAR(MAX),
        images NVARCHAR(MAX), -- JSON string for image URLs
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_reviews_user FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE SET NULL,
        CONSTRAINT FK_reviews_hawker_centre FOREIGN KEY (hawker_centre_id) REFERENCES hawker_centres(id) ON DELETE NO ACTION,
        CONSTRAINT FK_reviews_stall FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE NO ACTION,
        CONSTRAINT FK_reviews_food_item FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE NO ACTION
    );
    
    -- Create indexes
    CREATE INDEX idx_user ON reviews (user_id);
    CREATE INDEX idx_hawker_centre ON reviews (hawker_centre_id);
    CREATE INDEX idx_stall ON reviews (stall_id);
    CREATE INDEX idx_rating ON reviews (rating);
END;

-- Orders table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        hawker_centre_id INT NOT NULL,
        order_number NVARCHAR(50) UNIQUE NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status NVARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
        order_type NVARCHAR(20) DEFAULT 'Dine In' CHECK (order_type IN ('Dine In', 'Takeaway', 'Delivery')),
        pickup_time DATETIME2 NULL,
        special_instructions NVARCHAR(MAX),
        payment_method NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_orders_user FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE SET NULL,
        CONSTRAINT FK_orders_hawker_centre FOREIGN KEY (hawker_centre_id) REFERENCES hawker_centres(id) ON DELETE NO ACTION
    );
    
    -- Create indexes
    CREATE INDEX idx_user ON orders (user_id);
    CREATE INDEX idx_hawker_centre ON orders (hawker_centre_id);
    CREATE INDEX idx_status ON orders (status);
    CREATE INDEX idx_order_number ON orders (order_number);
END;

-- Order items
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_items')
BEGIN
    CREATE TABLE order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        stall_id INT NOT NULL,
        food_item_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(8, 2) NOT NULL,
        total_price DECIMAL(8, 2) NOT NULL,
        special_requests NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_order_items_stall FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE NO ACTION,
        CONSTRAINT FK_order_items_food_item FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE NO ACTION
    );
    
    -- Create indexes
    CREATE INDEX idx_order ON order_items (order_id);
    CREATE INDEX idx_stall ON order_items (stall_id);
END;

-- Insert initial cuisine types
IF NOT EXISTS (SELECT * FROM cuisine_types WHERE name = 'Chinese')
BEGIN
    INSERT INTO cuisine_types (name, description, icon, color) VALUES
    ('Chinese', 'Traditional Chinese dishes and flavors', N'🥢', '#FF6B6B'),
    ('Malay', 'Authentic Malay cuisine and spices', N'🌶️', '#4ECDC4'),
    ('Indian', 'Spicy and aromatic Indian dishes', N'🍛', '#45B7D1'),
    ('Peranakan', 'Unique Nyonya and Peranakan fusion', N'🦐', '#96CEB4'),
    ('Western', 'Western-style food and international cuisine', N'🍔', '#FFEAA7'),
    ('Drinks', 'Beverages, teas, and refreshments', N'🧋', '#DDA0DD'),
    ('Desserts', 'Sweet treats and traditional desserts', N'🍰', '#FFB6C1'),
    ('Seafood', 'Fresh seafood and marine delicacies', N'🦀', '#87CEEB');
END;

-- Insert sample hawker centres around Singapore
IF NOT EXISTS (SELECT * FROM hawker_centres WHERE name = 'Maxwell Food Centre')
BEGIN
    INSERT INTO hawker_centres (name, description, address, postal_code, latitude, longitude, opening_hours, closing_hours, operating_days, total_stalls, rating, total_reviews, facilities, contact_phone, managed_by) VALUES
    ('Maxwell Food Centre', 'One of Singapore''s most famous hawker centres located in the heart of Chinatown', '1 Kadayanallur Street', '069184', 1.2800, 103.8455, '08:00', '02:00', 'Monday-Sunday', 120, 4.3, 2847, '["WiFi", "Air Conditioning", "Wheelchair Accessible"]', '+65 6225 8359', 'NEA'),
    
    ('Lau Pa Sat', 'Historic Victorian-era hawker centre in the Central Business District', '18 Raffles Quay', '048582', 1.2806, 103.8505, '24 Hours', '24 Hours', 'Monday-Sunday', 80, 4.1, 1923, '["24/7", "Historic Building", "Tourist Attraction"]', '+65 6220 2138', 'NEA'),
    
    ('Newton Food Centre', 'Popular late-night hawker centre known for seafood and satay', '500 Clemenceau Avenue North', '229495', 1.3129, 103.8439, '12:00', '02:00', 'Monday-Sunday', 86, 3.9, 1654, '["Late Night", "Outdoor Seating", "Tourist Popular"]', '+65 6235 1471', 'NEA'),
    
    ('Chinatown Complex Food Centre', 'Large hawker centre with diverse food options in Chinatown', '335 Smith Street', '050335', 1.2820, 103.8430, '06:00', '02:00', 'Monday-Sunday', 260, 4.2, 3421, '["Large Complex", "Wet Market", "Multiple Levels"]', '+65 6534 6984', 'HDB'),
    
    ('Tekka Centre', 'Vibrant Little India hawker centre with authentic Indian cuisine', '665 Buffalo Road', '210665', 1.3067, 103.8526, '06:00', '22:00', 'Monday-Sunday', 175, 4.0, 1876, '["Cultural Hub", "Wet Market", "Indian Cuisine"]', '+65 6297 1059', 'HDB'),
    
    ('Tiong Bahru Market', 'Trendy heritage hawker centre in hip Tiong Bahru district', '30 Seng Poh Road', '160030', 1.2853, 103.8267, '06:00', '15:00', 'Monday-Sunday', 50, 4.4, 987, '["Heritage", "Hipster Area", "Morning Market"]', '+65 6270 7611', 'HDB'),
    
    ('Old Airport Road Food Centre', 'Large hawker centre near former Kallang Airport with famous local dishes', '51 Old Airport Road', '390051', 1.3000, 103.8735, '06:00', '02:00', 'Monday-Sunday', 180, 4.1, 2156, '["Famous Hokkien Mee", "Large Parking", "Local Favorite"]', '+65 6748 0292', 'NEA'),
    
    ('Amoy Street Food Centre', 'Business district hawker centre popular with office workers', '7 Maxwell Road', '069111', 1.2794, 103.8447, '07:00', '20:00', 'Monday-Saturday', 45, 4.0, 765, '["Business District", "Lunch Crowd", "Air Conditioning"]', '+65 6224 4563', 'NEA'),
    
    ('East Coast Lagoon Food Village', 'Seaside hawker centre with sea breeze and sunset views', '1220 East Coast Parkway', '468960', 1.3015, 103.9067, '17:00', '02:00', 'Monday-Sunday', 35, 3.8, 1243, '["Seaside", "Sunset Views", "BBQ Seafood"]', '+65 6448 5672', 'NEA'),
    
    ('Chomp Chomp Food Centre', 'Popular evening and night hawker centre in Serangoon Gardens', '20 Kensington Park Road', '557269', 1.3665, 103.8651, '17:00', '02:00', 'Monday-Sunday', 28, 4.2, 892, '["Evening Only", "Local Neighborhood", "Famous Satay"]', '+65 6280 8712', 'NEA');
END;

-- Create additional indexes for better performance (only if they don't exist)
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_hawker_location' AND object_id = OBJECT_ID('hawker_centres'))
    CREATE INDEX idx_hawker_location ON hawker_centres(latitude, longitude);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_hawker_rating' AND object_id = OBJECT_ID('hawker_centres'))
    CREATE INDEX idx_hawker_rating ON hawker_centres(rating DESC);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_stall_hawker_cuisine' AND object_id = OBJECT_ID('stalls'))
    CREATE INDEX idx_stall_hawker_cuisine ON stalls(hawker_centre_id, cuisine_type_id);

-- Create a view for hawker centre summary with stall counts by cuisine (SQL Server version)
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'hawker_centre_summary')
BEGIN
    EXEC('CREATE VIEW hawker_centre_summary AS
    SELECT 
        hc.*,
        COUNT(DISTINCT s.id) as active_stalls,
        STRING_AGG(ct.name, '', '') as available_cuisines,
        AVG(CAST(s.rating as FLOAT)) as average_stall_rating
    FROM hawker_centres hc
    LEFT JOIN stalls s ON hc.id = s.hawker_centre_id AND s.status = ''Active''
    LEFT JOIN cuisine_types ct ON s.cuisine_type_id = ct.id
    WHERE hc.status = ''Active''
    GROUP BY hc.id, hc.name, hc.description, hc.address, hc.postal_code, hc.latitude, hc.longitude, hc.opening_hours, hc.closing_hours, hc.operating_days, hc.total_stalls, hc.rating, hc.total_reviews, hc.image_url, hc.facilities, hc.contact_phone, hc.managed_by, hc.status, hc.created_at, hc.updated_at');
END;

-- Points System Tables

-- User points table to track current points balance
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_points')
BEGIN
    CREATE TABLE user_points (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        total_points INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_user_points_user FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_user_points_user ON user_points(user_id);
END;

-- Points history to track all point transactions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'points_history')
BEGIN
    CREATE TABLE points_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        transaction_type NVARCHAR(50) NOT NULL CHECK (transaction_type IN ('upload', 'upvote', 'redeem', 'adjust')),
        points INT NOT NULL, -- Positive for earning, negative for spending
        description NVARCHAR(MAX),
        reference_type NVARCHAR(50), -- 'photo', 'review', 'voucher', etc.
        reference_id INT, -- ID of the related entity
        item_details NVARCHAR(MAX), -- JSON string with additional details
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_points_history_user FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_points_history_user ON points_history(user_id);
    CREATE INDEX idx_points_history_type ON points_history(transaction_type);
    CREATE INDEX idx_points_history_date ON points_history(created_at DESC);
END;

-- Vouchers catalog
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vouchers')
BEGIN
    CREATE TABLE vouchers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        voucher_type NVARCHAR(50) NOT NULL CHECK (voucher_type IN ('discount', 'free_item', 'cashback')),
        discount_value DECIMAL(10, 2), -- Discount amount in dollars
        minimum_purchase DECIMAL(10, 2) DEFAULT 0, -- Minimum purchase requirement
        points_required INT NOT NULL,
        validity_days INT DEFAULT 30, -- Days until voucher expires after redemption
        is_active BIT DEFAULT 1,
        terms_conditions NVARCHAR(MAX), -- JSON string with T&C
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_vouchers_active ON vouchers(is_active);
    CREATE INDEX idx_vouchers_points ON vouchers(points_required);
END;

-- Redeemed vouchers
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'redeemed_vouchers')
BEGIN
    CREATE TABLE redeemed_vouchers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        voucher_id INT NOT NULL,
        voucher_code NVARCHAR(20) NOT NULL UNIQUE,
        redeemed_date DATETIME2 DEFAULT GETDATE(),
        expiry_date DATETIME2 NOT NULL,
        is_used BIT DEFAULT 0,
        used_date DATETIME2,
        order_id INT, -- Reference to order if used
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_redeemed_vouchers_user FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE,
        CONSTRAINT FK_redeemed_vouchers_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE NO ACTION
    );
    
    CREATE INDEX idx_redeemed_vouchers_user ON redeemed_vouchers(user_id);
    CREATE INDEX idx_redeemed_vouchers_code ON redeemed_vouchers(voucher_code);
    CREATE INDEX idx_redeemed_vouchers_used ON redeemed_vouchers(is_used);
    CREATE INDEX idx_redeemed_vouchers_expiry ON redeemed_vouchers(expiry_date);
END;

-- Insert default vouchers
IF NOT EXISTS (SELECT * FROM vouchers WHERE name = 'FREE DRINK')
BEGIN
    INSERT INTO vouchers (name, description, voucher_type, discount_value, minimum_purchase, points_required, validity_days, terms_conditions) VALUES
    ('FREE DRINK', 'Any drink up to $2.50', 'free_item', 2.50, 0, 20, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$3 OFF', 'Get $3 off on any purchase above $10', 'discount', 3.00, 10.00, 30, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('FREE SIDE DISH', 'Any side dish up to $3.50', 'free_item', 3.50, 0, 40, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$5 OFF', 'Get $5 off on any purchase above $15', 'discount', 5.00, 15.00, 50, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$10 OFF', 'Get $10 off on any purchase above $25', 'discount', 10.00, 25.00, 100, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$15 OFF', 'Get $15 off on any purchase above $40', 'discount', 15.00, 40.00, 150, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]');
END;

-- Points System Tables

-- User points table to track current points balance
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_points')
BEGIN
    CREATE TABLE user_points (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        total_points INT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_user_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_user_points_user ON user_points(user_id);
END;

-- Points history to track all point transactions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'points_history')
BEGIN
    CREATE TABLE points_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        transaction_type NVARCHAR(50) NOT NULL CHECK (transaction_type IN ('upload', 'upvote', 'redeem', 'adjust')),
        points INT NOT NULL, -- Positive for earning, negative for spending
        description NVARCHAR(MAX),
        reference_type NVARCHAR(50), -- 'photo', 'review', 'voucher', etc.
        reference_id INT, -- ID of the related entity
        item_details NVARCHAR(MAX), -- JSON string with additional details
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_points_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_points_history_user ON points_history(user_id);
    CREATE INDEX idx_points_history_type ON points_history(transaction_type);
    CREATE INDEX idx_points_history_date ON points_history(created_at DESC);
END;

-- Vouchers catalog
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vouchers')
BEGIN
    CREATE TABLE vouchers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        voucher_type NVARCHAR(50) NOT NULL CHECK (voucher_type IN ('discount', 'free_item', 'cashback')),
        discount_value DECIMAL(10, 2), -- Discount amount in dollars
        minimum_purchase DECIMAL(10, 2) DEFAULT 0, -- Minimum purchase requirement
        points_required INT NOT NULL,
        validity_days INT DEFAULT 30, -- Days until voucher expires after redemption
        is_active BIT DEFAULT 1,
        terms_conditions NVARCHAR(MAX), -- JSON string with T&C
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_vouchers_active ON vouchers(is_active);
    CREATE INDEX idx_vouchers_points ON vouchers(points_required);
END;

-- Redeemed vouchers
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'redeemed_vouchers')
BEGIN
    CREATE TABLE redeemed_vouchers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        voucher_id INT NOT NULL,
        voucher_code NVARCHAR(20) NOT NULL UNIQUE,
        redeemed_date DATETIME2 DEFAULT GETDATE(),
        expiry_date DATETIME2 NOT NULL,
        is_used BIT DEFAULT 0,
        used_date DATETIME2,
        order_id INT, -- Reference to order if used
        created_at DATETIME2 DEFAULT GETDATE(),
        
        CONSTRAINT FK_redeemed_vouchers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_redeemed_vouchers_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE NO ACTION
    );
    
    CREATE INDEX idx_redeemed_vouchers_user ON redeemed_vouchers(user_id);
    CREATE INDEX idx_redeemed_vouchers_code ON redeemed_vouchers(voucher_code);
    CREATE INDEX idx_redeemed_vouchers_used ON redeemed_vouchers(is_used);
    CREATE INDEX idx_redeemed_vouchers_expiry ON redeemed_vouchers(expiry_date);
END;

-- Insert default vouchers
IF NOT EXISTS (SELECT * FROM vouchers WHERE name = 'FREE DRINK')
BEGIN
    INSERT INTO vouchers (name, description, voucher_type, discount_value, minimum_purchase, points_required, validity_days, terms_conditions) VALUES
    ('FREE DRINK', 'Any drink up to $2.50', 'free_item', 2.50, 0, 20, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$3 OFF', 'Get $3 off on any purchase above $10', 'discount', 3.00, 10.00, 30, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('FREE SIDE DISH', 'Any side dish up to $3.50', 'free_item', 3.50, 0, 40, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$5 OFF', 'Get $5 off on any purchase above $15', 'discount', 5.00, 15.00, 50, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$10 OFF', 'Get $10 off on any purchase above $25', 'discount', 10.00, 25.00, 100, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]'),
    ('$15 OFF', 'Get $15 off on any purchase above $40', 'discount', 15.00, 40.00, 150, 30, '["Voucher valid for 30 days after redemption","Cannot be combined with other offers","Non-refundable and non-transferable","Valid at all participating hawker stalls"]');
END;

PRINT 'Hawker Hub database schema created successfully!';
PRINT 'Tables created: users, cuisine_types, hawker_centres, stalls, food_items, reviews, orders, order_items, user_points, points_history, vouchers, redeemed_vouchers';
PRINT 'Sample data inserted for cuisine types, hawker centres, and vouchers.';

-- BLOB Photo Storage Tables (photos stored IN database)
-- Drop existing photo tables if they exist
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'photo_likes')
    DROP TABLE photo_likes;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'photos')
    DROP TABLE photos;

-- Photos table with BLOB storage (photos stored IN database as binary data)
CREATE TABLE photos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    hawker_centre_id INT NOT NULL,
    stall_id INT NULL,
    food_item_id INT NULL,
    original_filename NVARCHAR(255) NOT NULL,
    photo_data VARBINARY(MAX) NOT NULL, -- Photo stored as binary data in database
    file_size INT NOT NULL, -- Size in bytes
    mime_type NVARCHAR(100) NOT NULL, -- e.g., 'image/jpeg'
    dish_name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    likes_count INT DEFAULT 0,
    is_featured BIT DEFAULT 0,
    is_approved BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Foreign keys
    CONSTRAINT FK_photos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photos_hawker_centre FOREIGN KEY (hawker_centre_id) REFERENCES hawker_centres(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photos_stall FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photos_food_item FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE NO ACTION
);

-- Photo likes table
CREATE TABLE photo_likes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    photo_id INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_photo_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photo_likes_photo FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    CONSTRAINT UQ_user_photo_like UNIQUE (user_id, photo_id)
);

-- Indexes for performance
CREATE INDEX idx_photos_user ON photos (user_id);
CREATE INDEX idx_photos_hawker_centre ON photos (hawker_centre_id);
CREATE INDEX idx_photos_stall ON photos (stall_id);
CREATE INDEX idx_photos_likes ON photos (likes_count DESC);
CREATE INDEX idx_photos_featured ON photos (is_featured, likes_count DESC);
CREATE INDEX idx_photo_likes_photo ON photo_likes (photo_id);
CREATE INDEX idx_photo_likes_user ON photo_likes (user_id);

PRINT 'BLOB Photo storage tables created successfully!';

-- BLOB Photo Storage Tables (photos stored IN database as binary data)
-- Drop existing photo tables if they exist to recreate with BLOB storage
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'photo_likes')
    DROP TABLE photo_likes;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'photos')
    DROP TABLE photos;

-- Photos table with BLOB storage (photos stored IN database as binary data)
CREATE TABLE photos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    hawker_centre_id INT NOT NULL,
    stall_id INT NULL,
    food_item_id INT NULL,
    original_filename NVARCHAR(255) NOT NULL,
    photo_data VARBINARY(MAX) NOT NULL, -- Photo stored as binary data in database
    file_size INT NOT NULL, -- Size in bytes
    mime_type NVARCHAR(100) NOT NULL, -- e.g., 'image/jpeg'
    dish_name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    likes_count INT DEFAULT 0,
    is_featured BIT DEFAULT 0,
    is_approved BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Foreign keys (referencing the correct users table)
    CONSTRAINT FK_photos_user_blob FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photos_hawker_centre_blob FOREIGN KEY (hawker_centre_id) REFERENCES hawker_centres(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photos_stall_blob FOREIGN KEY (stall_id) REFERENCES stalls(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photos_food_item_blob FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE NO ACTION
);

-- Photo likes table
CREATE TABLE photo_likes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    photo_id INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_photo_likes_user_blob FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION,
    CONSTRAINT FK_photo_likes_photo_blob FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    CONSTRAINT UQ_user_photo_like_blob UNIQUE (user_id, photo_id)
);

-- Indexes for performance
CREATE INDEX idx_photos_user_blob ON photos (user_id);
CREATE INDEX idx_photos_hawker_centre_blob ON photos (hawker_centre_id);
CREATE INDEX idx_photos_stall_blob ON photos (stall_id);
CREATE INDEX idx_photos_likes_blob ON photos (likes_count DESC);
CREATE INDEX idx_photos_featured_blob ON photos (is_featured, likes_count DESC);
CREATE INDEX idx_photo_likes_photo_blob ON photo_likes (photo_id);
CREATE INDEX idx_photo_likes_user_blob ON photo_likes (user_id);

PRINT 'Database BLOB photo storage tables created successfully! Photos will be stored in database.';

