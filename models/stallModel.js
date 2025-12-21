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
}

module.exports = StallModel;
