const supabase = require('../dbConfig');

class ReferralModel {
    // Create a referral record (referrer invited referee)
    static async create(referrerId, refereeId) {
        try {
            const { data, error } = await supabase
                .from('referrals')
                .insert([{ referrer_id: referrerId, referee_id: refereeId }])
                .select('id, referrer_id, referee_id, created_at')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            if (error.code === '23505') {
                return { success: false, message: 'This user was already referred' };
            }
            throw error;
        }
    }

    // Get all referrals by referrer (people this user invited)
    static async getByReferrer(referrerId, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('referrals')
                .select('id, referee_id, created_at')
                .eq('referrer_id', referrerId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            throw error;
        }
    }

    // Get referrer for a referee (who referred this user)
    static async getReferrerForReferee(refereeId) {
        try {
            const { data, error } = await supabase
                .from('referrals')
                .select('id, referrer_id, created_at')
                .eq('referee_id', refereeId)
                .maybeSingle();
            if (error) throw error;
            return data || null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ReferralModel;
