// models/uploadModel.js - File System Storage
const supabase = require('../dbConfig');

class UploadModel {
  // Save a photo with Cloudinary URL
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
        imageUrl: photoData.imageUrl
      });
      
      console.log('🔍 Starting savePhotoRecord with data:', {
        userId: photoData.userId,
        hawkerCentreId: photoData.hawkerCentreId,
        stallId: photoData.stallId,
        originalName: photoData.originalName,
        fileSize: photoData.fileSize,
        mimeType: photoData.mimeType,
        dishName: photoData.dishName,
        imageUrl: photoData.imageUrl
      });

      const payload = {
        user_id: photoData.userId,
        hawker_centre_id: photoData.hawkerCentreId,
        stall_id: photoData.stallId,
        food_item_id: photoData.foodItemId,
        original_filename: photoData.originalName,
        file_path: photoData.imageUrl,
        image_url: photoData.imageUrl,
        public_id: photoData.publicId,
        file_size: photoData.fileSize,
        mime_type: photoData.mimeType,
        dish_name: photoData.dishName,
        description: photoData.description || '',
      };

      // Ensure no legacy BLOB field is sent to Supabase
      if (payload.photo_data !== undefined) {
        console.warn('Removing unexpected photo_data from payload before insert');
        delete payload.photo_data;
      }

      console.log('Inserting photo payload:', payload);
      const { data, error } = await supabase.from('photos').insert([payload]).select('id, created_at').single();
      if (error) throw error;
      console.log('✅ Photo record saved:', data);
      return data;
    } catch (error) {
      console.error('💥 Error in savePhotoRecord:', error.message);
      console.error('💥 Error stack:', error.stack);
      throw error;
    }
  }

  // Get photo file path by ID
  static async getPhotoFilePath(photoId) {
    try {
      const { data, error } = await supabase.from('photos').select('file_path, image_url, mime_type, file_size, original_filename, public_id').eq('id', photoId).eq('is_approved', true).maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photo file path:', error);
      throw error;
    }
  }

  // Get all photos with metadata (without BLOB data for performance)
  static async getAllPhotos(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase.from('photos').select('id, dish_name, description, likes_count, is_featured, created_at, file_size, mime_type, file_path, image_url, users(name), hawker_centres(name), stalls(stall_name)').eq('is_approved', true).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photos:', error);
      throw error;
    }
  }

  // Get featured photos for Hall of Fame
  static async getFeaturedPhotos(limit = 10) {
    try {
      const { data, error } = await supabase.from('photos').select('id, dish_name, description, likes_count, created_at, file_size, mime_type, file_path, image_url, users(name), hawker_centres(name), stalls(stall_name)').eq('is_approved', true).eq('is_featured', true).order('likes_count', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching featured photos:', error);
      throw error;
    }
  }

  // Get photos by hawker centre
  static async getPhotosByHawkerCentre(hawkerCentreId, limit = 20) {
    try {
      const { data, error } = await supabase.from('photos').select('id, dish_name, description, likes_count, created_at, file_size, mime_type, file_path, image_url, users(name), stalls(stall_name)').eq('hawker_centre_id', hawkerCentreId).eq('is_approved', true).order('likes_count', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photos by hawker centre:', error);
      throw error;
    }
  }

  // Get community photos by stall (for stall owner dashboard)
  static async getPhotosByStall(stallId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('id, dish_name, description, likes_count, is_approved, created_at, file_size, mime_type, file_path, image_url, users(name), hawker_centres(name)')
        .eq('stall_id', stallId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photos by stall:', error);
      throw error;
    }
  }

  // Update photo approval status
  static async updateApprovalStatus(photoId, status) {
    try {
      const isApproved = status === 'approved';
      const { data, error } = await supabase
        .from('photos')
        .update({ 
          is_approved: isApproved,
          updated_at: new Date().toISOString()
        })
        .eq('id', photoId)
        .select()
        .single();
      if (error) throw error;
      return { ...data, approval_status: status };
    } catch (error) {
      console.error('Error updating approval status:', error);
      throw error;
    }
  }

  // Like a photo
  static async likePhoto(userId, photoId) {
    try {
      // Check existing like
      console.log(`[likePhoto] Checking existing like for user=${userId} photo=${photoId}`);
      const { data: existing } = await supabase.from('photo_likes').select('id').eq('user_id', userId).eq('photo_id', photoId).limit(1).maybeSingle();
      console.log('[likePhoto] existing:', existing);
      if (existing) throw new Error('User has already liked this photo');

      // Get photo information including the owner
      const { data: photoInfo, error: photoErr } = await supabase.from('photos').select('user_id, dish_name, stall_id, stalls(stall_name)').eq('id', photoId).maybeSingle();
      if (photoErr) throw photoErr;
      if (!photoInfo) throw new Error('Photo not found');

      // Insert like record
      console.log(`[likePhoto] Inserting like record user=${userId} photo=${photoId}`);
      const { data: inserted, error: insertErr } = await supabase.from('photo_likes').insert([{ user_id: userId, photo_id: photoId }]).select().maybeSingle();
      console.log('[likePhoto] insert result:', { inserted, insertErr });
      if (insertErr) throw insertErr;

      // Recompute likes_count from actual rows in photo_likes to avoid races
      console.log(`[likePhoto] Counting likes for photo=${photoId}`);
      const { data: _, error: countErr, count } = await supabase.from('photo_likes').select('photo_id', { count: 'exact', head: true }).eq('photo_id', photoId);
      if (countErr) throw countErr;
      const newCount = typeof count === 'number' ? count : 0;

      const { data, error } = await supabase.from('photos').update({ likes_count: newCount }).eq('id', photoId).select('likes_count').maybeSingle();
      console.log('[likePhoto] update result:', { data, error });
      if (error) throw error;
      
      return {
        likesCount: data ? data.likes_count : newCount,
        photoOwnerId: photoInfo.user_id,
        dishName: photoInfo.dish_name,
        stallName: photoInfo.stalls?.stall_name || 'Unknown Stall'
      };
    } catch (error) {
      console.error('Error liking photo:', error);
      throw error;
    }
  }

  // Unlike a photo
  static async unlikePhoto(userId, photoId) {
    try {
      console.log(`[unlikePhoto] Deleting like for user=${userId} photo=${photoId}`);
      const { data: deleted, error: delErr } = await supabase.from('photo_likes').delete().eq('user_id', userId).eq('photo_id', photoId).select();
      console.log('[unlikePhoto] delete result:', { deleted, delErr });
      if (delErr) throw delErr;
      if (!deleted || (Array.isArray(deleted) && deleted.length === 0)) throw new Error('Like not found');

      // Recompute likes_count from actual rows in photo_likes after deletion
      const { data: _, error: countErr, count } = await supabase.from('photo_likes').select('photo_id', { count: 'exact', head: true }).eq('photo_id', photoId);
      if (countErr) throw countErr;
      const newCount = typeof count === 'number' ? count : 0;
      await supabase.from('photos').update({ likes_count: newCount }).eq('id', photoId);
      return newCount;
    } catch (error) {
      console.error('Error unliking photo:', error);
      throw error;
    }
  }

  // Get photo by ID with full details
  static async getPhotoById(photoId) {
    try {
      const { data, error } = await supabase.from('photos').select('*, users(name,email), hawker_centres(name), stalls(name), food_items(name)').eq('id', photoId).maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photo by ID:', error);
      throw error;
    }
  }

  // Delete photo
  static async deletePhoto(photoId, userId) {
    try {
      const { data, error } = await supabase.from('photos').delete().eq('id', photoId).eq('user_id', userId);
      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Update photo to featured status
  static async updateFeaturedStatus(photoId, isFeatured) {
    try {
      const { error } = await supabase.from('photos').update({ is_featured: isFeatured, updated_at: new Date().toISOString() }).eq('id', photoId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating featured status:', error);
      throw error;
    }
  }

  // Get IDs of photos liked by a specific user
  static async getLikedPhotoIds(userId) {
    try {
      const { data, error } = await supabase.from('photo_likes').select('photo_id').eq('user_id', userId);
      if (error) throw error;
      return data ? data.map(r => r.photo_id) : [];
    } catch (error) {
      console.error('Error fetching liked photo ids:', error);
      throw error;
    }
  }
}

module.exports = UploadModel;
