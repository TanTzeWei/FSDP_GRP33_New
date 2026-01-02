const supabase = require('../dbConfig');

class StallModel {
    static async getStallById(id) {
        try {
            const { data, error } = await supabase.from('stalls').select('*, cuisine_types(name), hawker_centres(name)').eq('id', id).maybeSingle();
            if (error) throw error;
            return data || null;
        } catch (error) {
            throw new Error(`Error fetching stall: ${error.message}`);
        }
    }

    /**
     * Update stall image URL
     * @param {number} stallId - The stall ID
     * @param {string} imageUrl - The new image URL
     * @returns {Object} Updated stall data
     */
    static async updateStallImage(stallId, imageUrl) {
        try {
            const { data, error } = await supabase
                .from('stalls')
                .update({ 
                    image_url: imageUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', stallId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error updating stall image: ${error.message}`);
        }
    }

    /**
     * Update stall details
     * @param {number} stallId - The stall ID
     * @param {Object} updateData - Data to update
     * @returns {Object} Updated stall data
     */
    static async updateStall(stallId, updateData) {
        try {
            const { data, error } = await supabase
                .from('stalls')
                .update({ 
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', stallId)
                .select('*, cuisine_types(name), hawker_centres(name)')
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error updating stall: ${error.message}`);
        }
    }
}

module.exports = StallModel;
