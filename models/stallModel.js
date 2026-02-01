const supabase = require('../dbConfig');

class StallModel {
    /**
     * Get all stalls from the database
     * @returns {Array} List of all stalls
     */
    static async getAllStalls() {
        try {
            const { data, error } = await supabase
                .from('stalls')
                .select('id, stall_name, description, image_url, hawker_centre_id, cuisine_types(name), hawker_centres(name)')
                .order('stall_name', { ascending: true });
            
            if (error) throw error;
            
            // Map stall_name to name for frontend consistency and add closure status
            const stalls = (data || []).map(stall => ({
                ...stall,
                name: stall.stall_name
            }));

            // Add closure status for each stall
            const StallClosureModel = require('./stallClosureModel');
            const stallsWithStatus = await Promise.all(
                stalls.map(async (stall) => {
                    try {
                        const closureStatus = await StallClosureModel.isStallClosed(stall.id);
                        return {
                            ...stall,
                            is_currently_closed: closureStatus.isClosed,
                            closure_info: closureStatus.closureInfo
                        };
                    } catch (error) {
                        console.error(`Error checking closure for stall ${stall.id}:`, error);
                        return {
                            ...stall,
                            is_currently_closed: false,
                            closure_info: null
                        };
                    }
                })
            );

            return stallsWithStatus;
        } catch (error) {
            throw new Error(`Error fetching stalls: ${error.message}`);
        }
    }

    static async getStallById(id) {
        try {
            const { data, error } = await supabase.from('stalls').select('*, cuisine_types(name), hawker_centres(name)').eq('id', id).maybeSingle();
            if (error) throw error;
            
            if (!data) return null;

            // Add closure status
            try {
                const StallClosureModel = require('./stallClosureModel');
                const closureStatus = await StallClosureModel.isStallClosed(id);
                data.is_currently_closed = closureStatus.isClosed;
                data.closure_info = closureStatus.closureInfo;
            } catch (error) {
                console.error(`Error checking closure for stall ${id}:`, error);
                data.is_currently_closed = false;
                data.closure_info = null;
            }

            return data;
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

    /**
     * Update stall social media links
     * @param {number} stallId - The ID of the stall
     * @param {Object} socialMedia - Object containing social media URLs
     * @returns {Object} Updated stall data
     */
    static async updateStallSocialMedia(stallId, socialMedia) {
        try {
            const { data, error } = await supabase
                .from('stalls')
                .update({
                    facebook_url: socialMedia.facebook_url,
                    instagram_url: socialMedia.instagram_url,
                    twitter_url: socialMedia.twitter_url,
                    tiktok_url: socialMedia.tiktok_url,
                    website_url: socialMedia.website_url
                })
                .eq('id', stallId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, stall: data };
        } catch (error) {
            throw new Error(`Error updating social media: ${error.message}`);
        }
    }
}

module.exports = StallModel;
