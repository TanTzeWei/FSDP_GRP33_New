import React from 'react';

/**
 * LoadingSkeleton Component
 * 
 * Displays skeleton placeholders while data is being fetched.
 * Provides better UX than simple loading spinners by showing
 * the expected layout structure.
 */

function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="menu-items-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="menu-item-card skeleton">
          <div className="skeleton-header">
            <div className="skeleton-checkbox"></div>
            <div className="skeleton-title">
              <div className="skeleton-line skeleton-line-title"></div>
              <div className="skeleton-line skeleton-line-price"></div>
            </div>
            <div className="skeleton-actions">
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn"></div>
            </div>
          </div>
          <div className="skeleton-photo">
            <div className="skeleton-photo-box"></div>
          </div>
          <div className="skeleton-uploads">
            <div className="skeleton-line skeleton-line-label"></div>
            <div className="skeleton-photos-grid">
              <div className="skeleton-thumb"></div>
              <div className="skeleton-thumb"></div>
              <div className="skeleton-thumb"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
