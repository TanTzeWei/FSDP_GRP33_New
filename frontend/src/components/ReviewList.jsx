import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RatingStars from './RatingStars';
import './ReviewList.css';

function ReviewList({ entityType = 'stall', entityId, limit = 10, onReviewUpdated }) {
  const { user } = useContext(AuthContext);
  // Support user_id (DB), userId (JWT/model), or id so Edit/Delete show for the author
  const currentUserId = user?.user_id ?? user?.userId ?? user?.id ?? null;
  const isOwnReview = (review) => {
    if (currentUserId == null) return false;
    const reviewAuthorId = review.user_id ?? review.userId ?? null;
    return reviewAuthorId != null && String(reviewAuthorId) === String(currentUserId);
  };

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editImages, setEditImages] = useState([]); // array of string (URL) or File
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [entityType, entityId]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');

    try {
      let endpoint = '/api/reviews';

      // Determine the endpoint based on entity type
      if (entityType === 'hawker') {
        endpoint = `/api/reviews/hawker/${entityId}`;
      } else if (entityType === 'stall') {
        endpoint = `/api/reviews/stall/${entityId}`;
      } else if (entityType === 'food') {
        endpoint = `/api/reviews/food/${entityId}`;
      }

      const response = await axios.get(endpoint, {
        params: { limit, offset }
      });

      if (response.data.success) {
        if (offset === 0) {
          setReviews(response.data.data || []);
        } else {
          setReviews([...reviews, ...(response.data.data || [])]);
        }

        // Check if there are more reviews
        const totalLoaded = offset + (response.data.data?.length || 0);
        setHasMore(totalLoaded < response.data.count);
      }
    } catch (err) {
      setError('Failed to load reviews');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let endpoint = '/api/reviews/stats';

      if (entityType === 'hawker') {
        endpoint = `/api/reviews/stats/hawker/${entityId}`;
      } else if (entityType === 'stall') {
        endpoint = `/api/reviews/stats/stall/${entityId}`;
      } else if (entityType === 'food') {
        endpoint = `/api/reviews/stats/food/${entityId}`;
      }

      const response = await axios.get(endpoint);

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load rating stats:', err);
    }
  };

  const loadMore = () => {
    setOffset(offset + limit);
    fetchReviews();
  };

  const refreshList = async () => {
    setOffset(0);
    setError('');
    try {
      let endpoint = '/api/reviews';
      if (entityType === 'hawker') endpoint = `/api/reviews/hawker/${entityId}`;
      else if (entityType === 'stall') endpoint = `/api/reviews/stall/${entityId}`;
      else if (entityType === 'food') endpoint = `/api/reviews/food/${entityId}`;
      const [listRes, statsRes] = await Promise.all([
        axios.get(endpoint, { params: { limit, offset: 0 } }),
        axios.get(entityType === 'hawker' ? `/api/reviews/stats/hawker/${entityId}` : entityType === 'stall' ? `/api/reviews/stats/stall/${entityId}` : `/api/reviews/stats/food/${entityId}`)
      ]);
      if (listRes.data.success) {
        setReviews(listRes.data.data || []);
        setHasMore((listRes.data.data?.length || 0) < (listRes.data.count || 0));
      }
      if (statsRes.data.success) setStats(statsRes.data.data || { averageRating: 0, totalReviews: 0 });
      onReviewUpdated?.();
    } catch (err) {
      setError('Failed to refresh reviews');
    }
  };

  const handleEditClick = (review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
    setEditImages(Array.isArray(review.images) ? [...review.images] : []);
  };

  const handleEditCancel = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment('');
    setEditImages([]);
  };

  const handleEditImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const total = editImages.length + files.length;
    const toAdd = files.slice(0, Math.max(0, 5 - editImages.length));
    setEditImages((prev) => [...prev, ...toAdd].slice(0, 5));
    e.target.value = '';
  };

  const handleEditImageRemove = (index) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditSave = async () => {
    if (!editingReviewId) return;
    setEditLoading(true);
    setError('');
    try {
      const existingUrls = editImages.filter((item) => typeof item === 'string');
      const newFiles = editImages.filter((item) => item instanceof File);
      let uploadedUrls = [];
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post('/api/reviews/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.success && res.data?.url) uploadedUrls.push(res.data.url);
      }
      const allImages = [...existingUrls, ...uploadedUrls];
      await axios.put(`/api/reviews/${editingReviewId}`, {
        rating: editRating,
        comment: editComment.trim() || null,
        images: allImages.length > 0 ? allImages : [] // [] clears images when user removes all
      });
      setEditingReviewId(null);
      setEditRating(0);
      setEditComment('');
      setEditImages([]);
      await refreshList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update review');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = async (review) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeleteLoadingId(review.id);
    try {
      await axios.delete(`/api/reviews/${review.id}`);
      await refreshList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && reviews.length === 0) {
    return <div className="review-list-loading">Loading reviews...</div>;
  }

  return (
    <div className="review-list-container">
      <div className="review-stats">
        <div className="stat-item">
          <span className="stat-label">Average Rating</span>
          <div className="stat-value">
            <RatingStars rating={stats.averageRating} size="medium" />
            <span className="rating-number">{stats.averageRating.toFixed(1)}</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Reviews</span>
          <span className="stat-value">{stats.totalReviews}</span>
        </div>
      </div>

      {error && <div className="review-error">{error}</div>}

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <>
          <div className="reviews">
            {reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">
                      {review.users?.name || 'Anonymous'}
                    </span>
                    <span className="review-date">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className="review-header-right">
                    {editingReviewId !== review.id && (
                      <RatingStars rating={review.rating} size="small" />
                    )}
                    {currentUserId && isOwnReview(review) && editingReviewId !== review.id && (
                      <div className="review-actions">
                        <button
                          type="button"
                          className="review-action-btn edit-btn"
                          onClick={() => handleEditClick(review)}
                          aria-label="Edit review"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="review-action-btn delete-btn"
                          onClick={() => handleDeleteClick(review)}
                          disabled={deleteLoadingId === review.id}
                          aria-label="Delete review"
                        >
                          {deleteLoadingId === review.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingReviewId === review.id ? (
                  <div className="review-edit-form">
                    <div className="form-group">
                      <label>Rating</label>
                      <RatingStars
                        rating={editRating}
                        onRatingChange={setEditRating}
                        size="medium"
                        interactive={true}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`edit-comment-${review.id}`}>Comment</label>
                      <textarea
                        id={`edit-comment-${review.id}`}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Share your experience..."
                        maxLength={500}
                        rows={3}
                      />
                      <small>{editComment.length}/500</small>
                    </div>
                    <div className="form-group">
                      <label>Photos (optional, max 5)</label>
                      {editImages.length > 0 && (
                        <div className="review-edit-images">
                          {editImages.map((item, idx) => (
                            <div key={idx} className="review-edit-image-item">
                              <img
                                src={typeof item === 'string' ? item : URL.createObjectURL(item)}
                                alt={`Preview ${idx}`}
                              />
                              <button
                                type="button"
                                className="review-edit-image-remove"
                                onClick={() => handleEditImageRemove(idx)}
                                aria-label="Remove photo"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {editImages.length < 5 && (
                        <label className="review-edit-image-add">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleEditImageAdd}
                            style={{ display: 'none' }}
                          />
                          <span className="review-edit-image-add-btn">+ Add photos</span>
                        </label>
                      )}
                      <small>{editImages.length}/5 photos</small>
                    </div>
                    <div className="review-edit-actions">
                      <button
                        type="button"
                        className="review-action-btn save-btn"
                        onClick={handleEditSave}
                        disabled={editLoading || !editRating}
                      >
                        {editLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="review-action-btn cancel-btn"
                        onClick={handleEditCancel}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {review.comment && (
                      <p className="review-comment">{review.comment}</p>
                    )}

                    {review.images && review.images.length > 0 && (
                      <div className="review-images">
                        {review.images.map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt={`Review photo ${idx}`}
                            className="review-image"
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="load-more-btn"
            >
              {loading ? 'Loading...' : 'Load More Reviews'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewList;
