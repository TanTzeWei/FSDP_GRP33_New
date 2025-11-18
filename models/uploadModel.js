// models/uploadModel.js - File System Storage
const sql = require('mssql');
const dbConfig = require('../dbConfig');

class UploadModel {
  // Save a photo as BLOB data in the database
  static async savePhotoRecord(photoData) {
    try {
      console.log('🔍 Starting savePhotoRecord with data:', {
        userId: photoData.userId,
        hawkerCentreId: photoData.hawkerCentreId,
        stallId: photoData.stallId,
        originalName: photoData.originalName,
        fileSize: photoData.fileSize,
        mimeType: photoData.mimeType,
        dishName: photoData.dishName,
        hasPhotoData: !!photoData.photoData,
        photoDataLength: photoData.photoData ? photoData.photoData.length : 0
      });
      
      await sql.connect(dbConfig);
      console.log('✅ Database connected for photo save');
      
      // Create a small dummy BLOB instead of the actual photo data to test
      const dummyPhotoData = Buffer.from('dummy image data for testing');
      
      const request = new sql.Request();
      
      request.input('user_id', sql.Int, photoData.userId);
      request.input('hawker_centre_id', sql.Int, photoData.hawkerCentreId);
      request.input('stall_id', sql.Int, photoData.stallId);
      request.input('food_item_id', sql.Int, photoData.foodItemId);
      request.input('original_filename', sql.NVarChar(255), photoData.originalName);
      request.input('file_path', sql.NVarChar(500), photoData.filePath); // Use file path instead
      request.input('file_size', sql.Int, photoData.fileSize);
      request.input('mime_type', sql.NVarChar(100), photoData.mimeType);
      request.input('dish_name', sql.NVarChar(255), photoData.dishName);
      request.input('description', sql.NVarChar, photoData.description || '');
      
      console.log('🔍 About to execute SQL query...');
      
      // Add dummy photo_data since it's NOT NULL in database
      request.input('photo_data', sql.VarBinary, Buffer.from('dummy'));
      
      const result = await request.query(`
        INSERT INTO photos (
          user_id, hawker_centre_id, stall_id, food_item_id,
          original_filename, photo_data, file_path, file_size, mime_type,
          dish_name, description
        )
        OUTPUT INSERTED.id, INSERTED.created_at
        VALUES (
          @user_id, @hawker_centre_id, @stall_id, @food_item_id,
          @original_filename, @photo_data, @file_path, @file_size, @mime_type,
          @dish_name, @description
        )
      `);

      console.log('✅ SQL query executed successfully:', result.recordset[0]);
      return result.recordset[0];
    } catch (error) {
      console.error('💥 Error in savePhotoRecord:', error.message);
      console.error('💥 Error stack:', error.stack);
      throw error;
    }
  }

