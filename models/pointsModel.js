const supabase = require('../dbConfig');

class PointsModel {
    // Get user's current points balance
    static async getUserPoints(userId) {
        try {
            const { data, error } = await supabase.from('user_points').select('id, user_id, total_points, created_at, updated_at').eq('user_id', userId).maybeSingle();
            if (error) throw error;
            if (!data) return await this.initializeUserPoints(userId);
            return { success: true, data };
        } catch (error) {
            console.error("Error getting user points:", error);
            throw error;
        }
    }

    // Initialize points for a new user
    static async initializeUserPoints(userId) {
        try {
            const { data, error } = await supabase.from('user_points').insert([{ user_id: userId, total_points: 0 }]).select().single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error("Error initializing user points:", error);
            throw error;
        }
    }

    // Add points for photo upload
    static async addPhotoUploadPoints(userId, itemDetails) {
        try {
            console.log('addPhotoUploadPoints called with userId:', userId, 'itemDetails:', itemDetails);
            const pointsEarned = 10;
            // Add to points history (item_details is JSONB, pass object directly)
            const { data: history, error: histErr } = await supabase.from('points_history').insert([{ user_id: userId, transaction_type: 'upload', points: pointsEarned, description: 'Photo uploaded', reference_type: 'photo', item_details: itemDetails }]).select().single();
            console.log('Points history insert result:', { history, histErr });
            if (histErr) throw histErr;

            // Update or initialize user points
            const { data: userPoints, error: upErr } = await supabase.from('user_points').select('total_points').eq('user_id', userId).maybeSingle();
            console.log('Existing user points:', { userPoints, upErr });
            if (upErr) throw upErr;

            let newTotal;
            let updated;

            if (!userPoints) {
                // User has no points record - create with earned points directly
                newTotal = pointsEarned;
                console.log('Creating new user_points record with total:', newTotal);
                const { data: insertedPoints, error: insertErr } = await supabase.from('user_points').insert([{ user_id: userId, total_points: newTotal }]).select().single();
                console.log('Insert result:', { insertedPoints, insertErr });
                if (insertErr) throw insertErr;
                updated = insertedPoints;
            } else {
                // User has existing points - add to total
                newTotal = userPoints.total_points + pointsEarned;
                console.log('Updating user_points to new total:', newTotal);
                const { data: updatedPoints, error: updErr } = await supabase.from('user_points').update({ total_points: newTotal, updated_at: new Date().toISOString() }).eq('user_id', userId).select().single();
                console.log('Update result:', { updatedPoints, updErr });
                if (updErr) throw updErr;
                updated = updatedPoints;
            }

            console.log('Final result - updated:', updated);
            return { success: true, pointsEarned, newBalance: updated.total_points, transaction: history };
        } catch (error) {
            console.error("Error adding photo upload points:", error);
            throw error;
        }
    }

    // Add points for receiving upvote
    static async addUpvotePoints(userId, itemDetails) {
        try {
            console.log('addUpvotePoints called with userId:', userId, 'itemDetails:', itemDetails);
            const pointsEarned = 5;
            // item_details is JSONB, pass object directly
            const { data: history, error: histErr } = await supabase.from('points_history').insert([{ user_id: userId, transaction_type: 'upvote', points: pointsEarned, description: 'Upvote received', reference_type: 'review', item_details: itemDetails }]).select().single();
            console.log('Upvote points history insert result:', { history, histErr });
            if (histErr) throw histErr;

            const { data: userPoints, error: upErr } = await supabase.from('user_points').select('total_points').eq('user_id', userId).maybeSingle();
            if (upErr) throw upErr;

            let newTotal;
            let updated;

            if (!userPoints) {
                // User has no points record - create with earned points directly
                newTotal = pointsEarned;
                const { data: insertedPoints, error: insertErr } = await supabase.from('user_points').insert([{ user_id: userId, total_points: newTotal }]).select().single();
                if (insertErr) throw insertErr;
                updated = insertedPoints;
            } else {
                // User has existing points - add to total
                newTotal = userPoints.total_points + pointsEarned;
                const { data: updatedPoints, error: updErr } = await supabase.from('user_points').update({ total_points: newTotal, updated_at: new Date().toISOString() }).eq('user_id', userId).select().single();
                if (updErr) throw updErr;
                updated = updatedPoints;
            }

            return { success: true, pointsEarned, newBalance: updated.total_points, transaction: history };
        } catch (error) {
            console.error("Error adding upvote points:", error);
            throw error;
        }
    }

