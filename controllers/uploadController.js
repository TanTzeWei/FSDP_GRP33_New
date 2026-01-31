// controllers/uploadController.js
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const UploadModel = require('../models/uploadModel');
const CloudinaryUpload = require('../utils/cloudinaryUpload');
const ImageAIValidation = require('../utils/imageAIValidation');
const PointsModel = require('../models/pointsModel');

// Configure multer to store files in memory (will be uploaded to Cloudinary)
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// Configure multer middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file per upload
  }
});

class UploadController {
  // Middleware for handling single photo upload
  static uploadMiddleware = upload.single('photo');

  // Middleware for review image upload (single file, field name 'image')
  static uploadReviewImageMiddleware = upload.single('image');

  // Upload a new photo to Cloudinary
  static async uploadPhoto(req, res) {
    console.log('=== UPLOAD REQUEST RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      console.log('Request method:', req.method);
      console.log('Request URL:', req.url);
      console.log('Request file exists:', !!req.file);
      if (req.file) {
        console.log('File details:');
        console.log('- Original name:', req.file.originalname);
        console.log('- MIME type:', req.file.mimetype);
        console.log('- Size:', req.file.size);
      }

      // Validate required fields
      const { dishName, description, hawkerCentreId, stallId } = req.body;
      // Extract user ID from auth middleware (supports multiple formats)
      console.log('req.user object:', JSON.stringify(req.user, null, 2));
      const userId = req.user?.userId || req.user?.user_id || req.user?.id || 1;
      
      console.log('Form data extracted:');
      console.log('- Dish name:', dishName);
      console.log('- Description:', description);
      console.log('- Hawker centre ID:', hawkerCentreId);
      console.log('- Stall ID:', stallId);
      console.log('- User ID:', userId);

      if (!dishName || !hawkerCentreId) {
        console.log('ERROR: Validation failed - missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Dish name and hawker centre are required'
        });
      }

      if (!req.file) {
        console.log('ERROR: No file in request');
        return res.status(400).json({
          success: false,
          message: 'No photo file uploaded'
        });
      }

      // Check Cloudinary configuration
      if (!CloudinaryUpload.isConfigured()) {
        console.log('ERROR: Cloudinary not configured');
        return res.status(500).json({
          success: false,
          message: 'Upload service not configured'
        });
      }

      // === AI VALIDATION ===
      // Validate image using AI before uploading to Cloudinary
      console.log('Starting AI validation...');
      
      const enableAIValidation = process.env.ENABLE_AI_VALIDATION === 'true';
      const strictMode = process.env.AI_VALIDATION_STRICT === 'true';
      
      if (enableAIValidation && ImageAIValidation.isConfigured()) {
        try {
          const validationResult = await ImageAIValidation.validate(req.file.buffer, {
            strictMode: strictMode
          });

          console.log('AI Validation Result:', {
            isValid: validationResult.isValid,
            message: validationResult.message,
            confidence: validationResult.confidence
          });

          // If validation fails and we're in strict mode, reject the upload
          if (!validationResult.isValid) {
            console.log('AI validation FAILED - rejecting upload');
            return res.status(400).json({
              success: false,
              message: validationResult.message || 'Image validation failed',
              validationDetails: {
                isFoodRelated: validationResult.isFoodRelated,
                hasInappropriateContent: validationResult.hasInappropriateContent,
                confidence: validationResult.confidence,
                foodType: validationResult.foodType
              }
            });
          }

          // Add validation info to response later
          req.aiValidation = validationResult;
          
        } catch (validationError) {
          console.error('AI validation error (non-blocking):', validationError.message);
          // Continue with upload even if validation fails (unless strict mode)
          if (strictMode) {
            return res.status(500).json({
              success: false,
              message: 'Image validation service unavailable'
            });
          }
        }
      } else {
        console.log('AI validation skipped (not enabled or not configured)');
      }
      // === END AI VALIDATION ===

      console.log('Uploading to Cloudinary...');

      // Upload to Cloudinary
      const cloudinaryResult = await CloudinaryUpload.uploadPhoto(
        req.file.buffer,
        `${uuidv4()}-${req.file.originalname}`
      );

      console.log('Cloudinary upload successful:', cloudinaryResult.url);

      // Prepare photo data for database
      const photoData = {
        userId: userId, // Use authenticated user ID
        hawkerCentreId: parseInt(hawkerCentreId),
        stallId: stallId ? parseInt(stallId) : null,
        foodItemId: null, // Can be linked later
        originalName: req.file.originalname,
        imageUrl: cloudinaryResult.url, // Cloudinary URL
        publicId: cloudinaryResult.publicId, // Cloudinary public ID for deletion
        fileSize: cloudinaryResult.size,
        mimeType: cloudinaryResult.mimeType,
        dishName: dishName.trim(),
        description: description ? description.trim() : null
      };

      console.log('Photo data prepared:', {
        ...photoData,
        imageUrl: photoData.imageUrl
      });

      console.log('Calling UploadModel.savePhotoRecord...');

      // Save photo metadata to database
      const savedPhoto = await UploadModel.savePhotoRecord(photoData);

      console.log('Database save successful:', savedPhoto);

      // Get stall name for points history
      let stallName = 'Unknown Stall';
      if (stallId) {
        try {
          const StallModel = require('../models/stallModel');
          const stallData = await StallModel.getStallById(parseInt(stallId));
          if (stallData && stallData.stall_name) {
            stallName = stallData.stall_name;
          }
        } catch (err) {
          console.log('Could not get stall name:', err.message);
        }
      }

      // Award points for photo upload (only for authenticated users)
      let pointsAwarded = null;
      // Check if user is authenticated by verifying req.user exists and has a valid userId
      // Note: userId === 1 is NOT necessarily a guest - it's just the first user in the database
      const isAuthenticated = req.user && (req.user.userId || req.user.user_id);
      console.log('Checking points eligibility - userId:', userId, 'isAuthenticated:', isAuthenticated);
      if (isAuthenticated && userId) {
        try {
          console.log('Awarding points to user:', userId);
          const itemDetails = {
            stallName: stallName,
            dishName: photoData.dishName,
            photoId: savedPhoto.id,
            item: `${photoData.dishName} - ${stallName}`
          };
          const pointsResult = await PointsModel.addPhotoUploadPoints(userId, itemDetails);
          console.log('Points result:', pointsResult);
          if (pointsResult.success) {
            pointsAwarded = {
              pointsEarned: pointsResult.pointsEarned,
              newBalance: pointsResult.newBalance
            };
            console.log('✅ Points awarded successfully:', pointsAwarded);
          }
        } catch (pointsError) {
          console.error('❌ Error awarding points:', pointsError);
          // Don't fail the upload if points award fails
        }
      } else {
        console.log('⚠️ Points NOT awarded - User is not authenticated');
      }

      console.log('=== UPLOAD SUCCESS ===');

      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully!',
        data: {
          id: savedPhoto.id,
          imageUrl: photoData.imageUrl,
          dishName: photoData.dishName,
          createdAt: savedPhoto.created_at,
          // Include AI validation info if available
          aiValidation: req.aiValidation ? {
            validated: true,
            foodType: req.aiValidation.foodType,
            confidence: req.aiValidation.confidence
          } : null
        },
        points: pointsAwarded
      });

    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=== END ERROR ===');
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Upload a single image for review (returns URL only; no DB record)
  static async uploadReviewImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded' });
      }
      if (!CloudinaryUpload.isConfigured()) {
        return res.status(500).json({ success: false, message: 'Upload service not configured' });
      }
      const result = await CloudinaryUpload.uploadFile(
        req.file.buffer,
        `${uuidv4()}-${req.file.originalname}`,
        'hawker-hub/reviews',
        { quality: 'auto', fetch_format: 'auto' }
      );
      return res.status(200).json({ success: true, url: result.secure_url });
    } catch (error) {
      console.error('Review image upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Serve photo image (redirect to Cloudinary URL)
  static async getPhotoImage(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      const photoData = await UploadModel.getPhotoFilePath(parseInt(id));

      if (!photoData) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      // Redirect to Cloudinary URL
      res.redirect(photoData.image_url || photoData.file_path);

    } catch (error) {
      console.error('Error retrieving photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all photos for community snapshots
  static async getPhotos(req, res) {
    try {
      const { limit = 20, offset = 0, featured = false } = req.query;

      let photos;
      if (featured === 'true') {
        photos = await UploadModel.getFeaturedPhotos(parseInt(limit));
      } else {
        photos = await UploadModel.getAllPhotos(parseInt(limit), parseInt(offset));
      }

      // Format photos for frontend
      const formattedPhotos = photos.map(photo => ({
        id: photo.id,
        imageUrl: photo.image_url || photo.file_path, // Use actual Cloudinary URL from database
        dishName: photo.dish_name,
        stallName: photo.stalls?.stall_name || photo.hawker_centres?.name || 'Unknown Stall',
        likes: photo.likes_count || 0,
        username: photo.users?.name || 'Anonymous', // Nested object from users table
        description: photo.description,
        createdAt: photo.created_at
      }));

      res.status(200).json({
        success: true,
        data: formattedPhotos,
        total: formattedPhotos.length
      });

    } catch (error) {
      console.error('Error fetching photos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch photos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get photos by hawker centre
  static async getPhotosByHawkerCentre(req, res) {
    try {
      const { hawkerCentreId } = req.params;
      const { limit = 20 } = req.query;

      if (!hawkerCentreId) {
        return res.status(400).json({
          success: false,
          message: 'Hawker centre ID is required'
        });
      }

      const photos = await UploadModel.getPhotosByHawkerCentre(parseInt(hawkerCentreId), parseInt(limit));

      const formattedPhotos = photos.map(photo => ({
        id: photo.id,
        imageUrl: photo.image_url || photo.file_path, // Use actual Cloudinary URL from database
        dishName: photo.dish_name,
        stallName: photo.stalls?.stall_name || 'Unknown Stall',
        likes: photo.likes_count || 0,
        username: photo.users?.name || 'Anonymous', // Nested object from users table
        description: photo.description,
        createdAt: photo.created_at
      }));

      res.status(200).json({
        success: true,
        data: formattedPhotos,
        total: formattedPhotos.length
      });

    } catch (error) {
      console.error('Error fetching photos by hawker centre:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch photos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Like a photo
  static async likePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const userId = req.user?.user_id || req.user?.userId || req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      const result = await UploadModel.likePhoto(parseInt(userId), parseInt(photoId));

      // Award points to the photo owner (not the liker)
      let pointsAwarded = null;
      if (result.photoOwnerId && result.photoOwnerId !== 1) { // Skip guest user
        try {
          const itemDetails = {
            stallName: result.stallName,
            dishName: result.dishName,
            photoId: parseInt(photoId),
            item: `${result.dishName} - ${result.stallName}`
          };
          const pointsResult = await PointsModel.addUpvotePoints(result.photoOwnerId, itemDetails);
          if (pointsResult.success) {
            pointsAwarded = {
              pointsEarned: pointsResult.pointsEarned,
              newBalance: pointsResult.newBalance
            };
          }
        } catch (pointsError) {
          console.error('Error awarding upvote points:', pointsError);
          // Don't fail the like if points award fails
        }
      }

      res.status(200).json({
        success: true,
        message: 'Photo liked successfully',
        data: {
          photoId: parseInt(photoId),
          likesCount: result.likesCount
        },
        points: pointsAwarded
      });

    } catch (error) {
      console.error('Error liking photo:', error);
      
      if (error.message.includes('already liked')) {
        return res.status(409).json({
          success: false,
          message: 'You have already liked this photo'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to like photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Unlike a photo
  static async unlikePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const userId = req.user?.user_id || req.user?.userId || req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      const newLikesCount = await UploadModel.unlikePhoto(parseInt(userId), parseInt(photoId));

      res.status(200).json({
        success: true,
        message: 'Photo unliked successfully',
        data: {
          photoId: parseInt(photoId),
          likesCount: newLikesCount
        }
      });

    } catch (error) {
      console.error('Error unliking photo:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Like not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to unlike photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get list of photo IDs liked by current user
  static async getLikedPhotos(req, res) {
    try {
      const userId = req.user?.user_id || req.user?.userId || req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const likedIds = await UploadModel.getLikedPhotoIds(parseInt(userId));
      res.status(200).json({ success: true, data: likedIds });
    } catch (error) {
      console.error('Error fetching liked photos:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch liked photos' });
    }
  }

  // Get single photo details
  static async getPhotoDetails(req, res) {
    try {
      const { photoId } = req.params;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      const photo = await UploadModel.getPhotoById(parseInt(photoId));

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      // Format photo data based on actual database structure
      const formattedPhoto = {
        id: photo.id,
        imageUrl: photo.image_url || photo.file_path,
        dishName: photo.dish_name,
        description: photo.description,
        likes: photo.likes_count || 0,
        likes_count: photo.likes_count || 0,
        isFeatured: photo.is_featured,
        hawkerCentre: photo.hawker_centres?.name || null,
        hawkerCentreName: photo.hawker_centres?.name || null,
        stallName: photo.stalls?.stall_name || photo.stalls?.name || null,
        foodItem: photo.food_items?.name || null,
        username: photo.users?.name || 'Anonymous',
        uploader: {
          name: photo.users?.name || 'Anonymous',
          email: photo.users?.email || null
        },
        createdAt: photo.created_at,
        updatedAt: photo.updated_at
      };

      res.status(200).json({
        success: true,
        data: formattedPhoto
      });

    } catch (error) {
      console.error('Error fetching photo details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch photo details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get community photos by stall (for stall owner dashboard)
  static async getPhotosByStall(req, res) {
    try {
      const { stallId } = req.params;
      const { limit = 50 } = req.query;

      if (!stallId) {
        return res.status(400).json({
          success: false,
          message: 'Stall ID is required'
        });
      }

      const photos = await UploadModel.getPhotosByStall(parseInt(stallId), parseInt(limit));

      const formattedPhotos = photos.map(photo => {
        // Map is_approved to approvalStatus for frontend compatibility
        let approvalStatus = 'pending';
        if (photo.is_approved === true) approvalStatus = 'approved';
        else if (photo.is_approved === false) approvalStatus = 'rejected';
        
        return {
          id: photo.id,
          imageUrl: photo.image_url || photo.file_path,
          dishName: photo.dish_name,
          description: photo.description,
          likes: photo.likes_count,
          isApproved: photo.is_approved,
          approvalStatus: approvalStatus,
          username: photo.users?.name || 'Anonymous',
          hawkerCentreName: photo.hawker_centres?.name,
          createdAt: photo.created_at
        };
      });

      res.status(200).json({
        success: true,
        data: formattedPhotos,
        total: formattedPhotos.length
      });

    } catch (error) {
      console.error('Error fetching photos by stall:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch photos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Update photo approval status
  static async updateApprovalStatus(req, res) {
    try {
      const { photoId } = req.params;
      const { status } = req.body;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be approved, rejected, or pending'
        });
      }

      const updatedPhoto = await UploadModel.updateApprovalStatus(parseInt(photoId), status);

      res.status(200).json({
        success: true,
        message: `Photo ${status} successfully`,
        data: updatedPhoto
      });

    } catch (error) {
      console.error('Error updating photo approval status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update photo approval status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete a photo
  static async deletePhoto(req, res) {
    try {
      const { photoId } = req.params;
      const userId = req.user?.id || 1; // TODO: Get from auth middleware

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      // Get photo details first
      const photo = await UploadModel.getPhotoById(parseInt(photoId));

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      // Check if user owns the photo
      if (photo.user_id !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own photos'
        });
      }

      // Delete from Cloudinary if public_id exists
      if (photo.public_id) {
        try {
          await CloudinaryUpload.deleteFile(photo.public_id);
          console.log('Deleted from Cloudinary:', photo.public_id);
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
          // Don't fail the request if Cloudinary deletion fails
        }
      }

      // Delete from database
      const deleted = await UploadModel.deletePhoto(parseInt(photoId), parseInt(userId));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found or already deleted'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Photo deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UploadController;