  // Get photo file path by ID
  static async getPhotoFilePath(photoId) {
    try {
      await sql.connect(dbConfig);
      
      const request = new sql.Request();
      request.input('photo_id', sql.Int, photoId);
      
      const result = await request.query(`
        SELECT file_path, mime_type, file_size, original_filename
        FROM photos 
        WHERE id = @photo_id AND is_approved = 1
      `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error fetching photo file path:', error);
      throw error;
    }
  }

  // Get all photos with metadata (without BLOB data for performance)
  static async getAllPhotos(limit = 50, offset = 0) {
    try {
      await sql.connect(dbConfig);
      
      const request = new sql.Request();
      request.input('limit', sql.Int, limit);
      request.input('offset', sql.Int, offset);
      
      const result = await request.query(`
        SELECT 
          p.id, p.dish_name, p.description, p.likes_count, 
          p.is_featured, p.created_at, p.file_size, p.mime_type, p.file_path,
          u.first_name, u.last_name,
          hc.name as hawker_centre_name,
          s.stall_name as stall_name
        FROM photos p
        INNER JOIN users u ON p.user_id = u.id
        INNER JOIN hawker_centres hc ON p.hawker_centre_id = hc.id
        LEFT JOIN stalls s ON p.stall_id = s.id
        WHERE p.is_approved = 1
        ORDER BY p.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

      return result.recordset;
    } catch (error) {
      console.error('Error fetching photos:', error);
      throw error;
    }
  }

  // Get featured photos for Hall of Fame
  static async getFeaturedPhotos(limit = 10) {
    try {
      await sql.connect(dbConfig);
      
      const request = new sql.Request();
      request.input('limit', sql.Int, limit);
      
      const result = await request.query(`
        SELECT 
          p.id, p.dish_name, p.description, p.likes_count, 
          p.created_at, p.file_size, p.mime_type, p.file_path,
          u.first_name, u.last_name,
          hc.name as hawker_centre_name,
          s.stall_name as stall_name
        FROM photos p
        INNER JOIN users u ON p.user_id = u.id
        INNER JOIN hawker_centres hc ON p.hawker_centre_id = hc.id
        LEFT JOIN stalls s ON p.stall_id = s.id
        WHERE p.is_approved = 1 AND p.is_featured = 1
        ORDER BY p.likes_count DESC, p.created_at DESC
        OFFSET 0 ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

      return result.recordset;
    } catch (error) {
      console.error('Error fetching featured photos:', error);
      throw error;
    }
  }

  // Get photos by hawker centre
  static async getPhotosByHawkerCentre(hawkerCentreId, limit = 20) {
    try {
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        SELECT 
          p.id, p.dish_name, p.description, p.likes_count, 
          p.created_at, p.file_size, p.mime_type,
          u.first_name, u.last_name,
          s.stall_name as stall_name
        FROM photos p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN stalls s ON p.stall_id = s.id
        WHERE p.hawker_centre_id = @hawker_centre_id AND p.is_approved = 1
        ORDER BY p.likes_count DESC, p.created_at DESC
        OFFSET 0 ROWS
        FETCH NEXT @limit ROWS ONLY
      `)
        .input('hawker_centre_id', sql.Int, hawkerCentreId)
        .input('limit', sql.Int, limit);

      return result.recordset;
    } catch (error) {
      console.error('Error fetching photos by hawker centre:', error);
      throw error;
    }
  }

  // Like a photo
  static async likePhoto(userId, photoId) {
    try {
      await sql.connect(dbConfig);
      
      // Check if user already liked this photo
      const existingLike = await sql.query(`
        SELECT id FROM photo_likes WHERE user_id = @user_id AND photo_id = @photo_id
      `)
        .input('user_id', sql.Int, userId)
        .input('photo_id', sql.Int, photoId);

      if (existingLike.recordset.length > 0) {
        throw new Error('User has already liked this photo');
      }

      // Insert like record
      await sql.query(`
        INSERT INTO photo_likes (user_id, photo_id) VALUES (@user_id, @photo_id)
      `)
        .input('user_id', sql.Int, userId)
        .input('photo_id', sql.Int, photoId);

      // Update likes count
      const result = await sql.query(`
        UPDATE photos 
        SET likes_count = likes_count + 1
        OUTPUT INSERTED.likes_count
        WHERE id = @photo_id
      `)
        .input('photo_id', sql.Int, photoId);

      return result.recordset[0].likes_count;
    } catch (error) {
      console.error('Error liking photo:', error);
      throw error;
    }
  }

  // Unlike a photo
  static async unlikePhoto(userId, photoId) {
    try {
      await sql.connect(dbConfig);
      
      // Remove like record
      const deleteResult = await sql.query(`
        DELETE FROM photo_likes WHERE user_id = @user_id AND photo_id = @photo_id
      `)
        .input('user_id', sql.Int, userId)
        .input('photo_id', sql.Int, photoId);

      if (deleteResult.rowsAffected[0] === 0) {
        throw new Error('Like not found');
      }

      // Update likes count
      const result = await sql.query(`
        UPDATE photos 
        SET likes_count = CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END
        OUTPUT INSERTED.likes_count
        WHERE id = @photo_id
      `)
        .input('photo_id', sql.Int, photoId);

      return result.recordset[0].likes_count;
    } catch (error) {
      console.error('Error unliking photo:', error);
      throw error;
    }
  }

  // Get photo by ID with full details
  static async getPhotoById(photoId) {
    try {
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        SELECT 
          p.*,
          u.first_name, u.last_name, u.email,
          hc.name as hawker_centre_name,
          s.name as stall_name,
          fi.name as food_item_name
        FROM photos p
        INNER JOIN users u ON p.user_id = u.id
        INNER JOIN hawker_centres hc ON p.hawker_centre_id = hc.id
        LEFT JOIN stalls s ON p.stall_id = s.id
        LEFT JOIN food_items fi ON p.food_item_id = fi.id
        WHERE p.id = @photo_id
      `)
        .input('photo_id', sql.Int, photoId);

      return result.recordset[0];
    } catch (error) {
      console.error('Error fetching photo by ID:', error);
      throw error;
    }
  }

  // Delete photo
  static async deletePhoto(photoId, userId) {
    try {
      await sql.connect(dbConfig);
      
      const result = await sql.query(`
        DELETE FROM photos 
        WHERE id = @photo_id AND user_id = @user_id
      `)
        .input('photo_id', sql.Int, photoId)
        .input('user_id', sql.Int, userId);

      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Update photo to featured status
  static async updateFeaturedStatus(photoId, isFeatured) {
    try {
      await sql.connect(dbConfig);
      
      await sql.query(`
        UPDATE photos 
        SET is_featured = @is_featured, updated_at = GETDATE()
        WHERE id = @photo_id
      `)
        .input('photo_id', sql.Int, photoId)
        .input('is_featured', sql.Bit, isFeatured);

      return true;
    } catch (error) {
      console.error('Error updating featured status:', error);
      throw error;
    }
  }
}

module.exports = UploadModel;
