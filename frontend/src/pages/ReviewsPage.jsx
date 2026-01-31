import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import './ReviewsPage.css';

function ReviewsPage({ entityType = 'stall', entityId, entityName = '' }) {
  const { user } = useContext(AuthContext);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleReviewSubmitted = () => {
    // Refresh the review list
    setRefreshKey(refreshKey + 1);
    setShowForm(false);
  };

  return (
    <div className="reviews-page">
      <div className="reviews-header">
        <div>
          <h1>Reviews & Ratings</h1>
          {entityName && <p className="entity-name">{entityName}</p>}
        </div>

        {user ? (
          <button
            className={`review-btn ${showForm ? 'active' : ''}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Close' : '✎ Write a Review'}
          </button>
        ) : (
          <div className="login-prompt">
            Please log in to write a review
          </div>
        )}
      </div>

      {showForm && user && (
        <ReviewForm
          entityType={entityType}
          entityId={entityId}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ReviewList
        key={refreshKey}
        entityType={entityType}
        entityId={entityId}
        limit={10}
      />
    </div>
  );
}

export default ReviewsPage;
