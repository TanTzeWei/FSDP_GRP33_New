const supabase = require('../dbConfig');

class ReviewModel {
    // Create a new review
    static async createReview(reviewData) {
        try {
            const { user_id, hawker_centre_id, stall_id, food_item_id, rating, comment, images } = reviewData;

            const { data, error } = await supabase
                .from('reviews')
                .insert([{
                    user_id,
                    hawker_centre_id,
                    stall_id,
                    food_item_id,
                    rating,
                    comment: comment || null,
                    images: images || null
                }])
                .select('id, user_id, hawker_centre_id, stall_id, food_item_id, rating, comment, images, created_at')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    }

    // Get reviews by hawker centre
    static async getReviewsByHawkerCentre(hawkerCentreId, limit = 20, offset = 0) {
        try {
            const { data, error, count } = await supabase
                .from('reviews')
                .select(`
                    id,
                    user_id,
                    hawker_centre_id,
                    stall_id,
                    food_item_id,
                    rating,
                    comment,
                    images,
                    created_at,
                    users(name, email)
                `, { count: 'exact' })
                .eq('hawker_centre_id', hawkerCentreId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data, count };
        } catch (error) {
            console.error('Error fetching hawker centre reviews:', error);
            throw error;
        }
    }

    // Get reviews by stall
    static async getReviewsByStall(stallId, limit = 20, offset = 0) {
        try {
            const { data, error, count } = await supabase
                .from('reviews')
                .select(`
                    id,
                    user_id,
                    hawker_centre_id,
                    stall_id,
                    food_item_id,
                    rating,
                    comment,
                    images,
                    created_at,
                    users(name, email)
                `, { count: 'exact' })
                .eq('stall_id', stallId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data, count };
        } catch (error) {
            console.error('Error fetching stall reviews:', error);
            throw error;
        }
    }

    // Get reviews by food item
    static async getReviewsByFoodItem(foodItemId, limit = 20, offset = 0) {
        try {
            const { data, error, count } = await supabase
                .from('reviews')
                .select(`
                    id,
                    user_id,
                    hawker_centre_id,
                    stall_id,
                    food_item_id,
                    rating,
                    comment,
                    images,
                    created_at,
                    users(name, email)
                `, { count: 'exact' })
                .eq('food_item_id', foodItemId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data, count };
        } catch (error) {
            console.error('Error fetching food item reviews:', error);
            throw error;
        }
    }

    // Get single review
    static async getReviewById(reviewId) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    id,
                    user_id,
                    hawker_centre_id,
                    stall_id,
                    food_item_id,
                    rating,
                    comment,
                    images,
                    created_at,
                    users(name, email)
                `)
                .eq('id', reviewId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching review:', error);
            throw error;
        }
    }

    // Update review
    static async updateReview(reviewId, updateData) {
        try {
            const { rating, comment, images } = updateData;

            const { data, error } = await supabase
                .from('reviews')
                .update({
                    rating: rating || undefined,
                    comment: comment !== undefined ? comment : undefined,
                    images: images || undefined,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId)
                .select('id, user_id, hawker_centre_id, stall_id, food_item_id, rating, comment, images, created_at, updated_at')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    }

    // Delete review
    static async deleteReview(reviewId) {
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }

    // Get average rating and count for hawker centre
    static async getHawkerCentreRatingStats(hawkerCentreId) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('rating')
                .eq('hawker_centre_id', hawkerCentreId)
                .is('stall_id', null)
                .is('food_item_id', null);

            if (error) throw error;

            if (!data || data.length === 0) {
                return { averageRating: 0, totalReviews: 0 };
            }

            const averageRating = (data.reduce((sum, review) => sum + review.rating, 0) / data.length).toFixed(2);
            return { averageRating: parseFloat(averageRating), totalReviews: data.length };
        } catch (error) {
            console.error('Error calculating hawker centre rating stats:', error);
            throw error;
        }
    }

    // Get average rating and count for stall
    static async getStallRatingStats(stallId) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('rating')
                .eq('stall_id', stallId)
                .is('food_item_id', null);

            if (error) throw error;

            if (!data || data.length === 0) {
                return { averageRating: 0, totalReviews: 0 };
            }

            const averageRating = (data.reduce((sum, review) => sum + review.rating, 0) / data.length).toFixed(2);
            return { averageRating: parseFloat(averageRating), totalReviews: data.length };
        } catch (error) {
            console.error('Error calculating stall rating stats:', error);
            throw error;
        }
    }

    // Get average rating and count for food item
    static async getFoodItemRatingStats(foodItemId) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('rating')
                .eq('food_item_id', foodItemId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return { averageRating: 0, totalReviews: 0 };
            }

            const averageRating = (data.reduce((sum, review) => sum + review.rating, 0) / data.length).toFixed(2);
            return { averageRating: parseFloat(averageRating), totalReviews: data.length };
        } catch (error) {
            console.error('Error calculating food item rating stats:', error);
            throw error;
        }
    }

    // Check if user has already reviewed
    static async checkUserReview(userId, hawkerCentreId = null, stallId = null, foodItemId = null) {
        try {
            let query = supabase
                .from('reviews')
                .select('id')
                .eq('user_id', userId);

            if (hawkerCentreId) query = query.eq('hawker_centre_id', hawkerCentreId);
            if (stallId) query = query.eq('stall_id', stallId);
            if (foodItemId) query = query.eq('food_item_id', foodItemId);

            const { data, error } = await query.maybeSingle();

            if (error) throw error;
            return data ? true : false;
        } catch (error) {
            console.error('Error checking user review:', error);
            throw error;
        }
    }

    // Update hawker centre rating in database
    static async updateHawkerCentreRating(hawkerCentreId) {
        try {
            const stats = await this.getHawkerCentreRatingStats(hawkerCentreId);

            const { error } = await supabase
                .from('hawker_centres')
                .update({
                    rating: stats.averageRating,
                    total_reviews: stats.totalReviews,
                    updated_at: new Date().toISOString()
                })
                .eq('id', hawkerCentreId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating hawker centre rating:', error);
            throw error;
        }
    }

    // Update stall rating in database
    static async updateStallRating(stallId) {
        try {
            const stats = await this.getStallRatingStats(stallId);

            const { error } = await supabase
                .from('stalls')
                .update({
                    rating: stats.averageRating,
                    total_reviews: stats.totalReviews,
                    updated_at: new Date().toISOString()
                })
                .eq('id', stallId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating stall rating:', error);
            throw error;
        }
    }

    // Get reviews by user
    static async getReviewsByUser(userId, limit = 20, offset = 0) {
        try {
            const { data, error, count } = await supabase
                .from('reviews')
                .select(`
                    id,
                    user_id,
                    hawker_centre_id,
                    stall_id,
                    food_item_id,
                    rating,
                    comment,
                    images,
                    created_at,
                    hawker_centres(name),
                    stalls(stall_name),
                    food_items(name)
                `, { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return { success: true, data, count };
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            throw error;
        }
    }
}

module.exports = ReviewModel;
