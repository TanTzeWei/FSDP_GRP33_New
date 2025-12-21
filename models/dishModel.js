const supabase = require('../dbConfig');

class DishModel {
    // Get all dishes for a stall
    static async getDishesByStall(stallId) {
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('stall_id', stallId)
                .eq('is_available', true)
                .order('is_popular', { ascending: false })
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error fetching dishes: ${error.message}`);
        }
    }

    // Get single dish by id
    static async getDishById(id) {
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw error;
            return data || null;
        } catch (error) {
            throw new Error(`Error fetching dish by id: ${error.message}`);
        }
    }

    // Create a new dish
    static async createDish(dish) {
        try {
            const payload = {
                stall_id: dish.stall_id,
                name: dish.name,
                description: dish.description || null,
                price: dish.price,
                image_url: dish.image_url || null,
                category: dish.category || null,
                spice_level: dish.spice_level || null,
                dietary_info: dish.dietary_info ? JSON.stringify(dish.dietary_info) : null,
                calories: dish.calories || null,
                is_available: dish.is_available === false ? false : true,
                is_popular: dish.is_popular ? true : false
            };

            const { data, error } = await supabase.from('food_items').insert([payload]).select().single();
            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error creating dish: ${error.message}`);
        }
    }

    // Update an existing dish
    static async updateDish(id, dish) {
        try {
            const payload = {
                name: dish.name,
                description: dish.description || null,
                price: dish.price,
                image_url: dish.image_url || null,
                category: dish.category || null,
                spice_level: dish.spice_level || null,
                dietary_info: dish.dietary_info ? JSON.stringify(dish.dietary_info) : null,
                calories: dish.calories || null,
                is_available: dish.is_available === false ? false : true,
                is_popular: dish.is_popular ? true : false,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('food_items').update(payload).eq('id', id).select().maybeSingle();
            if (error) throw error;
            return data || null;
        } catch (error) {
            throw new Error(`Error updating dish: ${error.message}`);
        }
    }

    // Delete a dish
    static async deleteDish(id) {
        try {
            const { data, error } = await supabase.from('food_items').delete().eq('id', id).select().maybeSingle();
            if (error) throw error;
            return data || null;
        } catch (error) {
            throw new Error(`Error deleting dish: ${error.message}`);
        }
    }
}

module.exports = DishModel;
