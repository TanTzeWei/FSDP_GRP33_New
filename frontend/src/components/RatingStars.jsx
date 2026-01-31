import React from 'react';
import './RatingStars.css';

function RatingStars({ rating = 0, onRatingChange = null, size = 'medium', interactive = false }) {
  const handleStarClick = (value) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleStarHover = (value) => {
    // Optional: add visual feedback on hover
  };

  return (
    <div className={`rating-stars ${size} ${interactive ? 'interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : 'empty'}`}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleStarHover(star)}
          role={interactive ? 'button' : 'img'}
          tabIndex={interactive ? 0 : -1}
          aria-label={`${star} stars`}
        >
          ★
        </span>
      ))}
      {rating > 0 && <span className="rating-value">({rating.toFixed(1)})</span>}
    </div>
  );
}

export default RatingStars;
