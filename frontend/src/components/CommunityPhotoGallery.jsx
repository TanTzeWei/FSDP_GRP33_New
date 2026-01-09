import React, { useState } from 'react';
import './CommunityPhotoGallery.css';

/**
 * CommunityPhotoGallery Component
 * 
 * Displays community-uploaded photos for a stall with moderation capabilities:
 * - View all community photos grouped by status
 * - Approve/Reject photos
 * - Set approved photos as official dish photos
 * - Filter by dish name or status
 */

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function CommunityPhotoGallery({
  photos = [],
  dishes = [],
  isLoading = false,
  onApprove,
  onReject,
  onSetAsOfficialPhoto,
  updatingPhotoIds = {},
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDish, setFilterDish] = useState('all');
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  // Get unique dish names from photos
  const uniqueDishes = [...new Set(photos.map(p => p.dishName).filter(Boolean))];

  // Filter photos based on status and dish
  const filteredPhotos = photos.filter(photo => {
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'pending' && (!photo.approvalStatus || photo.approvalStatus === 'pending')) ||
      (filterStatus === 'approved' && photo.approvalStatus === 'approved') ||
      (filterStatus === 'rejected' && photo.approvalStatus === 'rejected');
    
    const dishMatch = filterDish === 'all' || photo.dishName === filterDish;
    
    return statusMatch && dishMatch;
  });

  // Group photos by status
  const pendingPhotos = filteredPhotos.filter(p => !p.approvalStatus || p.approvalStatus === 'pending');
  const approvedPhotos = filteredPhotos.filter(p => p.approvalStatus === 'approved');
  const rejectedPhotos = filteredPhotos.filter(p => p.approvalStatus === 'rejected');

  // Find matching dish for a photo
  const findMatchingDish = (dishName) => {
    return dishes.find(d => 
      d.name?.toLowerCase() === dishName?.toLowerCase() ||
      d.name?.toLowerCase().includes(dishName?.toLowerCase()) ||
      dishName?.toLowerCase().includes(d.name?.toLowerCase())
    );
  };

  if (isLoading) {
    return (
      <div className="community-gallery-loading">
        <div className="loading-spinner"></div>
        <p>Loading community photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="community-gallery-empty">
        <ImageIcon className="empty-icon" />
        <h3>No Community Photos Yet</h3>
        <p>When customers upload photos of your dishes, they will appear here for you to review and approve.</p>
        <p className="hint">Approved photos can be set as official menu item photos.</p>
      </div>
    );
  }

  return (
    <div className="community-photo-gallery">
      {/* Filters */}
      <div className="gallery-filters">
        <div className="filter-group">
          <label>Status:</label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All ({photos.length})
            </button>
            <button 
              className={`filter-btn pending ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pending ({photos.filter(p => !p.approvalStatus || p.approvalStatus === 'pending').length})
            </button>
            <button 
              className={`filter-btn approved ${filterStatus === 'approved' ? 'active' : ''}`}
              onClick={() => setFilterStatus('approved')}
            >
              Approved ({photos.filter(p => p.approvalStatus === 'approved').length})
            </button>
            <button 
              className={`filter-btn rejected ${filterStatus === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilterStatus('rejected')}
            >
              Rejected ({photos.filter(p => p.approvalStatus === 'rejected').length})
            </button>
          </div>
        </div>

        {uniqueDishes.length > 0 && (
          <div className="filter-group">
            <label>Dish:</label>
            <select 
              value={filterDish} 
              onChange={(e) => setFilterDish(e.target.value)}
              className="dish-filter-select"
            >
              <option value="all">All Dishes</option>
              {uniqueDishes.map(dish => (
                <option key={dish} value={dish}>{dish}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="no-filtered-results">
          <p>No photos match your filters.</p>
        </div>
      ) : (
        <div className="gallery-sections">
          {/* Pending Section */}
          {pendingPhotos.length > 0 && (
            <div className="gallery-section pending-section">
              <div className="section-header">
                <span className="section-badge pending">⏳ Pending Review ({pendingPhotos.length})</span>
              </div>
              <div className="photos-grid">
                {pendingPhotos.map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    status="pending"
                    matchingDish={findMatchingDish(photo.dishName)}
                    isUpdating={updatingPhotoIds[photo.id]}
                    onApprove={onApprove}
                    onReject={onReject}
                    onSetAsOfficial={onSetAsOfficialPhoto}
                    onExpand={() => setExpandedPhoto(photo)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved Section */}
          {approvedPhotos.length > 0 && (
            <div className="gallery-section approved-section">
              <div className="section-header">
                <span className="section-badge approved">✅ Approved ({approvedPhotos.length})</span>
              </div>
              <div className="photos-grid">
                {approvedPhotos.map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    status="approved"
                    matchingDish={findMatchingDish(photo.dishName)}
                    isUpdating={updatingPhotoIds[photo.id]}
                    onApprove={onApprove}
                    onReject={onReject}
                    onSetAsOfficial={onSetAsOfficialPhoto}
                    onExpand={() => setExpandedPhoto(photo)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rejected Section */}
          {rejectedPhotos.length > 0 && (
            <div className="gallery-section rejected-section">
              <details>
                <summary className="section-header">
                  <span className="section-badge rejected">❌ Rejected ({rejectedPhotos.length})</span>
                </summary>
                <div className="photos-grid">
                  {rejectedPhotos.map(photo => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      status="rejected"
                      matchingDish={findMatchingDish(photo.dishName)}
                      isUpdating={updatingPhotoIds[photo.id]}
                      onApprove={onApprove}
                      onReject={onReject}
                      onSetAsOfficial={onSetAsOfficialPhoto}
                      onExpand={() => setExpandedPhoto(photo)}
                    />
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div className="photo-modal-overlay" onClick={() => setExpandedPhoto(null)}>
          <div className="photo-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setExpandedPhoto(null)}>
              <XIcon />
            </button>
            <img src={expandedPhoto.imageUrl} alt={expandedPhoto.dishName} />
            <div className="modal-info">
              <h3>{expandedPhoto.dishName}</h3>
              <p className="uploader"><UserIcon /> {expandedPhoto.username}</p>
              {expandedPhoto.description && (
                <p className="description">{expandedPhoto.description}</p>
              )}
              <p className="likes"><HeartIcon /> {expandedPhoto.likes || 0} likes</p>
              <p className="date">Uploaded: {new Date(expandedPhoto.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="modal-actions">
              {expandedPhoto.approvalStatus !== 'approved' && (
                <button 
                  className="action-btn approve"
                  onClick={() => {
                    onApprove(expandedPhoto.id);
                    setExpandedPhoto(null);
                  }}
                >
                  <CheckIcon /> Approve
                </button>
              )}
              {expandedPhoto.approvalStatus !== 'rejected' && (
                <button 
                  className="action-btn reject"
                  onClick={() => {
                    onReject(expandedPhoto.id);
                    setExpandedPhoto(null);
                  }}
                >
                  <XIcon /> Reject
                </button>
              )}
              {expandedPhoto.approvalStatus === 'approved' && findMatchingDish(expandedPhoto.dishName) && (
                <button 
                  className="action-btn set-official"
                  onClick={() => {
                    onSetAsOfficialPhoto(findMatchingDish(expandedPhoto.dishName).id, expandedPhoto);
                    setExpandedPhoto(null);
                  }}
                >
                  <StarIcon /> Set as Official Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * PhotoCard Component
 */
function PhotoCard({
  photo,
  status,
  matchingDish,
  isUpdating,
  onApprove,
  onReject,
  onSetAsOfficial,
  onExpand,
}) {
  return (
    <div className={`photo-card ${status} ${isUpdating ? 'updating' : ''}`}>
      <div className="photo-image-container" onClick={onExpand}>
        <img src={photo.imageUrl} alt={photo.dishName} />
        <div className="photo-overlay">
          <span className="click-hint">Click to expand</span>
        </div>
      </div>
      
      <div className="photo-info">
        <h4 className="dish-name">{photo.dishName || 'Unknown Dish'}</h4>
        <p className="uploader-name">
          <UserIcon /> {photo.username || 'Anonymous'}
        </p>
        <div className="photo-stats">
          <span className="likes"><HeartIcon /> {photo.likes || 0}</span>
          <span className="date">{new Date(photo.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="photo-actions">
        {status === 'pending' && (
          <>
            <button 
              className="action-btn approve"
              onClick={() => onApprove(photo.id)}
              disabled={isUpdating}
              title="Approve photo"
            >
              <CheckIcon />
            </button>
            <button 
              className="action-btn reject"
              onClick={() => onReject(photo.id)}
              disabled={isUpdating}
              title="Reject photo"
            >
              <XIcon />
            </button>
          </>
        )}
        {status === 'approved' && (
          <>
            {matchingDish && (
              <button 
                className="action-btn set-official"
                onClick={() => onSetAsOfficial(matchingDish.id, photo)}
                disabled={isUpdating}
                title="Set as official photo for this dish"
              >
                <StarIcon />
              </button>
            )}
            <button 
              className="action-btn reject"
              onClick={() => onReject(photo.id)}
              disabled={isUpdating}
              title="Reject photo"
            >
              <XIcon />
            </button>
          </>
        )}
        {status === 'rejected' && (
          <button 
            className="action-btn approve"
            onClick={() => onApprove(photo.id)}
            disabled={isUpdating}
            title="Approve photo"
          >
            <CheckIcon />
          </button>
        )}
      </div>

      {isUpdating && (
        <div className="updating-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default CommunityPhotoGallery;
