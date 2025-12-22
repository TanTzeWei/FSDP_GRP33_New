const DishModel = require('../models/dishModel');

class DishController {
    // List dishes for a stall
    static async listByStall(req, res) {
        try {
            const { stallId } = req.params;

            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const dishes = await DishModel.getDishesByStall(parseInt(stallId));

            const processed = dishes.map(d => ({
                ...d,
                dietary_info: d.dietary_info ? JSON.parse(d.dietary_info) : []
            }));

            res.status(200).json({ success: true, data: processed, count: processed.length });
        } catch (error) {
            console.error('Error in listByStall:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch dishes', error: error.message });
        }
    }

    // Get single dish
    static async getDish(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Valid dish ID is required' });
            }

            const dish = await DishModel.getDishById(parseInt(id));
            if (!dish) return res.status(404).json({ success: false, message: 'Dish not found' });

            dish.dietary_info = dish.dietary_info ? JSON.parse(dish.dietary_info) : [];
            res.status(200).json({ success: true, data: dish });
        } catch (error) {
            console.error('Error in getDish:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch dish', error: error.message });
        }
    }

    // Create dish
    static async createDish(req, res) {
        try {
            const payload = req.body;

            if (!payload || !payload.stall_id || !payload.name || payload.price === undefined) {
                return res.status(400).json({ success: false, message: 'stall_id, name and price are required' });
            }

            // Enforce that only the stall owner can create dishes for their stall
            const requester = req.user;
            if (!requester) return res.status(401).json({ success: false, message: 'Unauthorized' });
            if (requester.role !== 'stall_owner' && !requester.is_stall_owner) return res.status(403).json({ success: false, message: 'Forbidden: stall owners only' });
            if (String(requester.stall_id) !== String(payload.stall_id)) return res.status(403).json({ success: false, message: 'Forbidden: you may only manage your own stall' });

            const created = await DishModel.createDish(payload);
            created.dietary_info = created.dietary_info ? JSON.parse(created.dietary_info) : [];

            res.status(201).json({ success: true, data: created });
        } catch (error) {
            console.error('Error in createDish:', error);
            res.status(500).json({ success: false, message: 'Failed to create dish', error: error.message });
        }
    }

    // Update dish
    static async updateDish(req, res) {
        try {
            const { id } = req.params;
            const payload = req.body;

            if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Valid dish ID is required' });

            // Ensure the requester owns the dish's stall
            const existing = await DishModel.getDishById(parseInt(id));
            if (!existing) return res.status(404).json({ success: false, message: 'Dish not found' });
            const requester = req.user;
            if (!requester) return res.status(401).json({ success: false, message: 'Unauthorized' });
            if (requester.role !== 'stall_owner' && !requester.is_stall_owner) return res.status(403).json({ success: false, message: 'Forbidden: stall owners only' });
            if (String(requester.stall_id) !== String(existing.stall_id)) return res.status(403).json({ success: false, message: 'Forbidden: you may only manage your own stall' });

            const updated = await DishModel.updateDish(parseInt(id), payload);
            if (!updated) return res.status(404).json({ success: false, message: 'Dish not found' });

            updated.dietary_info = updated.dietary_info ? JSON.parse(updated.dietary_info) : [];
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            console.error('Error in updateDish:', error);
            res.status(500).json({ success: false, message: 'Failed to update dish', error: error.message });
        }
    }

    // Delete dish
    static async deleteDish(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Valid dish ID is required' });

            // Ensure the requester owns the dish's stall
            const existing = await DishModel.getDishById(parseInt(id));
            if (!existing) return res.status(404).json({ success: false, message: 'Dish not found' });
            const requester = req.user;
            if (!requester) return res.status(401).json({ success: false, message: 'Unauthorized' });
            if (requester.role !== 'stall_owner' && !requester.is_stall_owner) return res.status(403).json({ success: false, message: 'Forbidden: stall owners only' });
            if (String(requester.stall_id) !== String(existing.stall_id)) return res.status(403).json({ success: false, message: 'Forbidden: you may only manage your own stall' });

            const deleted = await DishModel.deleteDish(parseInt(id));
            if (!deleted) return res.status(404).json({ success: false, message: 'Dish not found' });

            res.status(200).json({ success: true, data: deleted });
        } catch (error) {
            console.error('Error in deleteDish:', error);
            res.status(500).json({ success: false, message: 'Failed to delete dish', error: error.message });
        }
    }
}

module.exports = DishController;
