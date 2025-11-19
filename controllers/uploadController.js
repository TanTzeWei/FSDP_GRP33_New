// controllers/uploadController.js
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const UploadModel = require('../models/uploadModel');
const CloudinaryUpload = require('../utils/cloudinaryUpload');

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
      const userId = req.user?.id || 1; // TODO: Get from auth middleware

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

      console.log('Uploading to Cloudinary...');

      // Upload to Cloudinary
      const cloudinaryResult = await CloudinaryUpload.uploadPhoto(
        req.file.buffer,
        `${uuidv4()}-${req.file.originalname}`
      );

      console.log('Cloudinary upload successful:', cloudinaryResult.url);

      // Prepare photo data for database
      const photoData = {
        userId: 1, // Fixed user ID to avoid foreign key issues temporarily
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
      console.log('=== UPLOAD SUCCESS ===');

      res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully!',
        data: {
          id: savedPhoto.id,
          imageUrl: photoData.imageUrl,
          dishName: photoData.dishName,
          createdAt: savedPhoto.created_at
        }
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
        stallName: photo.stall_name || photo.hawker_centre_name,
        likes: photo.likes_count,
        username: photo.name, // Single name field from users table
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
        stallName: photo.stall_name,
        likes: photo.likes_count,
        username: photo.name, // Single name field from users table
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
      const userId = req.user?.id || 1; // TODO: Get from auth middleware

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      const newLikesCount = await UploadModel.likePhoto(parseInt(userId), parseInt(photoId));

      res.status(200).json({
        success: true,
        message: 'Photo liked successfully',
        data: {
          photoId: parseInt(photoId),
          likesCount: newLikesCount
        }
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
      const userId = req.user?.id || 1; // TODO: Get from auth middleware

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

      const formattedPhoto = {
        id: photo.id,
        imageUrl: photo.file_path,
        dishName: photo.dish_name,
        description: photo.description,
        likes: photo.likes_count,
        isFeatured: photo.is_featured,
        hawkerCentre: photo.hawker_centre_name,
        stallName: photo.stall_name,
        foodItem: photo.food_item_name,
        uploader: {
          name: `${photo.first_name} ${photo.last_name}`,
          email: photo.email
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