const HawkerCentreModel = require('../models/hawkerCentreModel');
const StallModel = require('../models/stallModel');
const DishModel = require('../models/dishModel');
const supabase = require('../dbConfig');

/**
 * Get share meta for Open Graph and share text
 * GET /api/share-meta/centre/:id
 * GET /api/share-meta/stall/:id
 * GET /api/share-meta/dish/:id
 */
class ShareController {
  static async getShareMetaCentre(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Valid centre ID required' });
      }
      const centre = await HawkerCentreModel.getHawkerCentreById(parseInt(id));
      if (!centre) {
        return res.status(404).json({ success: false, message: 'Centre not found' });
      }
      const meta = {
        title: centre.name,
        description: centre.description || `${centre.name} — ${centre.total_stalls || 0} stalls of authentic hawker food`,
        image: centre.image_url || null,
        rating: centre.rating ? parseFloat(centre.rating).toFixed(1) : null,
        total_reviews: centre.total_reviews || 0,
        type: 'centre'
      };
      res.json({ success: true, data: meta });
    } catch (error) {
      console.error('getShareMetaCentre:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getShareMetaStall(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Valid stall ID required' });
      }
      const stall = await StallModel.getStallById(parseInt(id));
      if (!stall) {
        return res.status(404).json({ success: false, message: 'Stall not found' });
      }
      const name = stall.stall_name || stall.stallName || stall.name || 'Stall';
      const meta = {
        title: name,
        description: stall.description || `${name} — authentic hawker food`,
        image: stall.image_url || stall.image || null,
        rating: stall.rating ? parseFloat(stall.rating).toFixed(1) : null,
        total_reviews: stall.total_reviews || 0,
        type: 'stall'
      };
      res.json({ success: true, data: meta });
    } catch (error) {
      console.error('getShareMetaStall:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getShareMetaDish(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Valid dish ID required' });
      }
      const dish = await DishModel.getDishById(parseInt(id));
      if (!dish) {
        return res.status(404).json({ success: false, message: 'Dish not found' });
      }
      // Fetch stall name for context
      let stallName = 'Hawker stall';
      if (dish.stall_id) {
        const { data: stall } = await supabase.from('stalls').select('stall_name').eq('id', dish.stall_id).maybeSingle();
        if (stall?.stall_name) stallName = stall.stall_name;
      }
      const meta = {
        title: dish.name,
        description: dish.description || `Try ${dish.name} at ${stallName}`,
        image: dish.image_url || dish.image || null,
        price: dish.price ? `$${parseFloat(dish.price).toFixed(2)}` : null,
        stall_name: stallName,
        type: 'dish'
      };
      res.json({ success: true, data: meta });
    } catch (error) {
      console.error('getShareMetaDish:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Record a share event (optional, for analytics)
   * POST /api/share-events
   * Body: { share_type: 'centre'|'stall'|'dish', reference_id: number, platform?: string }
   */
  static async recordShareEvent(req, res) {
    try {
      const { share_type, reference_id, platform } = req.body;
      if (!share_type || !reference_id || !['centre', 'stall', 'dish'].includes(share_type)) {
        return res.status(400).json({ success: false, message: 'share_type and reference_id required' });
      }
      const userId = req.user?.user_id ?? req.user?.id ?? null;
      const { data, error } = await supabase
        .from('share_events')
        .insert({ user_id: userId, share_type, reference_id: parseInt(reference_id), platform: platform || null })
        .select()
        .single();
      if (error) {
        // Table may not exist yet - fail gracefully for analytics
        console.warn('Share event record failed (table may not exist):', error.message);
        return res.status(201).json({ success: true, message: 'Share recorded' });
      }
      res.status(201).json({ success: true, data });
    } catch (error) {
      console.warn('recordShareEvent:', error.message);
      res.status(201).json({ success: true, message: 'Share recorded' });
    }
  }
}

module.exports = ShareController;
