// utils/imageAIValidation.js
// AI-powered image validation for food photo uploads

const cloudinary = require('cloudinary').v2;

/**
 * Image AI Validation Service
 * Validates uploaded images to ensure they are appropriate food photos
 */
class ImageAIValidation {
  
  /**
   * Validate image using Cloudinary's AI capabilities
   * Uses Cloudinary's built-in auto-tagging (free tier compatible)
   * @param {Buffer} imageBuffer - The image buffer to validate
   * @param {String} filename - Original filename
   * @returns {Promise<Object>} Validation result
   */
  static async validateWithCloudinary(imageBuffer, filename) {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'validation-temp',
            resource_type: 'image',
            categorization: 'google_tagging', // Uses Google Vision via Cloudinary
            auto_tagging: 0.5, // Lower threshold to catch more food items
          },
          async (error, result) => {
            if (error) {
              // If categorization add-on not enabled, try basic upload for manual check
              if (error.message?.includes('categorization') || error.message?.includes('add-on')) {
                console.log('Cloudinary AI add-on not enabled, using basic validation');
                resolve({
                  isValid: true,
                  skipped: true,
                  message: 'AI validation skipped - Cloudinary AI add-on not enabled. Enable Google Auto Tagging add-on in Cloudinary dashboard for AI validation.'
                });
                return;
              }
              reject(error);
              return;
            }

            try {
              // Analyze the AI results
              const validationResult = ImageAIValidation.analyzeCloudinaryResult(result);
              
              // Delete the temp validation image
              try {
                await cloudinary.uploader.destroy(result.public_id);
              } catch (deleteError) {
                console.warn('Failed to delete temp validation image:', deleteError.message);
              }
              
              resolve(validationResult);
            } catch (analyzeError) {
              reject(analyzeError);
            }
          }
        );

        uploadStream.end(imageBuffer);
      });
    } catch (error) {
      console.error('Cloudinary AI validation error:', error);
      // Return permissive result on error
      return {
        isValid: true,
        skipped: true,
        error: error.message,
        message: 'AI validation encountered an error, upload allowed'
      };
    }
  }

  /**
   * Analyze Cloudinary AI results to determine if image is valid food photo
   * @param {Object} result - Cloudinary upload result with AI data
   * @returns {Object} Validation analysis
   */
  static analyzeCloudinaryResult(result) {
    const tags = result.tags || [];
    const moderationResult = result.moderation || [];
    const info = result.info || {};
    
    // Food-related keywords to look for (expanded list for hawker food)
    const foodKeywords = [
      // General food terms
      'food', 'dish', 'meal', 'cuisine', 'restaurant', 'eating', 'cooking', 'cooked',
      'delicious', 'tasty', 'yummy', 'appetizing', 'fresh', 'homemade',
      // Cooking methods
      'fried', 'grilled', 'steamed', 'boiled', 'roasted', 'baked', 'stir-fried',
      // Main dishes
      'rice', 'noodle', 'noodles', 'soup', 'curry', 'stew', 'salad', 'sandwich',
      // Proteins
      'meat', 'chicken', 'pork', 'beef', 'fish', 'seafood', 'prawn', 'prawns', 
      'crab', 'egg', 'eggs', 'tofu', 'duck', 'lamb', 'mutton',
      // Vegetables & sides
      'vegetable', 'vegetables', 'fruit', 'fruits', 'greens',
      // Meal times
      'breakfast', 'lunch', 'dinner', 'brunch', 'snack',
      // Desserts & drinks
      'dessert', 'cake', 'pastry', 'drink', 'beverage', 'coffee', 'tea', 'juice',
      // Tableware (indicates food setting)
      'plate', 'bowl', 'chopstick', 'chopsticks', 'spoon', 'fork', 'cup',
      // Hawker-specific
      'hawker', 'stall', 'street food', 'asian food', 'chinese food', 'malay food',
      'laksa', 'satay', 'roti', 'mee', 'bak kut teh', 'char kway teow'
    ];

    // Check if any tags match food keywords
    const foodTags = tags.filter(tag => 
      foodKeywords.some(keyword => 
        tag.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(tag.toLowerCase())
      )
    );

    const isFoodRelated = foodTags.length > 0;

    // Check moderation results (if available)
    const hasInappropriateContent = moderationResult.some(mod => 
      mod.status === 'rejected' || 
      (mod.response && mod.response.moderation_labels && 
       mod.response.moderation_labels.length > 0)
    );

    // Get image caption if available
    const caption = info.captioning?.data?.caption || '';
    const captionContainsFood = foodKeywords.some(keyword => 
      caption.toLowerCase().includes(keyword.toLowerCase())
    );

    // Calculate confidence based on number of food tags found
    const confidence = tags.length > 0 
      ? Math.min((foodTags.length / tags.length) * 100 + (foodTags.length * 10), 100)
      : 0;

    const isValid = (isFoodRelated || captionContainsFood) && !hasInappropriateContent;

    return {
      isValid,
      isFoodRelated: isFoodRelated || captionContainsFood,
      hasInappropriateContent,
      foodTags,
      allTags: tags,
      caption,
      captionContainsFood,
      confidence: Math.round(confidence),
      foodType: foodTags.length > 0 ? foodTags[0] : null,
      message: !isValid 
        ? hasInappropriateContent 
          ? 'Image contains inappropriate content'
          : 'Image does not appear to be a food photo. Please upload a picture of food.'
        : 'Image validated successfully as food photo'
    };
  }

  /**
   * Validate image using OpenAI Vision API (GPT-4 Vision)
   * More intelligent validation with natural language understanding
   * @param {Buffer} imageBuffer - The image buffer to validate
   * @returns {Promise<Object>} Validation result
   */
  static async validateWithOpenAI(imageBuffer) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenAI API key not configured, skipping AI validation');
      return {
        isValid: true,
        skipped: true,
        message: 'AI validation skipped - API key not configured'
      };
    }

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const mimeType = 'image/jpeg'; // Assume JPEG, could detect from buffer

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use gpt-4o-mini for cost efficiency, or gpt-4o for better accuracy
          messages: [
            {
              role: 'system',
              content: `You are a food photo validator for a hawker center food review app. 
Your job is to analyze images and determine if they are appropriate food photos.

Respond with a JSON object containing:
{
  "isFood": boolean - true if the image shows food/drinks/meals
  "isAppropriate": boolean - true if the image is appropriate (no inappropriate content)
  "foodType": string - description of the food if detected (e.g., "Chicken Rice", "Laksa")
  "confidence": number - 0-100 confidence score
  "reason": string - brief explanation of your decision
}

Only respond with the JSON object, no other text.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Is this a valid food photo for a hawker center food review app? Analyze the image.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                    detail: 'low' // Use 'low' for faster/cheaper processing
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      // Parse the JSON response
      let aiResult;
      try {
        aiResult = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        // If parsing fails, try to extract info from text
        aiResult = {
          isFood: content.toLowerCase().includes('food') || content.toLowerCase().includes('yes'),
          isAppropriate: !content.toLowerCase().includes('inappropriate'),
          confidence: 50,
          reason: content
        };
      }

      return {
        isValid: aiResult.isFood && aiResult.isAppropriate,
        isFoodRelated: aiResult.isFood,
        hasInappropriateContent: !aiResult.isAppropriate,
        foodType: aiResult.foodType || null,
        confidence: aiResult.confidence || 0,
        message: aiResult.reason || (aiResult.isFood 
          ? 'Image validated successfully' 
          : 'Image does not appear to be a food photo'),
        rawResponse: aiResult
      };

    } catch (error) {
      console.error('OpenAI Vision validation error:', error);
      // Return a safe default - allow upload but log the error
      return {
        isValid: true,
        skipped: true,
        error: error.message,
        message: 'AI validation encountered an error, upload allowed'
      };
    }
  }

  /**
   * Validate image using Google Cloud Vision API
   * @param {Buffer} imageBuffer - The image buffer to validate
   * @returns {Promise<Object>} Validation result
   */
  static async validateWithGoogleVision(imageBuffer) {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Cloud Vision API key not configured');
      return {
        isValid: true,
        skipped: true,
        message: 'AI validation skipped - API key not configured'
      };
    }

    try {
      const base64Image = imageBuffer.toString('base64');

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [
                  { type: 'LABEL_DETECTION', maxResults: 20 },
                  { type: 'SAFE_SEARCH_DETECTION' }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.responses[0];

      // Analyze labels for food-related content
      const labels = result.labelAnnotations || [];
      const foodKeywords = [
        'food', 'dish', 'cuisine', 'meal', 'restaurant', 'cooking',
        'rice', 'noodle', 'soup', 'meat', 'vegetable', 'seafood',
        'chicken', 'pork', 'beef', 'fish', 'breakfast', 'lunch', 'dinner'
      ];

      const foodLabels = labels.filter(label =>
        foodKeywords.some(keyword =>
          label.description.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      // Check safe search results
      const safeSearch = result.safeSearchAnnotation || {};
      const inappropriateFlags = ['adult', 'violence', 'racy'];
      const hasInappropriateContent = inappropriateFlags.some(flag =>
        safeSearch[flag] === 'LIKELY' || safeSearch[flag] === 'VERY_LIKELY'
      );

      const isFoodRelated = foodLabels.length > 0;
      const confidence = foodLabels.length > 0 
        ? Math.max(...foodLabels.map(l => l.score * 100))
        : 0;

      return {
        isValid: isFoodRelated && !hasInappropriateContent,
        isFoodRelated,
        hasInappropriateContent,
        foodLabels: foodLabels.map(l => ({ label: l.description, score: l.score })),
        allLabels: labels.map(l => l.description),
        confidence,
        safeSearch,
        message: !isFoodRelated 
          ? 'Image does not appear to be a food photo'
          : hasInappropriateContent
            ? 'Image contains inappropriate content'
            : 'Image validated successfully'
      };

    } catch (error) {
      console.error('Google Vision validation error:', error);
      return {
        isValid: true,
        skipped: true,
        error: error.message,
        message: 'AI validation encountered an error, upload allowed'
      };
    }
  }

  /**
   * Main validation method - uses available AI service
   * @param {Buffer} imageBuffer - The image buffer to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation result
   */
  static async validate(imageBuffer, options = {}) {
    const { 
      provider = process.env.AI_VALIDATION_PROVIDER || 'openai',
      strictMode = false 
    } = options;

    console.log(`Starting AI validation with provider: ${provider}`);

    let result;

    switch (provider.toLowerCase()) {
      case 'openai':
        result = await this.validateWithOpenAI(imageBuffer);
        break;
      case 'google':
        result = await this.validateWithGoogleVision(imageBuffer);
        break;
      case 'cloudinary':
        result = await this.validateWithCloudinary(imageBuffer);
        break;
      default:
        console.warn(`Unknown AI provider: ${provider}, skipping validation`);
        return {
          isValid: true,
          skipped: true,
          message: 'AI validation skipped - unknown provider'
        };
    }

    // In strict mode, validation failures prevent upload
    // In non-strict mode, just log warnings
    if (!result.isValid && !strictMode) {
      console.warn('AI validation warning:', result.message);
      console.warn('Non-strict mode: allowing upload anyway');
      result.allowedDespiteWarning = true;
      result.originalIsValid = result.isValid;
      result.isValid = true;
    }

    console.log('AI validation result:', {
      isValid: result.isValid,
      message: result.message,
      confidence: result.confidence
    });

    return result;
  }

  /**
   * Check if AI validation is configured
   * @returns {Boolean}
   */
  static isConfigured() {
    return !!(
      process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_CLOUD_VISION_API_KEY ||
      (process.env.CLOUDINARY_CLOUD_NAME && 
       process.env.CLOUDINARY_API_KEY && 
       process.env.CLOUDINARY_API_SECRET)
    );
  }
}

module.exports = ImageAIValidation;
