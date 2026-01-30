-- Insert 6 new stalls with their food items (PostgreSQL/Supabase compatible)
-- Run this script in your Supabase SQL Editor

-- 1. Ah Hock Famous Chicken Rice
INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status, image_url)
SELECT 
    (SELECT id FROM hawker_centres ORDER BY id LIMIT 1),
    '01-15',
    'Ah Hock Famous Chicken Rice',
    (SELECT id FROM cuisine_types WHERE name = 'Chinese' LIMIT 1),
    'Famous Hainanese chicken rice with authentic flavors',
    '["Hainanese Steamed Chicken Rice","Roasted Chicken Rice","Soy Sauce Chicken"]'::jsonb,
    '$',
    4.6,
    145,
    '08:00',
    '20:00',
    'Monday-Sunday',
    '+65 9000 1001',
    'Active',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=600&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice');

-- Food items for Ah Hock Famous Chicken Rice
INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular, image_url)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1),
    'Hainanese Steamed Chicken Rice',
    'Tender steamed chicken with fragrant rice',
    4.50,
    'Mains',
    'Mild',
    520,
    true,
    true,
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=350&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Hainanese Steamed Chicken Rice' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular, image_url)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1),
    'Roasted Chicken Rice',
    'Crispy roasted chicken with aromatic rice',
    4.50,
    'Mains',
    'Mild',
    '[]'::jsonb,
    550,
    true,
    true,
    'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=500&h=350&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Roasted Chicken Rice' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular, image_url)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1),
    'Soy Sauce Chicken',
    'Savory soy sauce chicken',
    5.00,
    'Mains',
    'None',
    '[]'::jsonb,
    480,
    true,
    false,
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=500&h=350&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Soy Sauce Chicken' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular, image_url)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1),
    'Braised Egg',
    'Soft braised egg in soy sauce',
    1.00,
    'Sides',
    'None',
    '[]'::jsonb,
    80,
    true,
    false,
    'https://images.unsplash.com/photo-1557935728-e6d1eaabe558?w=500&h=350&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Braised Egg' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular, image_url)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1),
    'Seasonal Soup (ABC / Lotus Root)',
    'Nutritious homemade soup',
    3.00,
    'Sides',
    'None',
    '[]'::jsonb,
    120,
    true,
    false,
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=350&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Seasonal Soup (ABC / Lotus Root)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Hock Famous Chicken Rice' LIMIT 1));


-- 2. Mak Cik Siti Nasi Padang
INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status, image_url)
SELECT 
    (SELECT id FROM hawker_centres ORDER BY id LIMIT 1),
    '02-20',
    'Mak Cik Siti Nasi Padang',
    (SELECT id FROM cuisine_types WHERE name = 'Malay' LIMIT 1),
    'Authentic Malay and Indonesian cuisine',
    '["Beef Rendang","Ayam Lemak Chilli Padi","Sambal Goreng"]'::jsonb,
    '$$',
    4.7,
    189,
    '10:00',
    '21:00',
    'Monday-Sunday',
    '+65 9000 1002',
    'Active',
    'https://images.unsplash.com/photo-1596040033229-a0b0c3bfc54c?w=800&h=600&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang');

-- Food items for Mak Cik Siti Nasi Padang
INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1),
    'Nasi Padang (Rice with Mixed Dishes)',
    'Rice with your choice of mixed dishes',
    6.50,
    'Mains',
    'Medium',
    '[]'::jsonb,
    680,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Nasi Padang (Rice with Mixed Dishes)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1),
    'Beef Rendang',
    'Slow-cooked beef in rich coconut gravy',
    7.50,
    'Mains',
    'Medium',
    '[]'::jsonb,
    720,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Beef Rendang' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1),
    'Ayam Lemak Chilli Padi',
    'Creamy chicken curry with bird''s eye chilli',
    6.00,
    'Mains',
    'Hot',
    '[]'::jsonb,
    650,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Ayam Lemak Chilli Padi' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1),
    'Sambal Goreng',
    'Spicy fried tempeh and long beans',
    4.50,
    'Sides',
    'Hot',
    320,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Sambal Goreng' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1),
    'Sayur Lodeh',
    'Vegetables in coconut gravy',
    4.00,
    'Sides',
    'Mild',
    280,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Sayur Lodeh' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Mak Cik Siti Nasi Padang' LIMIT 1));


