// controllers/menuPhotoController.js
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const MenuPhotoModel = require('../models/menuPhotoModel');
const CloudinaryUpload = require('../utils/cloudinaryUpload');
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
    files: 1
  }
});

class MenuPhotoController {
  static uploadMiddleware = upload.single('photo');

  // Upload a menu item photo to Cloudinary and create/update the dish
  static async uploadMenuPhoto(req, res) {
    try {
      const {
        dishName,
        description,
        price,
        category,
        spiceLevel,
        hawkerCentreId,
        stallId,
        dietaryInfo
      } = req.body;
      // Extract user ID from auth middleware (supports multiple formats)
      const userId = req.user?.userId || req.user?.user_id || req.user?.id || 1;
      
      console.log('Upload - User ID:', userId, 'User object:', req.user);

      // Validate required fields
      if (!dishName || !hawkerCentreId || !stallId || !price || !category) {
        return res.status(400).json({
          success: false,
          message: 'Dish name, hawker centre, stall, price, and category are required'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No photo file uploaded'
        });
      }

      // Check Cloudinary configuration
      if (!CloudinaryUpload.isConfigured()) {
        return res.status(500).json({
          success: false,
          message: 'Upload service not configured'
        });
      }

      // Upload to Cloudinary with optimization
      const cloudinaryResult = await CloudinaryUpload.uploadMenuPhoto(
        req.file.buffer,
        `${uuidv4()}-${req.file.originalname}`
      );

      // Parse dietary info
      let parsedDietaryInfo = [];
      try {
        parsedDietaryInfo = JSON.parse(dietaryInfo || '[]');
      } catch (e) {
        parsedDietaryInfo = [];
      }

      // Prepare photo data
      const photoData = {
        userId: userId,
        hawkerCentreId: parseInt(hawkerCentreId),
        stallId: parseInt(stallId),
        originalName: req.file.originalname,
        imageUrl: cloudinaryResult.url, // Cloudinary URL
        publicId: cloudinaryResult.publicId, // Cloudinary public ID for deletion
        fileSize: cloudinaryResult.size,
        mimeType: cloudinaryResult.mimeType,
        dishName: dishName.trim(),
        description: description ? description.trim() : null,
        price: parseFloat(price),
        category: category.trim(),
        spiceLevel: spiceLevel || 'mild',
        dietaryInfo: parsedDietaryInfo
      };

      // Save to database
      const savedDish = await MenuPhotoModel.saveDishWithPhoto(photoData);

      // Get stall name for points history
      let stallName = 'Unknown Stall';
      try {
        const StallModel = require('../models/stallModel');
        const stallData = await StallModel.getStallById(photoData.stallId);
        if (stallData && stallData.stall_name) {
          stallName = stallData.stall_name;
        }
      } catch (err) {
        console.log('Could not get stall name:', err.message);
      }

      // Award points for photo upload (only for authenticated users)
      let pointsAwarded = null;
      console.log('Checking points eligibility - userId:', userId, 'is not guest?', userId !== 1);
      if (userId && userId !== 1) { // Skip guest user (id = 1)
        try {
          console.log('Awarding points to user:', userId);
          const itemDetails = {
            stallName: stallName,
            dishName: photoData.dishName,
            photoId: savedDish.id,
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
        console.log('⚠️ Points NOT awarded - User is guest or not authenticated');
      }

      res.status(201).json({
        success: true,
        message: 'Menu item photo uploaded successfully!',
        data: {
          id: savedDish.id,
          imageUrl: photoData.imageUrl,
          dishName: photoData.dishName,
          price: photoData.price,
          category: photoData.category,
          createdAt: savedDish.created_at
        },
        points: pointsAwarded
      });

    } catch (error) {
      console.error('Menu photo upload error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload menu photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get menu photos for a stall
  static async getMenuPhotosByStall(req, res) {
    try {
      const { stallId } = req.params;

      if (!stallId) {
        return res.status(400).json({
          success: false,
          message: 'Stall ID is required'
        });
      }

      const photos = await MenuPhotoModel.getPhotosByStall(parseInt(stallId));

      const formattedPhotos = photos.map(photo => ({
        id: photo.id,
        imageUrl: photo.file_path,
        dishName: photo.name,
        description: photo.description,
        price: photo.price,
        category: photo.category,
        spiceLevel: photo.spice_level,
        dietaryInfo: photo.dietary_info ? JSON.parse(photo.dietary_info) : [],
        createdAt: photo.created_at
      }));

      res.status(200).json({
        success: true,
        data: formattedPhotos,
        total: formattedPhotos.length
      });

    } catch (error) {
      console.error('Error fetching menu photos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu photos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get menu photos by hawker centre
  static async getMenuPhotosByHawkerCentre(req, res) {
    try {
      const { hawkerCentreId } = req.params;
      const { limit = 50 } = req.query;

      if (!hawkerCentreId) {
        return res.status(400).json({
          success: false,
          message: 'Hawker centre ID is required'
        });
      }

      const photos = await MenuPhotoModel.getPhotosByHawkerCentre(parseInt(hawkerCentreId), parseInt(limit));

      const formattedPhotos = photos.map(photo => ({
        id: photo.id,
        imageUrl: photo.file_path,
        dishName: photo.name,
        stallName: photo.stall_name,
        price: photo.price,
        category: photo.category,
        spiceLevel: photo.spice_level,
        dietaryInfo: photo.dietary_info ? JSON.parse(photo.dietary_info) : [],
        createdAt: photo.created_at
      }));

      res.status(200).json({
        success: true,
        data: formattedPhotos,
        total: formattedPhotos.length
      });

    } catch (error) {
      console.error('Error fetching menu photos by hawker centre:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu photos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get single menu photo/dish
  static async getMenuPhoto(req, res) {
    try {
      const { photoId } = req.params;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      const photo = await MenuPhotoModel.getPhotoById(parseInt(photoId));

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Menu photo not found'
        });
      }

      const formattedPhoto = {
        id: photo.id,
        imageUrl: photo.file_path,
        dishName: photo.name,
        description: photo.description,
        price: photo.price,
        category: photo.category,
        spiceLevel: photo.spice_level,
        dietaryInfo: photo.dietary_info ? JSON.parse(photo.dietary_info) : [],
        stallName: photo.stall_name,
        hawkerCentreName: photo.hawker_centre_name,
        createdAt: photo.created_at,
        updatedAt: photo.updated_at
      };

      res.status(200).json({
        success: true,
        data: formattedPhoto
      });

    } catch (error) {
      console.error('Error fetching menu photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete menu photo (and optionally the dish)
  static async deleteMenuPhoto(req, res) {
    try {
      const { photoId } = req.params;
      const userId = req.user?.id || 1;

      if (!photoId) {
        return res.status(400).json({
          success: false,
          message: 'Photo ID is required'
        });
      }

      // Get photo details first
      const photo = await MenuPhotoModel.getPhotoById(parseInt(photoId));

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Menu photo not found'
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
      const deleted = await MenuPhotoModel.deletePhoto(parseInt(photoId));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Menu photo not found or already deleted'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Menu photo deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting menu photo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete menu photo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = MenuPhotoController;
