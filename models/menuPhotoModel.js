// models/menuPhotoModel.js
const sql = require('mssql');
const dbConfig = require('../dbConfig');

class MenuPhotoModel {
  // Save a dish with photo (creates or updates dish and stores photo metadata)
  static async saveDishWithPhoto(photoData) {
    try {
      const pool = await sql.connect(dbConfig);
      const request = pool.request();

      // Check if dish already exists with same name for this stall
      const existingDish = await request
        .input('stallId', sql.Int, photoData.stallId)
        .input('dishName', sql.NVarChar, photoData.dishName)
        .query(`
          SELECT id FROM food_items 
          WHERE stall_id = @stallId AND name = @dishName AND is_available = 1
          LIMIT 1
        `);

      let dishId;

      if (existingDish.recordset.length > 0) {
        // Update existing dish
        dishId = existingDish.recordset[0].id;
        await request
          .input('id', sql.Int, dishId)
          .input('description', sql.NVarChar, photoData.description)
          .input('price', sql.Decimal(8, 2), photoData.price)
          .input('imageUrl', sql.NVarChar, photoData.imageUrl) // Cloudinary URL
          .input('publicId', sql.NVarChar, photoData.publicId) // Cloudinary public ID
          .input('category', sql.NVarChar, photoData.category)
          .input('spiceLevel', sql.NVarChar, photoData.spiceLevel)
          .input('dietaryInfo', sql.NVarChar, JSON.stringify(photoData.dietaryInfo))
          .query(`
            UPDATE food_items
            SET description = @description,
                price = @price,
                image_url = @imageUrl,
                public_id = @publicId,
                category = @category,
                spice_level = @spiceLevel,
                dietary_info = @dietaryInfo,
                updated_at = GETDATE()
            WHERE id = @id
          `);
      } else {
        // Create new dish
        const createResult = await request
          .input('stallId', sql.Int, photoData.stallId)
          .input('dishName', sql.NVarChar, photoData.dishName)
          .input('description', sql.NVarChar, photoData.description)
          .input('price', sql.Decimal(8, 2), photoData.price)
          .input('imageUrl', sql.NVarChar, photoData.imageUrl) // Cloudinary URL
          .input('publicId', sql.NVarChar, photoData.publicId) // Cloudinary public ID
          .input('category', sql.NVarChar, photoData.category)
          .input('spiceLevel', sql.NVarChar, photoData.spiceLevel)
          .input('dietaryInfo', sql.NVarChar, JSON.stringify(photoData.dietaryInfo))
          .query(`
            INSERT INTO food_items 
            (stall_id, name, description, price, image_url, public_id, category, spice_level, dietary_info, is_available)
            OUTPUT INSERTED.id, INSERTED.created_at
            VALUES 
            (@stallId, @dishName, @description, @price, @imageUrl, @publicId, @category, @spiceLevel, @dietaryInfo, 1)
          `);

        dishId = createResult.recordset[0].id;
        return createResult.recordset[0];
      }

      // Get the updated dish
      const finalResult = await request
        .input('dishId', sql.Int, dishId)
        .query(`SELECT id, created_at FROM food_items WHERE id = @dishId`);

      return finalResult.recordset[0];

    } catch (error) {
      console.error('Error in saveDishWithPhoto:', error.message);
      throw error;
    }
  }

  // Get photos by stall
  static async getPhotosByStall(stallId) {
    try {
      const pool = await sql.connect(dbConfig);
      
      const result = await pool.request()
        .input('stallId', sql.Int, stallId)
        .query(`
          SELECT 
            fi.id, fi.name, fi.description, fi.price, fi.image_url as file_path,
            fi.category, fi.spice_level, fi.dietary_info, fi.created_at, fi.updated_at,
            s.stall_name
          FROM food_items fi
          LEFT JOIN stalls s ON fi.stall_id = s.id
          WHERE fi.stall_id = @stallId AND fi.is_available = 1
          ORDER BY fi.created_at DESC
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error fetching photos by stall:', error);
      throw error;
    }
  }

  // Get photos by hawker centre
  static async getPhotosByHawkerCentre(hawkerCentreId, limit = 50) {
    try {
      const pool = await sql.connect(dbConfig);
      
      const result = await pool.request()
        .input('hawkerCentreId', sql.Int, hawkerCentreId)
        .input('limit', sql.Int, limit)
        .query(`
          SELECT TOP (@limit)
            fi.id, fi.name, fi.description, fi.price, fi.image_url as file_path,
            fi.category, fi.spice_level, fi.dietary_info, fi.created_at, fi.updated_at,
            s.stall_name, hc.name as hawker_centre_name
          FROM food_items fi
          LEFT JOIN stalls s ON fi.stall_id = s.id
          LEFT JOIN hawker_centres hc ON s.hawker_centre_id = hc.id
          WHERE s.hawker_centre_id = @hawkerCentreId AND fi.is_available = 1
          ORDER BY fi.created_at DESC
        `);

      return result.recordset;
    } catch (error) {
      console.error('Error fetching photos by hawker centre:', error);
      throw error;
    }
  }

  // Get photo/dish by ID
  static async getPhotoById(dishId) {
    try {
      const pool = await sql.connect(dbConfig);
      
      const result = await pool.request()
        .input('dishId', sql.Int, dishId)
        .query(`
          SELECT 
            fi.id, fi.name, fi.description, fi.price, fi.image_url as file_path,
            fi.category, fi.spice_level, fi.dietary_info, fi.created_at, fi.updated_at,
            s.stall_name, hc.name as hawker_centre_name
          FROM food_items fi
          LEFT JOIN stalls s ON fi.stall_id = s.id
          LEFT JOIN hawker_centres hc ON s.hawker_centre_id = hc.id
          WHERE fi.id = @dishId
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching photo by ID:', error);
      throw error;
    }
  }

  // Delete photo (soft delete - marks dish as unavailable)
  static async deletePhoto(dishId) {
    try {
      const pool = await sql.connect(dbConfig);
      
      const result = await pool.request()
        .input('dishId', sql.Int, dishId)
        .query(`
          UPDATE food_items
          SET is_available = 0, updated_at = GETDATE()
          WHERE id = @dishId
          SELECT @@ROWCOUNT as rowsAffected
        `);

      return result.recordset[0].rowsAffected > 0;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Get photo by file path (for serving images)
  static async getPhotoByPath(filePath) {
    try {
      const pool = await sql.connect(dbConfig);
      
      const result = await pool.request()
        .input('filePath', sql.NVarChar, filePath)
        .query(`
          SELECT id, name, image_url as file_path 
          FROM food_items 
          WHERE image_url = @filePath
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching photo by path:', error);
      throw error;
    }
  }
}

module.exports = MenuPhotoModel;
