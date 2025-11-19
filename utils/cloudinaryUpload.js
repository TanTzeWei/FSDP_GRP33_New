// utils/cloudinaryUpload.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryUpload {
  /**
   * Upload a file buffer to Cloudinary
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {String} fileName - Original filename
   * @param {String} folder - Cloudinary folder path
   * @param {Object} options - Additional Cloudinary options
   * @returns {Promise<Object>} Cloudinary response with URL
   */
  static async uploadFile(fileBuffer, fileName, folder = 'hawker-hub', options = {}) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
            public_id: fileName.split('.')[0],
            overwrite: true,
            ...options
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Write buffer to stream
        uploadStream.end(fileBuffer);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Upload photo with optimization
   * @param {Buffer} fileBuffer - File buffer
   * @param {String} fileName - Original filename
   * @returns {Promise<Object>} Optimized image URL and metadata
   */
  static async uploadPhoto(fileBuffer, fileName) {
    try {
      const result = await this.uploadFile(fileBuffer, fileName, 'hawker-hub/photos', {
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        mimeType: result.resource_type === 'image' ? 'image/jpeg' : `image/${result.format}`
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  /**
   * Upload menu item photo with optimization
   * @param {Buffer} fileBuffer - File buffer
   * @param {String} fileName - Original filename
   * @returns {Promise<Object>} Optimized image URL and metadata
   */
  static async uploadMenuPhoto(fileBuffer, fileName) {
    try {
      const result = await this.uploadFile(fileBuffer, fileName, 'hawker-hub/menu', {
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { quality: 'auto', fetch_format: 'auto', aspect_ratio: '4:3', crop: 'fill' }
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        mimeType: result.resource_type === 'image' ? 'image/jpeg' : `image/${result.format}`
      };
    } catch (error) {
      console.error('Error uploading menu photo:', error);
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {String} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Generate optimized URL with transformations
   * @param {String} publicId - Cloudinary public ID
   * @param {Object} transformations - Transformation options
   * @returns {String} Optimized URL
   */
  static getOptimizedUrl(publicId, transformations = {}) {
    try {
      return cloudinary.url(publicId, {
        quality: 'auto',
        fetch_format: 'auto',
        ...transformations
      });
    } catch (error) {
      console.error('Error generating URL:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail URL
   * @param {String} publicId - Cloudinary public ID
   * @param {Number} width - Thumbnail width
   * @param {Number} height - Thumbnail height
   * @returns {String} Thumbnail URL
   */
  static getThumbnailUrl(publicId, width = 200, height = 200) {
    return this.getOptimizedUrl(publicId, {
      width: width,
      height: height,
      crop: 'fill',
      gravity: 'auto'
    });
  }

  /**
   * Check if Cloudinary is configured
   * @returns {Boolean}
   */
  static isConfigured() {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
}

module.exports = CloudinaryUpload;
