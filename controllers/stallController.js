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
}

module.exports = StallController;
