import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RatingStars from './RatingStars';
import './ReviewList.css';

function ReviewList({ entityType = 'stall', entityId, limit = 10 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

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
                  <RatingStars rating={review.rating} size="small" />
                </div>

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
