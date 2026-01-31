// models/menuPhotoModel.js
const supabase = require('../dbConfig');

class MenuPhotoModel {
  // Save a dish with photo (creates or updates dish and stores photo metadata)
  static async saveDishWithPhoto(photoData) {
    try {
      // Check if dish exists for this stall
      const { data: existingDish, error: existErr } = await supabase
        .from('food_items')
        .select('id')
        .eq('stall_id', photoData.stallId)
        .eq('name', photoData.dishName)
        .eq('is_available', true)
        .limit(1)
        .maybeSingle();

      if (existErr) throw existErr;

      if (existingDish && existingDish.id) {
        const dishId = existingDish.id;
        const payload = {
          description: photoData.description,
          price: photoData.price,
          image_url: photoData.imageUrl,
          public_id: photoData.publicId,
          category: photoData.category,
          spice_level: photoData.spiceLevel,
          updated_at: new Date().toISOString()
        };

        await supabase.from('food_items').update(payload).eq('id', dishId);
        const { data: final } = await supabase.from('food_items').select('id, created_at').eq('id', dishId).maybeSingle();
        return final;
      } else {
        const payload = {
          stall_id: photoData.stallId,
          name: photoData.dishName,
          description: photoData.description,
          price: photoData.price,
          image_url: photoData.imageUrl,
          public_id: photoData.publicId,
          category: photoData.category,
          spice_level: photoData.spiceLevel,
          is_available: true
        };

        const { data: created, error } = await supabase.from('food_items').insert([payload]).select('id, created_at').single();
        if (error) throw error;
        return created;
      }
    } catch (error) {
      console.error('Error in saveDishWithPhoto:', error.message);
      throw error;
    }
  }

  static async getPhotosByStall(stallId) {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, description, price, image_url, category, spice_level, created_at, updated_at, stalls(stall_name)')
        .eq('stall_id', stallId)
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photos by stall:', error);
      throw error;
    }
  }

  static async getPhotosByHawkerCentre(hawkerCentreId, limit = 50) {
    try {
      const { data: stalls } = await supabase.from('stalls').select('id').eq('hawker_centre_id', hawkerCentreId);
      const stallIds = (stalls || []).map(s => s.id);
      if (stallIds.length === 0) return [];

      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, description, price, image_url, category, spice_level, created_at, updated_at, stalls(stall_name), hawker_centres(name)')
        .in('stall_id', stallIds)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching photos by hawker centre:', error);
      throw error;
    }
  }

  static async getPhotoById(dishId) {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, description, price, image_url, category, spice_level, created_at, updated_at, stalls(stall_name), hawker_centres(name)')
        .eq('id', dishId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching photo by ID:', error);
      throw error;
    }
  }

  static async deletePhoto(dishId) {
    try {
      const { data, error } = await supabase.from('food_items').update({ is_available: false, updated_at: new Date().toISOString() }).eq('id', dishId).select();
      if (error) throw error;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  static async getPhotoByPath(filePath) {
    try {
      const { data, error } = await supabase.from('food_items').select('id, name, image_url').eq('image_url', filePath).maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching photo by path:', error);
      throw error;
    }
  }
}

module.exports = MenuPhotoModel;