-- 3. Uncle Lim's Char Kway Teow
INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status)
SELECT 
    (SELECT id FROM hawker_centres LIMIT 1),
    '03-12',
    'Uncle Lim''s Char Kway Teow',
    (SELECT id FROM cuisine_types WHERE name = 'Chinese' LIMIT 1),
    'Authentic Teochew-style Char Kway Teow',
    '["Char Kway Teow","Oyster Omelette","Fried Carrot Cake"]',
    '$',
    4.8,
    256,
    '11:00',
    '21:00',
    'Tuesday-Sunday',
    '+65 9000 1003',
    'Active'
WHERE NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow');

-- Food items for Uncle Lim's Char Kway Teow
INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1),
    'Char Kway Teow (Cockles)',
    'Wok-fried flat noodles with cockles',
    5.00,
    'Mains',
    'Mild',
    '[]'::jsonb,
    620,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Char Kway Teow (Cockles)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1),
    'Char Kway Teow (No Cockles)',
    'Wok-fried flat noodles without cockles',
    4.50,
    'Mains',
    'Mild',
    '[]'::jsonb,
    580,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Char Kway Teow (No Cockles)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1),
    'White Char Kway Teow',
    'Non-spicy version with light soy sauce',
    4.50,
    'Mains',
    'None',
    '[]'::jsonb,
    560,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'White Char Kway Teow' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1),
    'Oyster Omelette',
    'Crispy oyster omelette with egg',
    6.00,
    'Mains',
    'Mild',
    '[]'::jsonb,
    480,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Oyster Omelette' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1),
    'Fried Carrot Cake (Black)',
    'Fried radish cake with sweet dark soy',
    4.00,
    'Sides',
    'None',
    380,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Fried Carrot Cake (Black)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1),
    'Fried Carrot Cake (White)',
    'Fried radish cake with light seasoning',
    4.00,
    'Sides',
    'None',
    360,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Fried Carrot Cake (White)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Uncle Lim''s Char Kway Teow' LIMIT 1));


-- 4. Rajah's Banana Leaf Rice
INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status)
SELECT 
    (SELECT id FROM hawker_centres LIMIT 1),
    '04-08',
    'Rajah''s Banana Leaf Rice',
    (SELECT id FROM cuisine_types WHERE name = 'Indian' LIMIT 1),
    'Authentic South Indian cuisine served on banana leaf',
    '["Banana Leaf Rice","Fish Head Curry","Mutton Masala"]',
    '$$',
    4.5,
    178,
    '11:00',
    '22:00',
    'Monday-Sunday',
    '+65 9000 1004',
    'Active'
WHERE NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice');

-- Food items for Rajah's Banana Leaf Rice
INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1),
    'Banana Leaf Rice Set',
    'Rice with vegetables and curry on banana leaf',
    7.50,
    'Mains',
    'Medium',
    '[]'::jsonb,
    750,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Banana Leaf Rice Set' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1),
    'Chicken Curry',
    'Spicy chicken curry with aromatic spices',
    8.00,
    'Mains',
    'Hot',
    '[]'::jsonb,
    680,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Chicken Curry' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1),
    'Mutton Masala',
    'Tender mutton in rich masala gravy',
    10.00,
    'Mains',
    'Hot',
    '[]'::jsonb,
    820,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Mutton Masala' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1),
    'Fish Head Curry',
    'Large fish head in tangy curry',
    12.00,
    'Mains',
    'Hot',
    '[]'::jsonb,
    900,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Fish Head Curry' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1),
    'Papadum with Pickles',
    'Crispy papadum with assorted pickles',
    2.50,
    'Sides',
    'Mild',
    150,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Papadum with Pickles' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Rajah''s Banana Leaf Rice' LIMIT 1));


-- 5. Ah Ma Handmade Fishball Noodles
INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status)
SELECT 
    (SELECT id FROM hawker_centres LIMIT 1),
    '05-18',
    'Ah Ma Handmade Fishball Noodles',
    (SELECT id FROM cuisine_types WHERE name = 'Chinese' LIMIT 1),
    'Handmade fishballs and noodles since 1985',
    '["Fishball Noodle","Handmade Fishball","Fish Dumpling"]',
    '$',
    4.6,
    203,
    '07:00',
    '19:00',
    'Monday-Saturday',
    '+65 9000 1005',
    'Active'
WHERE NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles');