    // Get user's points history
    static async getPointsHistory(userId, limit = 50) {
        try {
            const { data, error } = await supabase.from('points_history').select('id, user_id, transaction_type, points, description, reference_type, reference_id, item_details, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
            if (error) throw error;
            const history = (data || []).map(record => {
                let itemDetails = null;
                if (record.item_details) {
                    try {
                        // If it's already an object, use it directly
                        itemDetails = typeof record.item_details === 'string' ? JSON.parse(record.item_details) : record.item_details;
                    } catch (parseError) {
                        console.warn('Could not parse item_details:', parseError);
                        itemDetails = null;
                    }
                }
                return { ...record, item_details: itemDetails };
            });
            return { success: true, data: history };
        } catch (error) {
            console.error("Error getting points history:", error);
            throw error;
        }
    }

    // Get all available vouchers
    static async getAllVouchers() {
        try {
            const { data, error } = await supabase.from('vouchers').select('id, name, description, voucher_type, discount_value, minimum_purchase, points_required, validity_days, is_active, terms_conditions, created_at').eq('is_active', true).order('points_required', { ascending: true });
            if (error) throw error;
            const vouchers = (data || []).map(v => {
                let terms = [];
                if (v.terms_conditions) {
                    // Try to parse as JSON, if it fails, treat as plain text
                    try {
                        terms = JSON.parse(v.terms_conditions);
                    } catch (parseError) {
                        // If it's not valid JSON, treat it as a single string item
                        terms = [v.terms_conditions];
                    }
                }
                return { ...v, terms_conditions: terms };
            });
            return { success: true, data: vouchers };
        } catch (error) {
            console.error("Error getting vouchers:", error);
            throw error;
        }
    }

    // Redeem voucher
    static async redeemVoucher(userId, voucherId) {
        try {
            // Get voucher
            const { data: voucher, error: voucherErr } = await supabase.from('vouchers').select('id, name, description, voucher_type, discount_value, minimum_purchase, points_required, validity_days').eq('id', voucherId).eq('is_active', true).maybeSingle();
            if (voucherErr) throw voucherErr;
            if (!voucher) return { success: false, message: 'Voucher not found or inactive' };

            // Get user points
            const { data: pointsRow, error: pointsErr } = await supabase.from('user_points').select('total_points').eq('user_id', userId).maybeSingle();
            if (pointsErr) throw pointsErr;
            if (!pointsRow) return { success: false, message: 'User points not found' };
            if (pointsRow.total_points < voucher.points_required) return { success: false, message: 'Not enough points' };

            const voucherCode = 'HWK' + Math.random().toString(36).substring(2,8).toUpperCase();
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + voucher.validity_days);

            const { data: redeemed, error: redeemErr } = await supabase.from('redeemed_vouchers').insert([{ user_id: userId, voucher_id: voucherId, voucher_code: voucherCode, expiry_date: expiryDate }]).select().single();
            if (redeemErr) throw redeemErr;

            await supabase.from('points_history').insert([{ user_id: userId, transaction_type: 'redeem', points: -voucher.points_required, description: `Redeemed: ${voucher.name}`, reference_type: 'voucher', reference_id: redeemed.id }]);

            const newTotal = pointsRow.total_points - voucher.points_required;
            const { data: updated, error: updErr } = await supabase.from('user_points').update({ total_points: newTotal, updated_at: new Date().toISOString() }).eq('user_id', userId).select().maybeSingle();
            if (updErr) throw updErr;

            return { success: true, voucher: { ...voucher, code: voucherCode, redeemed_date: redeemed.redeemed_date, expiry_date: expiryDate, used: false }, newBalance: updated.total_points };
        } catch (error) {
            console.error("Error redeeming voucher:", error);
            throw error;
        }
    }

    // Get user's redeemed vouchers
    static async getRedeemedVouchers(userId) {
        try {
            const { data, error } = await supabase.from('redeemed_vouchers').select('*, vouchers(*)').eq('user_id', userId).order('redeemed_date', { ascending: false });
            if (error) throw error;
            const vouchers = (data || []).map(v => ({ ...v, terms_conditions: v.vouchers && v.vouchers.terms_conditions ? JSON.parse(v.vouchers.terms_conditions) : [], is_expired: new Date(v.expiry_date) < new Date() }));
            return { success: true, data: vouchers };
        } catch (error) {
            console.error("Error getting redeemed vouchers:", error);
            throw error;
        }
    }

    // Use/mark voucher as used
    static async useVoucher(userId, voucherCode, orderId = null) {
        try {
            const { data: voucher, error } = await supabase.from('redeemed_vouchers').select('*').eq('voucher_code', voucherCode).eq('user_id', userId).maybeSingle();
            if (error) throw error;
            if (!voucher) return { success: false, message: 'Voucher not found' };
            if (voucher.is_used) return { success: false, message: 'Voucher already used' };
            if (new Date(voucher.expiry_date) < new Date()) return { success: false, message: 'Voucher expired' };

            await supabase.from('redeemed_vouchers').update({ is_used: true, used_date: new Date().toISOString(), order_id: orderId }).eq('voucher_code', voucherCode).eq('user_id', userId);
            return { success: true, message: 'Voucher marked as used' };
        } catch (error) {
            console.error("Error using voucher:", error);
            throw error;
        }
    }

    // Get voucher by code (for validation)
    static async getVoucherByCode(voucherCode) {
        try {
            const { data, error } = await supabase.from('redeemed_vouchers').select('*, vouchers(*)').eq('voucher_code', voucherCode).maybeSingle();
            if (error) throw error;
            if (!data) return { success: false, message: 'Voucher not found' };
            const voucher = { ...data, terms_conditions: data.vouchers && data.vouchers.terms_conditions ? JSON.parse(data.vouchers.terms_conditions) : [], is_expired: new Date(data.expiry_date) < new Date() };
            return { success: true, data: voucher };
        } catch (error) {
            console.error("Error getting voucher by code:", error);
            throw error;
        }
    }

    // Admin: Adjust user points (manual adjustment)
    static async adjustPoints(userId, points, description) {
        try {
            const { data: history, error: histErr } = await supabase.from('points_history').insert([{ user_id: userId, transaction_type: 'adjust', points, description, reference_type: 'admin' }]).select().single();
            if (histErr) throw histErr;

            const { data: pointsRow, error: pointsErr } = await supabase.from('user_points').select('total_points').eq('user_id', userId).maybeSingle();
            if (pointsErr) throw pointsErr;
            const newTotal = ((pointsRow && pointsRow.total_points) || 0) + points;
            const { data: updated, error: updErr } = await supabase.from('user_points').update({ total_points: newTotal, updated_at: new Date().toISOString() }).eq('user_id', userId).select().maybeSingle();
            if (updErr) throw updErr;

            return { success: true, newBalance: updated.total_points };
        } catch (error) {
            console.error("Error adjusting points:", error);
            throw error;
        }
    }
}

module.exports = PointsModel;
