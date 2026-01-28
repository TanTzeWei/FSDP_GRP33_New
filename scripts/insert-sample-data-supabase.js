const supabase = require('../dbConfig');

async function insertSampleData() {
  try {
    console.log('🔄 Inserting sample food items into Supabase...');

    // Get existing stalls
    const { data: stalls, error: stallError } = await supabase
      .from('stalls')
      .select('id, name, stall_name')
      .limit(5);

    if (stallError) {
      console.error('Error fetching stalls:', stallError);
      return;
    }

    if (!stalls || stalls.length === 0) {
      console.log('⚠️  No stalls found in database. Please create stalls first.');
      return;
    }

    console.log(`✅ Found ${stalls.length} stalls`);

    // Sample menu items to insert
    const sampleDishes = [
      {
        name: 'Hainanese Chicken Rice',
        description: 'Succulent poached chicken with fragrant rice and chilli sauce',
        price: 4.50,
        category: 'Main Dishes',
        spice_level: 'Mild',
        is_popular: true,
        dietary_info: ['gluten-free'],
        calories: 520
      },
      {
        name: 'Steamed Chicken Rice',
        description: 'Delicate steamed chicken with light soy and ginger',
        price: 4.50,
        category: 'Main Dishes',
        spice_level: 'None',
        is_popular: false,
        dietary_info: [],
        calories: 510
      },
      {
        name: 'Roasted Chicken Rice',
        description: 'Crispy roasted chicken with fragrant rice',
        price: 5.00,
        category: 'Main Dishes',
        spice_level: 'Mild',
        is_popular: true,
        dietary_info: ['gluten-free'],
        calories: 540
      },
      {
        name: 'Chicken Wings (3 pcs)',
        description: 'Crispy roasted chicken wings',
        price: 3.50,
        category: 'Sides',
        spice_level: 'None',
        is_popular: false,
        dietary_info: [],
        calories: 300
      },
      {
        name: 'Chilli Sauce',
        description: 'Homemade chilli sauce with ginger and garlic',
        price: 0.50,
        category: 'Sauces',
        spice_level: 'Hot',
        is_popular: false,
        dietary_info: ['vegetarian', 'vegan'],
        calories: 50
      },
      {
        name: 'Soy Sauce',
        description: 'Light soy sauce',
        price: 0.30,
        category: 'Sauces',
        spice_level: 'None',
        is_popular: false,
        dietary_info: ['vegetarian', 'vegan'],
        calories: 10
      },
      {
        name: 'Fish Head Curry',
        description: 'Rich and spicy fish head curry served with rice',
        price: 8.50,
        category: 'Main Dishes',
        spice_level: 'Hot',
        is_popular: true,
        dietary_info: [],
        calories: 780
      },
      {
        name: 'Roti Prata',
        description: 'Crispy layered flatbread served with curry',
        price: 2.50,
        category: 'Sides',
        spice_level: 'None',
        is_popular: false,
        dietary_info: ['vegetarian'],
        calories: 350
      },
      {
        name: 'Dum Biryani',
        description: 'Fragrant rice cooked with spices and meat',
        price: 6.50,
        category: 'Main Dishes',
        spice_level: 'Medium',
        is_popular: true,
        dietary_info: [],
        calories: 650
      },
      {
        name: 'Satay Skewers (5 pcs)',
        description: 'Grilled meat skewers with peanut sauce',
        price: 5.50,
        category: 'Main Dishes',
        spice_level: 'Medium',
        is_popular: true,
        dietary_info: [],
        calories: 520
      }
    ];

    // Insert dishes for each stall
    let totalInserted = 0;
    for (const stall of stalls) {
      console.log(`\n📝 Adding dishes to stall: ${stall.stall_name || stall.name}...`);

      // Prepare dishes for this stall
      const dishesToInsert = sampleDishes.map(dish => ({
        stall_id: stall.id,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        category: dish.category,
        spice_level: dish.spice_level,
        is_popular: dish.is_popular,
        dietary_info: JSON.stringify(dish.dietary_info),
        calories: dish.calories,
        is_available: true,
        image_url: null // You can add image URLs as needed
      }));

      const { data, error } = await supabase
        .from('food_items')
        .insert(dishesToInsert)
        .select();

      if (error) {
        console.error(`  ❌ Error inserting dishes for stall ${stall.id}:`, error.message);
      } else {
        console.log(`  ✅ Inserted ${data.length} dishes`);
        totalInserted += data.length;
      }
    }

    console.log(`\n✨ Sample data insertion complete! Total dishes inserted: ${totalInserted}`);
    console.log('\nYou can now refresh the website to see the menu items.');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  insertSampleData().then(() => process.exit(0));
}

module.exports = insertSampleData;