-- Food items for Ah Ma Handmade Fishball Noodles
INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1),
    'Fishball Noodle Soup (Dry)',
    'Dry noodles with fishballs and soup on side',
    4.00,
    'Mains',
    'Mild',
    '[]'::jsonb,
    450,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Fishball Noodle Soup (Dry)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1),
    'Fishball Noodle Soup (Soup)',
    'Noodles in flavorful soup with fishballs',
    4.00,
    'Mains',
    'Mild',
    '[]'::jsonb,
    420,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Fishball Noodle Soup (Soup)' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1),
    'Minced Pork Noodles',
    'Noodles with savory minced pork',
    4.50,
    'Mains',
    'Mild',
    '[]'::jsonb,
    500,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Minced Pork Noodles' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1),
    'Handmade Fishball Soup',
    'Bowl of handmade fishballs in clear soup',
    3.50,
    'Sides',
    'None',
    '[]'::jsonb,
    280,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Handmade Fishball Soup' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1),
    'Fish Dumpling Soup',
    'Delicate fish dumplings in soup',
    3.50,
    'Sides',
    'None',
    '[]'::jsonb,
    260,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Fish Dumpling Soup' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1),
    'Braised Mushroom Add-on',
    'Savory braised mushrooms',
    1.50,
    'Sides',
    'None',
    80,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Braised Mushroom Add-on' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Ah Ma Handmade Fishball Noodles' LIMIT 1));


-- 6. Golden Wok Zi Char
INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status)
SELECT 
    (SELECT id FROM hawker_centres LIMIT 1),
    '06-25',
    'Golden Wok Zi Char',
    (SELECT id FROM cuisine_types WHERE name = 'Chinese' LIMIT 1),
    'Traditional Chinese Zi Char with wok hei',
    '["Sweet & Sour Pork","Sambal Kang Kong","Cereal Prawns"]',
    '$$',
    4.7,
    312,
    '11:00',
    '22:30',
    'Monday-Sunday',
    '+65 9000 1006',
    'Active'
WHERE NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Golden Wok Zi Char');

-- Food items for Golden Wok Zi Char
INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1),
    'Sweet & Sour Pork',
    'Crispy pork in tangy sweet and sour sauce',
    12.00,
    'Mains',
    'None',
    '[]'::jsonb,
    680,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Sweet & Sour Pork' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1),
    'Sambal Kang Kong',
    'Stir-fried water spinach with spicy sambal',
    8.00,
    'Sides',
    'Hot',
    180,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Sambal Kang Kong' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1),
    'Cereal Prawns',
    'Crispy prawns coated in buttery cereal',
    18.00,
    'Mains',
    'None',
    '[]'::jsonb,
    720,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Cereal Prawns' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1),
    'Claypot Tofu',
    'Braised tofu and vegetables in claypot',
    10.00,
    'Mains',
    'Mild',
    420,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Claypot Tofu' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1));

INSERT INTO food_items (stall_id, name, description, price, category, spice_level, calories, is_available, is_popular)
SELECT 
    (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1),
    'Hor Fun with Beef',
    'Flat rice noodles with tender beef in gravy',
    8.50,
    'Mains',
    'None',
    '[]'::jsonb,
    580,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Hor Fun with Beef' AND stall_id = (SELECT id FROM stalls WHERE stall_name = 'Golden Wok Zi Char' LIMIT 1));


-- Verification queries (optional - run these separately to verify)
-- SELECT COUNT(*) as stall_count FROM stalls WHERE stall_name IN (
--     'Ah Hock Famous Chicken Rice',
--     'Mak Cik Siti Nasi Padang',
--     'Uncle Lim''s Char Kway Teow',
--     'Rajah''s Banana Leaf Rice',
--     'Ah Ma Handmade Fishball Noodles',
--     'Golden Wok Zi Char'
-- );

-- SELECT s.stall_name, COUNT(f.id) as dish_count 
-- FROM stalls s 
-- LEFT JOIN food_items f ON s.id = f.stall_id 
-- WHERE s.stall_name IN (
--     'Ah Hock Famous Chicken Rice',
--     'Mak Cik Siti Nasi Padang',
--     'Uncle Lim''s Char Kway Teow',
--     'Rajah''s Banana Leaf Rice',
--     'Ah Ma Handmade Fishball Noodles',
--     'Golden Wok Zi Char'
-- )
-- GROUP BY s.stall_name;
