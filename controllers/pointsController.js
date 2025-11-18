const PointsModel = require("../models/pointsModel");

class PointsController {
    // Get user's current points balance
    static async getUserPoints(req, res) {
        try {
            const userId = req.user.userId; // From auth middleware

            const result = await PointsModel.getUserPoints(userId);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    points: result.data.total_points,
                    data: result.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Points data not found"
                });
            }
        } catch (error) {
            console.error("Error in getUserPoints:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving points",
                error: error.message
            });
        }
    }

    // Get user's points history
    static async getPointsHistory(req, res) {
        try {
            const userId = req.user.userId;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;

            const result = await PointsModel.getPointsHistory(userId, limit);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    data: result.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "History not found"
                });
            }
        } catch (error) {
            console.error("Error in getPointsHistory:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving points history",
                error: error.message
            });
        }
    }

    // Add points for photo upload
    static async addPhotoUploadPoints(req, res) {
        try {
            const userId = req.user.userId;
            const { stallName, dishName, photoId } = req.body;

            if (!stallName || !dishName) {
                return res.status(400).json({
                    success: false,
                    message: "stallName and dishName are required"
                });
            }

            const itemDetails = {
                stallName,
                dishName,
                photoId,
                item: `${dishName} - ${stallName}`
            };

            const result = await PointsModel.addPhotoUploadPoints(userId, itemDetails);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: "Points added for photo upload",
                    pointsEarned: result.pointsEarned,
                    newBalance: result.newBalance,
                    transaction: result.transaction
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Failed to add points"
                });
            }
        } catch (error) {
            console.error("Error in addPhotoUploadPoints:", error);
            return res.status(500).json({
                success: false,
                message: "Error adding points for photo upload",
                error: error.message
            });
        }
    }

    // Add points for receiving upvote
    static async addUpvotePoints(req, res) {
        try {
            const userId = req.user.userId;
            const { stallName, dishName, reviewId } = req.body;

            if (!stallName || !dishName) {
                return res.status(400).json({
                    success: false,
                    message: "stallName and dishName are required"
                });
            }

            const itemDetails = {
                stallName,
                dishName,
                reviewId,
                item: `${dishName} - ${stallName}`
            };

            const result = await PointsModel.addUpvotePoints(userId, itemDetails);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: "Points added for upvote",
                    pointsEarned: result.pointsEarned,
                    newBalance: result.newBalance,
                    transaction: result.transaction
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Failed to add points"
                });
            }
        } catch (error) {
            console.error("Error in addUpvotePoints:", error);
            return res.status(500).json({
                success: false,
                message: "Error adding points for upvote",
                error: error.message
            });
        }
    }

    // Get all available vouchers
    static async getAllVouchers(req, res) {
        try {
            const result = await PointsModel.getAllVouchers();

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    data: result.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "No vouchers found"
                });
            }
        } catch (error) {
            console.error("Error in getAllVouchers:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving vouchers",
                error: error.message
            });
        }
    }

    // Redeem a voucher
    static async redeemVoucher(req, res) {
        try {
            const userId = req.user.userId;
            const { voucherId } = req.body;

            if (!voucherId) {
                return res.status(400).json({
                    success: false,
                    message: "voucherId is required"
                });
            }

            const result = await PointsModel.redeemVoucher(userId, voucherId);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: "Voucher redeemed successfully",
                    voucher: result.voucher,
                    newBalance: result.newBalance
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error("Error in redeemVoucher:", error);
            return res.status(500).json({
                success: false,
                message: "Error redeeming voucher",
                error: error.message
            });
        }
    }

    // Get user's redeemed vouchers
    static async getRedeemedVouchers(req, res) {
        try {
            const userId = req.user.userId;

            const result = await PointsModel.getRedeemedVouchers(userId);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    data: result.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "No redeemed vouchers found"
                });
            }
        } catch (error) {
            console.error("Error in getRedeemedVouchers:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving redeemed vouchers",
                error: error.message
            });
        }
    }

    // Use/mark voucher as used
    static async useVoucher(req, res) {
        try {
            const userId = req.user.userId;
            const { voucherCode, orderId } = req.body;

            if (!voucherCode) {
                return res.status(400).json({
                    success: false,
                    message: "voucherCode is required"
                });
            }

            const result = await PointsModel.useVoucher(userId, voucherCode, orderId);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: result.message
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error("Error in useVoucher:", error);
            return res.status(500).json({
                success: false,
                message: "Error using voucher",
                error: error.message
            });
        }
    }

    // Get voucher by code (for validation at checkout)
    static async getVoucherByCode(req, res) {
        try {
            const { voucherCode } = req.params;

            if (!voucherCode) {
                return res.status(400).json({
                    success: false,
                    message: "voucherCode is required"
                });
            }

            const result = await PointsModel.getVoucherByCode(voucherCode);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    data: result.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error("Error in getVoucherByCode:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving voucher",
                error: error.message
            });
        }
    }

    // Admin: Manual points adjustment
    static async adjustPoints(req, res) {
        try {
            const { userId, points, description } = req.body;

            if (!userId || !points || !description) {
                return res.status(400).json({
                    success: false,
                    message: "userId, points, and description are required"
                });
            }

            const result = await PointsModel.adjustPoints(userId, points, description);

            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: "Points adjusted successfully",
                    newBalance: result.newBalance
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Failed to adjust points"
                });
            }
        } catch (error) {
            console.error("Error in adjustPoints:", error);
            return res.status(500).json({
                success: false,
                message: "Error adjusting points",
                error: error.message
            });
        }
    }

    // Get points dashboard summary (points + recent history)
    static async getPointsDashboard(req, res) {
        try {
            const userId = req.user.userId;

            // Get both points and recent history
            const pointsResult = await PointsModel.getUserPoints(userId);
            const historyResult = await PointsModel.getPointsHistory(userId, 5);

            if (pointsResult.success && historyResult.success) {
                return res.status(200).json({
                    success: true,
                    points: pointsResult.data.total_points,
                    recentActivity: historyResult.data
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Dashboard data not found"
                });
            }
        } catch (error) {
            console.error("Error in getPointsDashboard:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving dashboard data",
                error: error.message
            });
        }
    }
}

module.exports = PointsController;
