const supabase = require('../dbConfig');

class PromoModel {
    /**
     * Get all promotions for a stall
     */
    static async getPromosByStall(stallId) {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('stall_id', stallId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw new Error(`Error fetching promotions: ${error.message}`);
        }
    }

    /**
     * Get active promotions for a stall
     */
    static async getActivePromosByStall(stallId) {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('stall_id', stallId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Filter promotions that are currently active (between start and end dates)
            const now = new Date();
            
            const activePromos = (data || []).filter(promo => {
                const startDate = new Date(promo.start_date);
                const endDate = new Date(promo.end_date);
                // Promo is active if now is between start and end dates
                const isActive = now >= startDate && now <= endDate;
                return isActive;
            });
            
            return activePromos;
        } catch (error) {
            throw new Error(`Error fetching active promotions: ${error.message}`);
        }
    }

    /**
     * Get active promotion for a specific food item
     */
    static async getActivePromoByFoodItem(foodItemId) {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('food_item_id', foodItemId)
                .eq('is_active', true)
                .maybeSingle();

            if (error) throw error;
            
            if (!data) return null;
            
            // Check if promotion is currently active (between start and end dates)
            // Use UTC to match database timestamps
            const now = new Date();
            const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const startDate = new Date(data.start_date);
            const endDate = new Date(data.end_date);
            
            if (todayStart >= startDate && now <= endDate) {
                return data;
            }
            return null;
        } catch (error) {
            throw new Error(`Error fetching promotion: ${error.message}`);
        }
    }

    /**
     * Check if food item has an active promotion
     */
    static async hasActivePromo(foodItemId) {
        try {
            const promo = await this.getActivePromoByFoodItem(foodItemId);
            return promo !== null;
        } catch (error) {
            throw new Error(`Error checking active promotion: ${error.message}`);
        }
    }

    /**
     * Get promotion by ID
     */
    static async getPromoById(promoId) {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('id', promoId)
                .maybeSingle();

            if (error) throw error;
            return data || null;
        } catch (error) {
            throw new Error(`Error fetching promotion: ${error.message}`);
        }
    }

    /**
     * Create a new promotion
     */
    static async createPromo(promo) {
        try {
            // Check if food item already has an active promotion
            const existingPromo = await this.getActivePromoByFoodItem(promo.food_item_id);
            if (existingPromo) {
                throw new Error('This food item already has an active promotion');
            }

            const payload = {
                stall_id: promo.stall_id,
                food_item_id: promo.food_item_id,
                promo_name: promo.promo_name,
                description: promo.description || null,
                discount_type: promo.discount_type,
                discount_value: promo.discount_value,
                start_date: promo.start_date,
                end_date: promo.end_date,
                is_active: true,
                created_by: promo.created_by
            };

            const { data, error } = await supabase
                .from('promotions')
                .insert([payload])
                .select();

            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            throw new Error(`Error creating promotion: ${error.message}`);
        }
    }

    /**
     * Update a promotion
     */
    static async updatePromo(promoId, updates) {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .update(updates)
                .eq('id', promoId)
                .select();

            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            throw new Error(`Error updating promotion: ${error.message}`);
        }
    }

    /**
     * Delete a promotion
     */
    static async deletePromo(promoId) {
        try {
            const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', promoId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error(`Error deleting promotion: ${error.message}`);
        }
    }

    /**
     * Deactivate a promotion
     */
    static async deactivatePromo(promoId) {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .update({ is_active: false })
                .eq('id', promoId)
                .select();

            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            throw new Error(`Error deactivating promotion: ${error.message}`);
        }
    }

    /**
     * Get promotions for a hawker centre (active only)
     */
    static async getPromosForHawkerCentre(hawkerCentreId) {
        try {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('promotions')
                .select(`
                    *,
                    stalls(id, stall_name),
                    food_items(id, name)
                `)
                .eq('stalls.hawker_centre_id', hawkerCentreId)
                .eq('is_active', true)
                .gte('end_date', now)
                .lte('start_date', now);

            if (error) throw error;
            return data || [];
        } catch (error) {
            throw new Error(`Error fetching hawker centre promotions: ${error.message}`);
        }
    }
}

module.exports = PromoModel;
