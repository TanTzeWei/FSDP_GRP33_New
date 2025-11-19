const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Sample data SQL - safe-ish inserts that rely on selecting hawker centre and cuisine IDs
const sqlStatements = `
-- Insert two sample stalls (if not exists)
IF NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Ah Seng Chicken Rice')
BEGIN
    INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status)
    VALUES (
        (SELECT TOP 1 id FROM hawker_centres WHERE name = 'Maxwell Food Centre'),
        '01-10',
        'Ah Seng Chicken Rice',
        (SELECT TOP 1 id FROM cuisine_types WHERE name = 'Chinese'),
        'Famous Hainanese chicken rice with fragrant rice and chilli',
        '["Hainanese Chicken Rice","Ginger Sauce","Chilli"]',
        '$',
        4.5,
        128,
        '08:00',
        '22:00',
        'Monday-Sunday',
        '+65 9000 0001',
        'Active'
    );
END;

IF NOT EXISTS (SELECT 1 FROM stalls WHERE stall_name = 'Muthu''s Curry')
BEGIN
    INSERT INTO stalls (hawker_centre_id, stall_number, stall_name, cuisine_type_id, description, specialties, price_range, rating, total_reviews, opening_hours, closing_hours, operating_days, contact_phone, status)
    VALUES (
        (SELECT TOP 1 id FROM hawker_centres WHERE name = 'Tekka Centre'),
        'B2-05',
        'Muthu''s Curry',
        (SELECT TOP 1 id FROM cuisine_types WHERE name = 'Indian'),
        'Authentic South Indian curries and roti prata',
        '["Fish Head Curry","Roti Prata"]',
        '$$',
        4.3,
        94,
        '10:00',
        '22:00',
        'Monday-Sunday',
        '+65 9000 0002',
        'Active'
    );
END;

-- Insert sample food_items for Ah Seng Chicken Rice
IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Roasted Chicken Rice' AND stall_id = (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Ah Seng Chicken Rice'))
BEGIN
    INSERT INTO food_items (stall_id, name, description, price, image_url, category, spice_level, dietary_info, calories, is_available, is_popular)
    VALUES (
        (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Ah Seng Chicken Rice'),
        'Roasted Chicken Rice',
        'Succulent roasted chicken with fragrant rice and house chilli',
        4.50,
        'https://images.unsplash.com/photo-1512058564366-18510be2db19',
        'Mains',
        'None',
        '["gluten-free"]',
        520,
        1,
        1
    );

    INSERT INTO food_items (stall_id, name, description, price, image_url, category, spice_level, dietary_info, calories, is_available, is_popular)
    VALUES (
        (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Ah Seng Chicken Rice'),
        'Steamed Chicken Rice',
        'Delicate steamed chicken with light soy and ginger',
        4.50,
        'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2',
        'Mains',
        'None',
        '[]',
        510,
        1,
        0
    );

    INSERT INTO food_items (stall_id, name, description, price, image_url, category, spice_level, dietary_info, calories, is_available, is_popular)
    VALUES (
        (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Ah Seng Chicken Rice'),
        'Chicken Wings (2 pcs)',
        'Crispy roasted chicken wings',
        3.00,
        'https://images.unsplash.com/photo-1527477396000-e27163b481c2',
        'Sides',
        'Mild',
        '[]',
        300,
        1,
        0
    );
END;

-- Insert sample food_items for Muthu's Curry
IF NOT EXISTS (SELECT 1 FROM food_items WHERE name = 'Fish Head Curry' AND stall_id = (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Muthu''s Curry'))
BEGIN
    INSERT INTO food_items (stall_id, name, description, price, image_url, category, spice_level, dietary_info, calories, is_available, is_popular)
    VALUES (
        (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Muthu''s Curry'),
        'Fish Head Curry',
        'Rich, spicy fish head curry served with rice',
        8.50,
        'https://images.unsplash.com/photo-1541542684-6e57f4d55d66',
        'Mains',
        'Hot',
        '[]',
        780,
        1,
        1
    );

    INSERT INTO food_items (stall_id, name, description, price, image_url, category, spice_level, dietary_info, calories, is_available, is_popular)
    VALUES (
        (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Muthu''s Curry'),
        'Roti Prata',
        'Crispy layerd prata served with curry',
        2.50,
        'https://images.unsplash.com/photo-1544025162-d76694265947',
        'Sides',
        'None',
        '[]',
        350,
        1,
        0
    );
END;

-- Print verification
SELECT 'Inserted stalls:' as info, COUNT(*) as count FROM stalls WHERE stall_name IN ('Ah Seng Chicken Rice', 'Muthu''s Curry');
SELECT 'Inserted food_items for Ah Seng Chicken Rice:' as info, COUNT(*) as count FROM food_items WHERE stall_id = (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Ah Seng Chicken Rice');
SELECT 'Inserted food_items for Muthu''s Curry:' as info, COUNT(*) as count FROM food_items WHERE stall_id = (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Muthu''s Curry');
`;

async function run() {
  let pool;
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(dbConfig);

    console.log('Running sample data SQL...');
    // break into individual batches by GO or semicolon - here we just run the whole script
    const result = await pool.request().query(sqlStatements);

    console.log('Script executed. You can verify inserted rows with these queries:');
    console.log("SELECT id, stall_name FROM stalls WHERE stall_name IN ('Ah Seng Chicken Rice', 'Muthu''s Curry');");
    console.log("SELECT * FROM food_items WHERE stall_id = (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Ah Seng Chicken Rice');");
    console.log("SELECT * FROM food_items WHERE stall_id = (SELECT TOP 1 id FROM stalls WHERE stall_name = 'Muthu''s Curry');");

    console.log('Done.');
  } catch (err) {
    console.error('Error running sample data script:', err.message || err);
  } finally {
    if (pool) await pool.close();
  }
}

if (require.main === module) run();

module.exports = { run };
