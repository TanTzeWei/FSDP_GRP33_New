const sql = require('mssql');
const dbConfig = require('../dbConfig');

class DishModel {
    // Get all dishes for a stall
    static async getDishesByStall(stallId) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('stallId', sql.Int, stallId);

            const query = `
                SELECT *
                FROM food_items
                WHERE stall_id = @stallId AND is_available = 1
                ORDER BY is_popular DESC, name ASC
            `;

            const result = await request.query(query);
            return result.recordset;
        } catch (error) {
            throw new Error(`Error fetching dishes: ${error.message}`);
        }
    }

    // Get single dish by id
    static async getDishById(id) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('id', sql.Int, id);

            const query = `SELECT * FROM food_items WHERE id = @id`;
            const result = await request.query(query);

            return result.recordset[0] || null;
        } catch (error) {
            throw new Error(`Error fetching dish by id: ${error.message}`);
        }
    }

    // Create a new dish
    static async createDish(dish) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('stallId', sql.Int, dish.stall_id);
            request.input('name', sql.NVarChar, dish.name);
            request.input('description', sql.NVarChar, dish.description || null);
            request.input('price', sql.Decimal(8, 2), dish.price);
            request.input('imageUrl', sql.NVarChar, dish.image_url || null);
            request.input('category', sql.NVarChar, dish.category || null);
            request.input('spiceLevel', sql.NVarChar, dish.spice_level || null);
            request.input('dietaryInfo', sql.NVarChar, dish.dietary_info ? JSON.stringify(dish.dietary_info) : null);
            request.input('calories', sql.Int, dish.calories || null);
            request.input('isAvailable', sql.Bit, dish.is_available === false ? 0 : 1);
            request.input('isPopular', sql.Bit, dish.is_popular ? 1 : 0);

            const query = `
                INSERT INTO food_items (stall_id, name, description, price, image_url, category, spice_level, dietary_info, calories, is_available, is_popular)
                OUTPUT INSERTED.*
                VALUES (@stallId, @name, @description, @price, @imageUrl, @category, @spiceLevel, @dietaryInfo, @calories, @isAvailable, @isPopular)
            `;

            const result = await request.query(query);
            return result.recordset[0];
        } catch (error) {
            throw new Error(`Error creating dish: ${error.message}`);
        }
    }

    // Update an existing dish
    static async updateDish(id, dish) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('id', sql.Int, id);
            request.input('name', sql.NVarChar, dish.name);
            request.input('description', sql.NVarChar, dish.description || null);
            request.input('price', sql.Decimal(8, 2), dish.price);
            request.input('imageUrl', sql.NVarChar, dish.image_url || null);
            request.input('category', sql.NVarChar, dish.category || null);
            request.input('spiceLevel', sql.NVarChar, dish.spice_level || null);
            request.input('dietaryInfo', sql.NVarChar, dish.dietary_info ? JSON.stringify(dish.dietary_info) : null);
            request.input('calories', sql.Int, dish.calories || null);
            request.input('isAvailable', sql.Bit, dish.is_available === false ? 0 : 1);
            request.input('isPopular', sql.Bit, dish.is_popular ? 1 : 0);

            const query = `
                UPDATE food_items
                SET name = @name,
                    description = @description,
                    price = @price,
                    image_url = @imageUrl,
                    category = @category,
                    spice_level = @spiceLevel,
                    dietary_info = @dietaryInfo,
                    calories = @calories,
                    is_available = @isAvailable,
                    is_popular = @isPopular,
                    updated_at = GETDATE()
                OUTPUT INSERTED.*
                WHERE id = @id
            `;

            const result = await request.query(query);
            return result.recordset[0] || null;
        } catch (error) {
            throw new Error(`Error updating dish: ${error.message}`);
        }
    }

    // Delete a dish
    static async deleteDish(id) {
        try {
            const pool = await sql.connect(dbConfig);
            const request = pool.request();
            request.input('id', sql.Int, id);

            const query = `
                DELETE FROM food_items
                OUTPUT DELETED.*
                WHERE id = @id
            `;

            const result = await request.query(query);
            return result.recordset[0] || null;
        } catch (error) {
            throw new Error(`Error deleting dish: ${error.message}`);
        }
    }
}

module.exports = DishModel;
