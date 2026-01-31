const ReviewModel = require('../models/reviewModel');

class ReviewController {
    // Create a new review
    static async createReview(req, res) {
        try {
            const { hawker_centre_id, stall_id, food_item_id, rating, comment, images } = req.body;
            const user = req.user;

            // Validation
            if (!user || !user.userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
            }

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
            }

            if (!hawker_centre_id && !stall_id && !food_item_id) {
                return res.status(400).json({ success: false, message: 'At least one of hawker_centre_id, stall_id, or food_item_id is required' });
            }

            // Check if user already reviewed this entity
            const hasReviewed = await ReviewModel.checkUserReview(
                user.userId,
                hawker_centre_id,
                stall_id,
                food_item_id
            );

            if (hasReviewed) {
                return res.status(400).json({ success: false, message: 'You have already reviewed this' });
            }

            // Create review
            const reviewData = {
                user_id: user.userId,
                hawker_centre_id: hawker_centre_id || null,
                stall_id: stall_id || null,
                food_item_id: food_item_id || null,
                rating,
                comment: comment || null,
                images: images || null
            };

            const result = await ReviewModel.createReview(reviewData);

            // Update ratings in respective tables
            if (hawker_centre_id) {
                await ReviewModel.updateHawkerCentreRating(hawker_centre_id);
            }
            if (stall_id) {
                await ReviewModel.updateStallRating(stall_id);
            }

            res.status(201).json({ success: true, data: result.data });
        } catch (error) {
            console.error('Error in createReview:', error);
            res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
        }
    }

    // Get reviews by hawker centre
    static async getReviewsByHawkerCentre(req, res) {
        try {
            const { hawkerCentreId } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            if (!hawkerCentreId || isNaN(hawkerCentreId)) {
                return res.status(400).json({ success: false, message: 'Valid hawker centre ID is required' });
            }

            const result = await ReviewModel.getReviewsByHawkerCentre(parseInt(hawkerCentreId), limit, offset);

            res.status(200).json({
                success: true,
                data: result.data,
                count: result.count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Error in getReviewsByHawkerCentre:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
        }
    }

    // Get reviews by stall
    static async getReviewsByStall(req, res) {
        try {
            const { stallId } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const result = await ReviewModel.getReviewsByStall(parseInt(stallId), limit, offset);

            res.status(200).json({
                success: true,
                data: result.data,
                count: result.count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Error in getReviewsByStall:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
        }
    }

    // Get reviews by food item
    static async getReviewsByFoodItem(req, res) {
        try {
            const { foodItemId } = req.params;
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            if (!foodItemId || isNaN(foodItemId)) {
                return res.status(400).json({ success: false, message: 'Valid food item ID is required' });
            }

            const result = await ReviewModel.getReviewsByFoodItem(parseInt(foodItemId), limit, offset);

            res.status(200).json({
                success: true,
                data: result.data,
                count: result.count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Error in getReviewsByFoodItem:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
        }
    }

    // Get user's own reviews
    static async getUserReviews(req, res) {
        try {
            const user = req.user;

            if (!user || !user.userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
            }

            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;

            const result = await ReviewModel.getReviewsByUser(user.userId, limit, offset);

            res.status(200).json({
                success: true,
                data: result.data,
                count: result.count,
                limit,
                offset
            });
        } catch (error) {
            console.error('Error in getUserReviews:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch user reviews', error: error.message });
        }
    }

    // Get single review
    static async getReview(req, res) {
        try {
            const { reviewId } = req.params;

            if (!reviewId || isNaN(reviewId)) {
                return res.status(400).json({ success: false, message: 'Valid review ID is required' });
            }

            const review = await ReviewModel.getReviewById(parseInt(reviewId));

            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found' });
            }

            res.status(200).json({ success: true, data: review });
        } catch (error) {
            console.error('Error in getReview:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch review', error: error.message });
        }
    }

    // Update review
    static async updateReview(req, res) {
        try {
            const { reviewId } = req.params;
            const { rating, comment, images } = req.body;
            const user = req.user;

            if (!reviewId || isNaN(reviewId)) {
                return res.status(400).json({ success: false, message: 'Valid review ID is required' });
            }

            if (!user || !user.userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
            }

            // Check ownership
            const review = await ReviewModel.getReviewById(parseInt(reviewId));
            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found' });
            }

            if (review.user_id !== user.userId) {
                return res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own reviews' });
            }

            // Validate rating if provided
            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
            }

            // Update review
            const updateData = {
                rating: rating || review.rating,
                comment: comment !== undefined ? comment : review.comment,
                images: images || review.images
            };

            const result = await ReviewModel.updateReview(parseInt(reviewId), updateData);

            // Update ratings in respective tables
            if (review.hawker_centre_id) {
                await ReviewModel.updateHawkerCentreRating(review.hawker_centre_id);
            }
            if (review.stall_id) {
                await ReviewModel.updateStallRating(review.stall_id);
            }

            res.status(200).json({ success: true, data: result.data });
        } catch (error) {
            console.error('Error in updateReview:', error);
            res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
        }
    }

    // Delete review
    static async deleteReview(req, res) {
        try {
            const { reviewId } = req.params;
            const user = req.user;

            if (!reviewId || isNaN(reviewId)) {
                return res.status(400).json({ success: false, message: 'Valid review ID is required' });
            }

            if (!user || !user.userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
            }

            // Check ownership
            const review = await ReviewModel.getReviewById(parseInt(reviewId));
            if (!review) {
                return res.status(404).json({ success: false, message: 'Review not found' });
            }

            if (review.user_id !== user.userId && user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own reviews' });
            }

            // Delete review
            await ReviewModel.deleteReview(parseInt(reviewId));

            // Update ratings in respective tables
            if (review.hawker_centre_id) {
                await ReviewModel.updateHawkerCentreRating(review.hawker_centre_id);
            }
            if (review.stall_id) {
                await ReviewModel.updateStallRating(review.stall_id);
            }

            res.status(200).json({ success: true, message: 'Review deleted successfully' });
        } catch (error) {
            console.error('Error in deleteReview:', error);
            res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message });
        }
    }

    // Get rating stats for hawker centre
    static async getHawkerCentreRatingStats(req, res) {
        try {
            const { hawkerCentreId } = req.params;

            if (!hawkerCentreId || isNaN(hawkerCentreId)) {
                return res.status(400).json({ success: false, message: 'Valid hawker centre ID is required' });
            }

            const stats = await ReviewModel.getHawkerCentreRatingStats(parseInt(hawkerCentreId));

            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            console.error('Error in getHawkerCentreRatingStats:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch rating stats', error: error.message });
        }
    }

    // Get rating stats for stall
    static async getStallRatingStats(req, res) {
        try {
            const { stallId } = req.params;

            if (!stallId || isNaN(stallId)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const stats = await ReviewModel.getStallRatingStats(parseInt(stallId));

            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            console.error('Error in getStallRatingStats:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch rating stats', error: error.message });
        }
    }

    // Get rating stats for food item
    static async getFoodItemRatingStats(req, res) {
        try {
            const { foodItemId } = req.params;

            if (!foodItemId || isNaN(foodItemId)) {
                return res.status(400).json({ success: false, message: 'Valid food item ID is required' });
            }

            const stats = await ReviewModel.getFoodItemRatingStats(parseInt(foodItemId));

            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            console.error('Error in getFoodItemRatingStats:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch rating stats', error: error.message });
        }
    }
}

module.exports = ReviewController;
