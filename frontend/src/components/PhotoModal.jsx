import React, { useEffect, useState } from 'react';
import './PhotoModal.css';

const PhotoModal = ({ photo, isOpen, onClose, onLike, isLiked, token }) => {
  const [photoDetails, setPhotoDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && photo) {
      fetchPhotoDetails();
    }
  }, [isOpen, photo]);

  const fetchPhotoDetails = async () => {
    if (!photo || !photo.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/photos/${photo.id}`);
      const data = await response.json();
      
      if (data.success) {
        setPhotoDetails(data.data);
      } else {
        // Fallback to the photo data we already have
        setPhotoDetails(photo);
      }
    } catch (error) {
      console.error('Error fetching photo details:', error);
      // Fallback to the photo data we already have
      setPhotoDetails(photo);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !photo) return null;

  const displayPhoto = photoDetails || photo;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (token && onLike) {
      onLike(photo.id);
    }
  };

  return (
    <div className="photo-modal-overlay" onClick={handleBackdropClick}>
      <div className="photo-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="photo-modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>
        
        {loading ? (
          <div className="photo-modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading photo story...</p>
          </div>
        ) : (
          <>
            <div className="photo-modal-image-container">
              <img 
                src={displayPhoto.imageUrl || displayPhoto.image_url} 
                alt={displayPhoto.dishName || displayPhoto.dish_name || 'Food photo'} 
                className="photo-modal-image"
              />
            </div>
            
            <div className="photo-modal-content">
              <div className="photo-modal-header">
                <div>
                  <h2 className="photo-modal-dish-name">
                    {displayPhoto.dishName || displayPhoto.dish_name || 'Delicious Dish'}
                  </h2>
                  <p className="photo-modal-stall-name">
                    {displayPhoto.stallName || displayPhoto.stall_name || 'Unknown Stall'}
                  </p>
                </div>
                <div className="photo-modal-likes">
                  <button
                    className={`photo-modal-like-btn ${isLiked ? 'liked' : ''} ${!token ? 'disabled' : ''}`}
                    onClick={handleLikeClick}
                    disabled={!token}
                    title={!token ? 'Login to like photos' : (isLiked ? 'Unlike' : 'Like')}
                  >
                    <span className="like-icon">{isLiked ? '❤️' : '🤍'}</span>
                    <span className="like-count">{displayPhoto.likes || displayPhoto.likes_count || 0}</span>
                  </button>
                </div>
              </div>

              {(displayPhoto.description || displayPhoto.story) && (
                <div className="photo-modal-story">
                  <h3 className="story-title">📖 The Story</h3>
                  <p className="story-content">
                    {displayPhoto.description || displayPhoto.story}
                  </p>
                </div>
              )}

              {!displayPhoto.description && !displayPhoto.story && (
                <div className="photo-modal-story">
                  <p className="story-placeholder">
                    No story shared yet. Be the first to add one!
                  </p>
                </div>
              )}

              <div className="photo-modal-meta">
                <div className="meta-item">
                  <span className="meta-label">👤 Shared by</span>
                  <span className="meta-value">
                    @{displayPhoto.username || displayPhoto.uploader?.name || 'Anonymous'}
                  </span>
                </div>
                {displayPhoto.hawkerCentre || displayPhoto.hawkerCentreName && (
                  <div className="meta-item">
                    <span className="meta-label">📍 Location</span>
                    <span className="meta-value">
                      {displayPhoto.hawkerCentre || displayPhoto.hawkerCentreName}
                    </span>
                  </div>
                )}
                {displayPhoto.createdAt && (
                  <div className="meta-item">
                    <span className="meta-label">📅 Posted</span>
                    <span className="meta-value">
                      {new Date(displayPhoto.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoModal;


