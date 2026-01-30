const PromoModel = require('../models/promoModel');
const StallModel = require('../models/stallModel');

class PromoController {
    /**
     * Get all promotions for a stall
     * GET /api/promos/stall/:stallId
     */
    static async getPromosByStall(req, res) {
        try {
            const { stallId } = req.params;
            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const promos = await PromoModel.getPromosByStall(parseInt(stallId));
            res.status(200).json({ success: true, data: promos });
        } catch (error) {
            console.error('Error in getPromosByStall:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch promotions', error: error.message });
        }
    }

    /**
     * Get active promotions for a stall
     * GET /api/promos/stall/:stallId/active
     */
    static async getActivePromosByStall(req, res) {
        try {
            const { stallId } = req.params;
            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const promos = await PromoModel.getActivePromosByStall(parseInt(stallId));
            res.status(200).json({ success: true, data: promos });
        } catch (error) {
            console.error('Error in getActivePromosByStall:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch active promotions', error: error.message });
        }
    }

    /**
     * Get promotion by ID
     * GET /api/promos/:promoId
     */
    static async getPromoById(req, res) {
        try {
            const { promoId } = req.params;
            if (!promoId || isNaN(promoId)) {
                return res.status(400).json({ success: false, message: 'Valid promotion ID is required' });
            }

            const promo = await PromoModel.getPromoById(parseInt(promoId));
            if (!promo) {
                return res.status(404).json({ success: false, message: 'Promotion not found' });
            }

            res.status(200).json({ success: true, data: promo });
        } catch (error) {
            console.error('Error in getPromoById:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch promotion', error: error.message });
        }
    }

    /**
     * Get active promo for a food item
     * GET /api/promos/food-item/:foodItemId
     */
    static async getActivePromoByFoodItem(req, res) {
        try {
            const { foodItemId } = req.params;
            if (!foodItemId || isNaN(foodItemId)) {
                return res.status(400).json({ success: false, message: 'Valid food item ID is required' });
            }

            const promo = await PromoModel.getActivePromoByFoodItem(parseInt(foodItemId));
            res.status(200).json({ success: true, data: promo });
        } catch (error) {
            console.error('Error in getActivePromoByFoodItem:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch promotion', error: error.message });
        }
    }

    /**
     * Create a new promotion
     * POST /api/promos
     */
    static async createPromo(req, res) {
        try {
            const { stall_id, food_item_id, promo_name, description, discount_type, discount_value, start_date, end_date } = req.body;

            // Validation
            if (!stall_id || isNaN(stall_id)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            if (!food_item_id || isNaN(food_item_id)) {
                return res.status(400).json({ success: false, message: 'Valid food item ID is required' });
            }

            if (!promo_name || promo_name.trim() === '') {
                return res.status(400).json({ success: false, message: 'Promotion name is required' });
            }

            if (!discount_type) {
                return res.status(400).json({ success: false, message: 'Discount type is required' });
            }

            if (!['percentage', 'fixed_amount'].includes(discount_type)) {
                return res.status(400).json({ success: false, message: 'Invalid discount type. Must be "percentage" or "fixed_amount"' });
            }

            if (!discount_value || isNaN(discount_value) || parseFloat(discount_value) <= 0) {
                return res.status(400).json({ success: false, message: 'Discount value must be a positive number' });
            }

            if (!start_date) {
                return res.status(400).json({ success: false, message: 'Start date is required' });
            }

            if (!end_date) {
                return res.status(400).json({ success: false, message: 'End date is required' });
            }

            // Validate date range
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);
            if (endDate <= startDate) {
                return res.status(400).json({ success: false, message: 'End date must be after start date' });
            }

            // Check if stall exists
            const stall = await StallModel.getStallById(parseInt(stall_id));
            if (!stall) {
                return res.status(404).json({ success: false, message: 'Stall not found' });
            }

            // Check if food item already has an active promotion
            const hasActivePromo = await PromoModel.hasActivePromo(parseInt(food_item_id));
            if (hasActivePromo) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'This food item already has an active promotion. Please deactivate the existing one first.' 
                });
            }

            const promo = await PromoModel.createPromo({
                stall_id: parseInt(stall_id),
                food_item_id: parseInt(food_item_id),
                promo_name,
                description,
                discount_type,
                discount_value: parseFloat(discount_value),
                start_date,
                end_date,
                created_by: req.user?.user_id
            });

            res.status(201).json({ success: true, data: promo, message: 'Promotion created successfully' });
        } catch (error) {
            console.error('Error in createPromo:', error);
            res.status(500).json({ success: false, message: 'Failed to create promotion', error: error.message });
        }
    }

    /**
     * Update a promotion
     * PUT /api/promos/:promoId
     */
    static async updatePromo(req, res) {
        try {
            const { promoId } = req.params;
            if (!promoId || isNaN(promoId)) {
                return res.status(400).json({ success: false, message: 'Valid promotion ID is required' });
            }

            const existingPromo = await PromoModel.getPromoById(parseInt(promoId));
            if (!existingPromo) {
                return res.status(404).json({ success: false, message: 'Promotion not found' });
            }

            const updates = {};
            const allowedFields = ['promo_name', 'description', 'discount_type', 'discount_value', 'start_date', 'end_date', 'is_active'];

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ success: false, message: 'No fields to update' });
            }

            const updatedPromo = await PromoModel.updatePromo(parseInt(promoId), updates);
            res.status(200).json({ success: true, data: updatedPromo, message: 'Promotion updated successfully' });
        } catch (error) {
            console.error('Error in updatePromo:', error);
            res.status(500).json({ success: false, message: 'Failed to update promotion', error: error.message });
        }
    }

    /**
     * Delete a promotion
     * DELETE /api/promos/:promoId
     */
    static async deletePromo(req, res) {
        try {
            const { promoId } = req.params;
            if (!promoId || isNaN(promoId)) {
                return res.status(400).json({ success: false, message: 'Valid promotion ID is required' });
            }

            const promo = await PromoModel.getPromoById(parseInt(promoId));
            if (!promo) {
                return res.status(404).json({ success: false, message: 'Promotion not found' });
            }

            await PromoModel.deletePromo(parseInt(promoId));
            res.status(200).json({ success: true, message: 'Promotion deleted successfully' });
        } catch (error) {
            console.error('Error in deletePromo:', error);
            res.status(500).json({ success: false, message: 'Failed to delete promotion', error: error.message });
        }
    }

    /**
     * Deactivate a promotion
     * POST /api/promos/:promoId/deactivate
     */
    static async deactivatePromo(req, res) {
        try {
            const { promoId } = req.params;
            if (!promoId || isNaN(promoId)) {
                return res.status(400).json({ success: false, message: 'Valid promotion ID is required' });
            }

            const promo = await PromoModel.getPromoById(parseInt(promoId));
            if (!promo) {
                return res.status(404).json({ success: false, message: 'Promotion not found' });
            }

            const updatedPromo = await PromoModel.deactivatePromo(parseInt(promoId));
            res.status(200).json({ success: true, data: updatedPromo, message: 'Promotion deactivated successfully' });
        } catch (error) {
            console.error('Error in deactivatePromo:', error);
            res.status(500).json({ success: false, message: 'Failed to deactivate promotion', error: error.message });
        }
    }

    /**
     * Get promotions for a hawker centre
     * GET /api/promos/hawker-centre/:hawkerCentreId
     */
    static async getPromosForHawkerCentre(req, res) {
        try {
            const { hawkerCentreId } = req.params;
            if (!hawkerCentreId || isNaN(hawkerCentreId)) {
                return res.status(400).json({ success: false, message: 'Valid hawker centre ID is required' });
            }

            const promos = await PromoModel.getPromosForHawkerCentre(parseInt(hawkerCentreId));
            res.status(200).json({ success: true, data: promos });
        } catch (error) {
            console.error('Error in getPromosForHawkerCentre:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch promotions', error: error.message });
        }
    }
}

module.exports = PromoController;
