const supabase = require('../dbConfig');
const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = v => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

class HawkerCentreModel {
    // Get all hawker centres with optional filtering
    static async getAllHawkerCentres(filters = {}) {
        try {
            // Basic implementation: fetch active centres and apply simple filters/aggregations in JS
            let query = supabase.from('hawker_centres').select('*').eq('status', 'Active');
            if (filters.minRating) query = query.gte('rating', filters.minRating);
            if (filters.searchTerm) query = query.ilike('name', `%${filters.searchTerm}%`);

            const { data: centres, error } = await query;
            if (error) throw error;

            // Fetch all stalls to get active stall counts per centre
            const { data: stalls, error: stallsError } = await supabase.from('stalls').select('hawker_centre_id, cuisine_type_id').eq('status', 'Active');
            if (stallsError) console.error('Error fetching stalls:', stallsError);
            
            const { data: cuisines } = await supabase.from('cuisine_types').select('id, name');
            const cuisineMap = (cuisines || []).reduce((m, c) => (m[c.id] = c.name, m), {});
            
            // Map stalls to hawker centres
            let centresWithMeta = centres.map(c => {
                const related = (stalls || []).filter(s => s.hawker_centre_id === c.id);
                const cuisineNames = Array.from(new Set(related.map(r => cuisineMap[r.cuisine_type_id]).filter(Boolean)));
                // Always use the count of active stalls from the query result
                const stallCount = related.length > 0 ? related.length : (c.total_stalls || 0);
                return { 
                    ...c, 
                    active_stalls: stallCount,
                    totalStalls: stallCount,
                    available_cuisines: cuisineNames.join(', ')
                };
            });

            // Apply cuisine filter if specified
            if (filters.cuisine) {
                centresWithMeta = centresWithMeta.filter(c => c.available_cuisines.includes(filters.cuisine));
            }

            // Sort by rating and reviews
            centresWithMeta.sort((a,b) => (b.rating || 0) - (a.rating || 0));
            return centresWithMeta;
        } catch (error) {
            throw new Error(`Error fetching hawker centres: ${error.message}`);
        }
    }

    // Get hawker centre by ID with detailed information
    static async getHawkerCentreById(id) {
        try {
            const { data: centre, error } = await supabase.from('hawker_centres').select('*').eq('id', id).eq('status','Active').maybeSingle();
            if (error) throw error;
            if (!centre) return null;

            const { data: stalls, error: stallsErr } = await supabase.from('stalls').select('*, cuisine_types!inner(name, icon, color)').eq('hawker_centre_id', id).eq('status','Active').order('rating', {ascending: false});
            if (stallsErr) throw stallsErr;

            centre.stalls = stalls || [];
            return centre;
        } catch (error) {
            throw new Error(`Error fetching hawker centre: ${error.message}`);
        }
    }

    // Get hawker centres within a radius (simplified version using basic coordinate math)
    static async getNearbyHawkerCentres(latitude, longitude, radiusKm = 5) {
        try {
            const { data: centres, error } = await supabase.from('hawker_centres').select('*').eq('status','Active');
            if (error) throw error;

            const withDistance = (centres || []).map(c => ({ ...c, distance_km: haversine(latitude, longitude, Number(c.latitude), Number(c.longitude)) }));
            return withDistance.filter(c => c.distance_km <= radiusKm).sort((a,b) => a.distance_km - b.distance_km);
        } catch (error) {
            throw new Error(`Error fetching nearby hawker centres: ${error.message}`);
        }
    }

    // Get all cuisine types
    static async getAllCuisineTypes() {
        try {
            const { data, error } = await supabase.from('cuisine_types').select('*').order('name');
            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error fetching cuisine types: ${error.message}`);
        }
    }

    // Get popular dishes from a hawker centre
    static async getPopularDishes(hawkerCentreId, limit = 10) {
        try {
            // Get stalls for this hawker centre
            const { data: stalls } = await supabase.from('stalls').select('id').eq('hawker_centre_id', hawkerCentreId).eq('status','Active');
            const stallIds = (stalls || []).map(s => s.id);
            if (stallIds.length === 0) return [];

            const { data, error } = await supabase.from('food_items')
                .select('*, stalls!inner(stall_name), cuisine_types!inner(name)')
                .in('stall_id', stallIds)
                .eq('is_available', true)
                .order('is_popular', { ascending: false })
                .order('price', { ascending: true })
                .limit(limit);
            if (error) throw error;
            return data;
        } catch (error) {
            throw new Error(`Error fetching popular dishes: ${error.message}`);
        }
    }

    // Get hawker centre statistics
    static async getHawkerCentreStats() {
        try {
            const { data: centres, error } = await supabase.from('hawker_centres').select('*');
            if (error) throw error;
            const total = (centres || []).length;
            const average_rating = (centres || []).reduce((s,c) => s + (Number(c.rating)||0), 0) / Math.max(1, total);
            const total_stalls = (centres || []).reduce((s,c) => s + (Number(c.total_stalls)||0), 0);
            const active_centres = (centres || []).filter(c => c.status === 'Active').length;
            return { total_hawker_centres: total, average_rating, total_stalls, active_centres };
        } catch (error) {
            throw new Error(`Error fetching hawker centre statistics: ${error.message}`);
        }
    }
}

module.exports = HawkerCentreModel;