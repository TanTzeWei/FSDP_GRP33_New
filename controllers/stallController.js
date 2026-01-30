const StallModel = require('../models/stallModel');
const multer = require('multer');
const CloudinaryUpload = require('../utils/cloudinaryUpload');
const { v4: uuidv4 } = require('uuid');

// Configure multer for stall image upload
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    }
});

class StallController {
    // Middleware for handling stall image upload
    static uploadMiddleware = upload.single('stallImage');

    /**
     * Get all stalls
     * GET /api/stalls
     */
    static async getAllStalls(req, res) {
        try {
            const stalls = await StallModel.getAllStalls();
            res.status(200).json({ success: true, data: stalls });
        } catch (error) {
            console.error('Error in getAllStalls:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch stalls', error: error.message });
        }
    }

    static async getStallById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(id)) return res.status(400).json({ success: false, message: 'Valid stall ID is required' });

            const stall = await StallModel.getStallById(parseInt(id));
            if (!stall) return res.status(404).json({ success: false, message: 'Stall not found' });

            // parse specialties JSON if present
            try {
                stall.specialties = stall.specialties ? JSON.parse(stall.specialties) : [];
            } catch (e) {
                stall.specialties = [];
            }

            res.status(200).json({ success: true, data: stall });
        } catch (error) {
            console.error('Error in getStallById:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch stall', error: error.message });
        }
    }

    /**
     * Upload stall banner/cover image
     * POST /api/stalls/:id/image
     */
    static async uploadStallImage(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userStallId = req.user?.stall_id || req.user?.stallId;

            console.log('=== STALL IMAGE UPLOAD ===');
            console.log('Stall ID:', id);
            console.log('User ID:', userId);
            console.log('User Stall ID:', userStallId);

            // Validate stall ID
            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const stallId = parseInt(id);

            // Verify the user owns this stall
            if (userStallId !== stallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only upload images for your own stall' 
                });
            }

            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No image file uploaded' });
            }

            // Check Cloudinary configuration
            if (!CloudinaryUpload.isConfigured()) {
                return res.status(500).json({ success: false, message: 'Upload service not configured' });
            }

            console.log('Uploading stall image to Cloudinary...');

            // Upload to Cloudinary with stall-specific folder
            const fileName = `stall-${stallId}-${uuidv4()}`;
            const result = await CloudinaryUpload.uploadFile(
                req.file.buffer,
                fileName,
                'hawker-hub/stalls',
                {
                    quality: 'auto',
                    fetch_format: 'auto',
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto', width: 1200, height: 400, crop: 'fill', gravity: 'auto' }
                    ]
                }
            );

            console.log('Cloudinary upload successful:', result.secure_url);

            // Update stall with new image URL
            const updatedStall = await StallModel.updateStallImage(stallId, result.secure_url);

            console.log('Stall image updated in database');

            res.status(200).json({
                success: true,
                message: 'Stall image uploaded successfully',
                data: {
                    imageUrl: result.secure_url,
                    stall: updatedStall
                }
            });

        } catch (error) {
            console.error('Error uploading stall image:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to upload stall image',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Update stall details
     * PUT /api/stalls/:id
     */
    static async updateStall(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userStallId = req.user?.stall_id || req.user?.stallId;

            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const stallId = parseInt(id);

            // Verify the user owns this stall
            if (userStallId !== stallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only update your own stall' 
                });
            }

            // Extract allowed fields to update
            const { stall_name, description, opening_hours, closing_hours, operating_days, contact_phone, image_url } = req.body;
            
            const updateData = {};
            if (stall_name) updateData.stall_name = stall_name;
            if (description !== undefined) updateData.description = description;
            if (opening_hours) updateData.opening_hours = opening_hours;
            if (closing_hours) updateData.closing_hours = closing_hours;
            if (operating_days) updateData.operating_days = operating_days;
            if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
            if (image_url !== undefined) updateData.image_url = image_url;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: 'No valid fields to update' });
            }

            const updatedStall = await StallModel.updateStall(stallId, updateData);

            res.status(200).json({
                success: true,
                message: 'Stall updated successfully',
                data: updatedStall
            });

        } catch (error) {
            console.error('Error updating stall:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update stall',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Delete a stall (Admin only)
     * DELETE /api/stalls/:id
     */
    static async deleteStall(req, res) {
        try {
            const { id } = req.params;
            const supabase = require('../dbConfig');

            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const stallId = parseInt(id);

            // Check if stall exists
            const { data: stall, error: fetchError } = await supabase
                .from('stalls')
                .select('id, stall_name')
                .eq('id', stallId)
                .maybeSingle();

            if (fetchError || !stall) {
                return res.status(404).json({ success: false, message: 'Stall not found' });
            }

            // Unlink any users associated with this stall
            await supabase
                .from('users')
                .update({ stall_id: null })
                .eq('stall_id', stallId);

            // Delete the stall (CASCADE will handle related records based on schema)
            const { error: deleteError } = await supabase
                .from('stalls')
                .delete()
                .eq('id', stallId);

            if (deleteError) {
                return res.status(400).json({ 
                    success: false, 
                    message: deleteError.message || 'Failed to delete stall' 
                });
            }

            res.json({ 
                success: true, 
                message: `Stall "${stall.stall_name}" deleted successfully` 
            });

        } catch (error) {
            console.error('Error deleting stall:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to delete stall',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Update stall social media links
     * PUT /api/stalls/:id/social-media
     */
    static async updateStallSocialMedia(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userStallId = req.user?.stall_id || req.user?.stallId;

            // Validate stall ID
            if (!id || isNaN(id)) {
                return res.status(400).json({ success: false, message: 'Valid stall ID is required' });
            }

            const stallId = parseInt(id);

            // Verify the user owns this stall
            if (userStallId !== stallId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only update social media for your own stall' 
                });
            }

            const { facebook_url, instagram_url, twitter_url, tiktok_url, website_url } = req.body;

            // Basic URL validation
            const urlPattern = /^https?:\/\/.+/i;
            const urls = { facebook_url, instagram_url, twitter_url, tiktok_url, website_url };
            
            for (const [key, value] of Object.entries(urls)) {
                if (value && !urlPattern.test(value)) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Invalid URL format for ${key.replace('_url', '')}` 
                    });
                }
            }

            const result = await StallModel.updateStallSocialMedia(stallId, {
                facebook_url: facebook_url || null,
                instagram_url: instagram_url || null,
                twitter_url: twitter_url || null,
                tiktok_url: tiktok_url || null,
                website_url: website_url || null
            });

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json({ 
                success: true, 
                message: 'Social media links updated successfully',
                stall: result.stall
            });

        } catch (error) {
            console.error('Error updating social media:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update social media links',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = StallController;
