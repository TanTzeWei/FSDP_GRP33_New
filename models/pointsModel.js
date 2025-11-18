const sql = require("mssql");
const dbConfig = require("../dbConfig");

class PointsModel {
    // Get user's current points balance
    static async getUserPoints(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT id, user_id, total_points, created_at, updated_at
                FROM user_points
                WHERE user_id = @userId
            `;

            const request = pool.request();
            request.input("userId", sql.Int, userId);

            const result = await request.query(query);
            
            // If user doesn't have points record, create one
            if (result.recordset.length === 0) {
                return await this.initializeUserPoints(userId);
            }
            
            return { success: true, data: result.recordset[0] };
        } catch (error) {
            console.error("Error getting user points:", error);
            throw error;
        }
    }

    // Initialize points for a new user
    static async initializeUserPoints(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                INSERT INTO user_points (user_id, total_points)
                OUTPUT INSERTED.*
                VALUES (@userId, 0)
            `;

            const request = pool.request();
            request.input("userId", sql.Int, userId);

            const result = await request.query(query);
            return { success: true, data: result.recordset[0] };
        } catch (error) {
            console.error("Error initializing user points:", error);
            throw error;
        }
    }

    // Add points for photo upload
    static async addPhotoUploadPoints(userId, itemDetails) {
        try {
            const pool = await sql.connect(dbConfig);
            const pointsEarned = 10;

            // Start transaction
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Add to points history
                const historyQuery = `
                    INSERT INTO points_history (user_id, transaction_type, points, description, reference_type, item_details)
                    OUTPUT INSERTED.*
                    VALUES (@userId, 'upload', @points, @description, 'photo', @itemDetails)
                `;

                const historyRequest = new sql.Request(transaction);
                historyRequest.input("userId", sql.Int, userId);
                historyRequest.input("points", sql.Int, pointsEarned);
                historyRequest.input("description", sql.NVarChar, 'Photo uploaded');
                historyRequest.input("itemDetails", sql.NVarChar, JSON.stringify(itemDetails));

                const historyResult = await historyRequest.query(historyQuery);

                // Update user points balance
                const updateQuery = `
                    UPDATE user_points
                    SET total_points = total_points + @points, updated_at = GETDATE()
                    OUTPUT INSERTED.total_points
                    WHERE user_id = @userId
                `;

                const updateRequest = new sql.Request(transaction);
                updateRequest.input("userId", sql.Int, userId);
                updateRequest.input("points", sql.Int, pointsEarned);

                const updateResult = await updateRequest.query(updateQuery);

                await transaction.commit();

                return {
                    success: true,
                    pointsEarned,
                    newBalance: updateResult.recordset[0].total_points,
                    transaction: historyResult.recordset[0]
                };
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error("Error adding photo upload points:", error);
            throw error;
        }
    }

    // Add points for receiving upvote
    static async addUpvotePoints(userId, itemDetails) {
        try {
            const pool = await sql.connect(dbConfig);
            const pointsEarned = 5;

            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Add to points history
                const historyQuery = `
                    INSERT INTO points_history (user_id, transaction_type, points, description, reference_type, item_details)
                    OUTPUT INSERTED.*
                    VALUES (@userId, 'upvote', @points, @description, 'review', @itemDetails)
                `;

                const historyRequest = new sql.Request(transaction);
                historyRequest.input("userId", sql.Int, userId);
                historyRequest.input("points", sql.Int, pointsEarned);
                historyRequest.input("description", sql.NVarChar, 'Upvote received');
                historyRequest.input("itemDetails", sql.NVarChar, JSON.stringify(itemDetails));

                const historyResult = await historyRequest.query(historyQuery);

                // Update user points balance
                const updateQuery = `
                    UPDATE user_points
                    SET total_points = total_points + @points, updated_at = GETDATE()
                    OUTPUT INSERTED.total_points
                    WHERE user_id = @userId
                `;

                const updateRequest = new sql.Request(transaction);
                updateRequest.input("userId", sql.Int, userId);
                updateRequest.input("points", sql.Int, pointsEarned);

                const updateResult = await updateRequest.query(updateQuery);

                await transaction.commit();

                return {
                    success: true,
                    pointsEarned,
                    newBalance: updateResult.recordset[0].total_points,
                    transaction: historyResult.recordset[0]
                };
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error("Error adding upvote points:", error);
            throw error;
        }
    }

    // Get user's points history
    static async getPointsHistory(userId, limit = 50) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT TOP (@limit) id, user_id, transaction_type, points, description, 
                       reference_type, reference_id, item_details, created_at
                FROM points_history
                WHERE user_id = @userId
                ORDER BY created_at DESC
            `;

            const request = pool.request();
            request.input("userId", sql.Int, userId);
            request.input("limit", sql.Int, limit);

            const result = await request.query(query);

            // Parse item_details JSON for each record
            const history = result.recordset.map(record => ({
                ...record,
                item_details: record.item_details ? JSON.parse(record.item_details) : null
            }));

            return { success: true, data: history };
        } catch (error) {
            console.error("Error getting points history:", error);
            throw error;
        }
    }

    // Get all available vouchers
    static async getAllVouchers() {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT id, name, description, voucher_type, discount_value, 
                       minimum_purchase, points_required, validity_days, 
                       is_active, terms_conditions, created_at
                FROM vouchers
                WHERE is_active = 1
                ORDER BY points_required ASC
            `;

            const result = await pool.request().query(query);

            // Parse terms_conditions JSON for each voucher
            const vouchers = result.recordset.map(voucher => ({
                ...voucher,
                terms_conditions: voucher.terms_conditions ? JSON.parse(voucher.terms_conditions) : []
            }));

            return { success: true, data: vouchers };
        } catch (error) {
            console.error("Error getting vouchers:", error);
            throw error;
        }
    }

    // Redeem voucher
    static async redeemVoucher(userId, voucherId) {
        try {
            const pool = await sql.connect(dbConfig);
            
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Get voucher details
                const voucherQuery = `
                    SELECT id, name, description, voucher_type, discount_value, 
                           minimum_purchase, points_required, validity_days
                    FROM vouchers
                    WHERE id = @voucherId AND is_active = 1
                `;

                const voucherRequest = new sql.Request(transaction);
                voucherRequest.input("voucherId", sql.Int, voucherId);
                const voucherResult = await voucherRequest.query(voucherQuery);

                if (voucherResult.recordset.length === 0) {
                    await transaction.rollback();
                    return { success: false, message: "Voucher not found or inactive" };
                }

                const voucher = voucherResult.recordset[0];

                // Check user has enough points
                const pointsQuery = `
                    SELECT total_points
                    FROM user_points
                    WHERE user_id = @userId
                `;

                const pointsRequest = new sql.Request(transaction);
                pointsRequest.input("userId", sql.Int, userId);
                const pointsResult = await pointsRequest.query(pointsQuery);

                if (pointsResult.recordset.length === 0) {
                    await transaction.rollback();
                    return { success: false, message: "User points not found" };
                }

                const userPoints = pointsResult.recordset[0].total_points;

                if (userPoints < voucher.points_required) {
                    await transaction.rollback();
                    return { success: false, message: "Not enough points" };
                }

                // Generate unique voucher code
                const voucherCode = 'HWK' + Math.random().toString(36).substring(2, 8).toUpperCase();

                // Calculate expiry date
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + voucher.validity_days);

                // Create redeemed voucher
                const redeemQuery = `
                    INSERT INTO redeemed_vouchers (user_id, voucher_id, voucher_code, expiry_date)
                    OUTPUT INSERTED.*
                    VALUES (@userId, @voucherId, @voucherCode, @expiryDate)
                `;

                const redeemRequest = new sql.Request(transaction);
                redeemRequest.input("userId", sql.Int, userId);
                redeemRequest.input("voucherId", sql.Int, voucherId);
                redeemRequest.input("voucherCode", sql.NVarChar, voucherCode);
                redeemRequest.input("expiryDate", sql.DateTime2, expiryDate);

                const redeemResult = await redeemRequest.query(redeemQuery);

                // Add to points history
                const historyQuery = `
                    INSERT INTO points_history (user_id, transaction_type, points, description, reference_type, reference_id)
                    VALUES (@userId, 'redeem', @points, @description, 'voucher', @referenceId)
                `;

                const historyRequest = new sql.Request(transaction);
                historyRequest.input("userId", sql.Int, userId);
                historyRequest.input("points", sql.Int, -voucher.points_required);
                historyRequest.input("description", sql.NVarChar, `Redeemed: ${voucher.name}`);
                historyRequest.input("referenceId", sql.Int, redeemResult.recordset[0].id);

                await historyRequest.query(historyQuery);

                // Update user points balance
                const updateQuery = `
                    UPDATE user_points
                    SET total_points = total_points - @points, updated_at = GETDATE()
                    OUTPUT INSERTED.total_points
                    WHERE user_id = @userId
                `;

                const updateRequest = new sql.Request(transaction);
                updateRequest.input("userId", sql.Int, userId);
                updateRequest.input("points", sql.Int, voucher.points_required);

                const updateResult = await updateRequest.query(updateQuery);

                await transaction.commit();

                return {
                    success: true,
                    voucher: {
                        ...voucher,
                        code: voucherCode,
                        redeemed_date: redeemResult.recordset[0].redeemed_date,
                        expiry_date: expiryDate,
                        used: false
                    },
                    newBalance: updateResult.recordset[0].total_points
                };
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error("Error redeeming voucher:", error);
            throw error;
        }
    }

    // Get user's redeemed vouchers
    static async getRedeemedVouchers(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT rv.id, rv.voucher_code, rv.redeemed_date, rv.expiry_date, 
                       rv.is_used, rv.used_date, rv.order_id,
                       v.name, v.description, v.voucher_type, v.discount_value, 
                       v.minimum_purchase, v.points_required, v.terms_conditions
                FROM redeemed_vouchers rv
                JOIN vouchers v ON rv.voucher_id = v.id
                WHERE rv.user_id = @userId
                ORDER BY rv.redeemed_date DESC
            `;

            const request = pool.request();
            request.input("userId", sql.Int, userId);

            const result = await request.query(query);

            // Parse terms_conditions and add expiry status
            const vouchers = result.recordset.map(voucher => ({
                ...voucher,
                terms_conditions: voucher.terms_conditions ? JSON.parse(voucher.terms_conditions) : [],
                is_expired: new Date(voucher.expiry_date) < new Date()
            }));

            return { success: true, data: vouchers };
        } catch (error) {
            console.error("Error getting redeemed vouchers:", error);
            throw error;
        }
    }

    // Use/mark voucher as used
    static async useVoucher(userId, voucherCode, orderId = null) {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Check voucher exists and belongs to user
            const checkQuery = `
                SELECT id, user_id, is_used, expiry_date
                FROM redeemed_vouchers
                WHERE voucher_code = @voucherCode AND user_id = @userId
            `;

            const checkRequest = pool.request();
            checkRequest.input("voucherCode", sql.NVarChar, voucherCode);
            checkRequest.input("userId", sql.Int, userId);

            const checkResult = await checkRequest.query(checkQuery);

            if (checkResult.recordset.length === 0) {
                return { success: false, message: "Voucher not found" };
            }

            const voucher = checkResult.recordset[0];

            if (voucher.is_used) {
                return { success: false, message: "Voucher already used" };
            }

            if (new Date(voucher.expiry_date) < new Date()) {
                return { success: false, message: "Voucher expired" };
            }

            // Mark as used
            const updateQuery = `
                UPDATE redeemed_vouchers
                SET is_used = 1, used_date = GETDATE(), order_id = @orderId
                WHERE voucher_code = @voucherCode AND user_id = @userId
            `;

            const updateRequest = pool.request();
            updateRequest.input("voucherCode", sql.NVarChar, voucherCode);
            updateRequest.input("userId", sql.Int, userId);
            updateRequest.input("orderId", sql.Int, orderId);

            await updateRequest.query(updateQuery);

            return { success: true, message: "Voucher marked as used" };
        } catch (error) {
            console.error("Error using voucher:", error);
            throw error;
        }
    }

    // Get voucher by code (for validation)
    static async getVoucherByCode(voucherCode) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT rv.id, rv.user_id, rv.voucher_code, rv.redeemed_date, 
                       rv.expiry_date, rv.is_used, rv.used_date,
                       v.name, v.description, v.voucher_type, v.discount_value, 
                       v.minimum_purchase, v.terms_conditions
                FROM redeemed_vouchers rv
                JOIN vouchers v ON rv.voucher_id = v.id
                WHERE rv.voucher_code = @voucherCode
            `;

            const request = pool.request();
            request.input("voucherCode", sql.NVarChar, voucherCode);

            const result = await request.query(query);

            if (result.recordset.length === 0) {
                return { success: false, message: "Voucher not found" };
            }

            const voucher = {
                ...result.recordset[0],
                terms_conditions: result.recordset[0].terms_conditions ? 
                    JSON.parse(result.recordset[0].terms_conditions) : [],
                is_expired: new Date(result.recordset[0].expiry_date) < new Date()
            };

            return { success: true, data: voucher };
        } catch (error) {
            console.error("Error getting voucher by code:", error);
            throw error;
        }
    }

    // Admin: Adjust user points (manual adjustment)
    static async adjustPoints(userId, points, description) {
        try {
            const pool = await sql.connect(dbConfig);
            
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // Add to points history
                const historyQuery = `
                    INSERT INTO points_history (user_id, transaction_type, points, description, reference_type)
                    VALUES (@userId, 'adjust', @points, @description, 'admin')
                `;

                const historyRequest = new sql.Request(transaction);
                historyRequest.input("userId", sql.Int, userId);
                historyRequest.input("points", sql.Int, points);
                historyRequest.input("description", sql.NVarChar, description);

                await historyRequest.query(historyQuery);

                // Update user points balance
                const updateQuery = `
                    UPDATE user_points
                    SET total_points = total_points + @points, updated_at = GETDATE()
                    OUTPUT INSERTED.total_points
                    WHERE user_id = @userId
                `;

                const updateRequest = new sql.Request(transaction);
                updateRequest.input("userId", sql.Int, userId);
                updateRequest.input("points", sql.Int, points);

                const updateResult = await updateRequest.query(updateQuery);

                await transaction.commit();

                return {
                    success: true,
                    newBalance: updateResult.recordset[0].total_points
                };
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error("Error adjusting points:", error);
            throw error;
        }
    }
}

module.exports = PointsModel;
