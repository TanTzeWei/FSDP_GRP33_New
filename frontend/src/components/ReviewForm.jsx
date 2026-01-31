import React, { useState } from 'react';
import axios from 'axios';
import RatingStars from './RatingStars';
import './ReviewForm.css';

function ReviewForm({ entityType = 'stall', entityId, onReviewSubmitted, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!rating) {
        setError('Please select a rating');
        setLoading(false);
        return;
      }

      const reviewData = {
        rating,
        comment: comment.trim() || null,
        images: images.length > 0 ? images : null
      };

      // Map entity type to API field
      if (entityType === 'hawker') {
        reviewData.hawker_centre_id = entityId;
      } else if (entityType === 'stall') {
        reviewData.stall_id = entityId;
      } else if (entityType === 'food') {
        reviewData.food_item_id = entityId;
      }

      const response = await axios.post('/api/reviews', reviewData);

      if (response.data.success) {
        setSuccess('Review submitted successfully!');
        setRating(0);
        setComment('');
        setImages([]);
        
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.data);
        }

        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // Store image URLs or paths
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...imageUrls].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="review-form-container">
      <form onSubmit={handleSubmit} className="review-form">
        <h3>Share Your Review</h3>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="form-group">
          <label>Rating</label>
          <RatingStars
            rating={rating}
            onRatingChange={setRating}
            size="large"
            interactive={true}
          />
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comment (optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            maxLength={500}
            rows={4}
          />
          <small>{comment.length}/500</small>
        </div>

        <div className="form-group">
          <label htmlFor="images">Add Photos (optional, max 5)</label>
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            disabled={images.length >= 5}
          />
          {images.length > 0 && (
            <div className="image-preview">
              {images.map((img, idx) => (
                <div key={idx} className="image-item">
                  <img src={img} alt={`Preview ${idx}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading || !rating}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ReviewForm;
