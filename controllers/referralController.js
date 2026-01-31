// controllers/referralController.js
const UserModel = require('../models/userModel');
const ReferralModel = require('../models/referralModel');

class ReferralController {
    // GET /api/referrals/me - current user's referral code and stats
    static async getMyReferral(req, res) {
        try {
            const userId = req.user.userId;
            const user = await UserModel.findUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            // Ensure every user has a referral code (assign one if missing — existing users / no migration)
            const code = user.referral_code || (await UserModel.ensureReferralCode(userId));
            const refResult = await ReferralModel.getByReferrer(userId);
            const referrals = refResult.data || [];
            const referralsList = referrals.map(r => ({ referee_id: r.referee_id, created_at: r.created_at }));
            if (!code) {
                return res.json({
                    success: true,
                    referralCode: null,
                    referralLink: null,
                    totalReferrals: referrals.length,
                    referrals: referralsList
                });
            }
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const referralLink = `${baseUrl}/signup?ref=${encodeURIComponent(code)}`;
            res.json({
                success: true,
                referralCode: code,
                referralLink,
                totalReferrals: referrals.length,
                referrals: referralsList
            });
        } catch (error) {
            console.error('Error fetching referral info:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch referral info' });
        }
    }

    // GET /api/referrals/list - list of people the user referred (same data as me, but explicit list endpoint)
    static async getReferralsList(req, res) {
        try {
            const userId = req.user.userId;
            const refResult = await ReferralModel.getByReferrer(userId);
            res.json({ success: true, data: refResult.data || [] });
        } catch (error) {
            console.error('Error fetching referrals list:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch referrals' });
        }
    }
}

module.exports = ReferralController;
