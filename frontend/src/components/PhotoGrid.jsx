import React from 'react';

/**
 * PhotoGrid Component
 * 
 * Displays user-uploaded photos with moderation actions:
 * - Approve: Mark photo as approved
 * - Reject: Mark photo as rejected
 * - Set as Official: Set this photo as the menu item's official photo
 * 
 * Shows different views based on photo approval status:
 * - All photos (default)
 * - Pending photos only
 * - Approved photos only
 * - Rejected photos only
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

function PhotoGrid({
  photos = [],
  dishId,
  isUpdating = false,
  onSetOfficial,
  onApprove,
  onReject,
  currentOfficialUrl,
}) {
  if (photos.length === 0) {
    return (
      <div className="no-uploads-message">
        <ImageIcon className="no-uploads-icon" />
        <p className="no-uploads-text">No user uploads yet</p>
        <p className="no-uploads-hint">
          When customers order this dish, they can upload photos. Those photos
          will appear here for you to review and approve.
        </p>
        <p className="no-uploads-hint">
          Approved photos can be set as the official menu item photo.
        </p>
      </div>
    );
  }

  // Group photos by approval status
  const pendingPhotos = photos.filter(
    (p) => p.raw?.approval_status === 'pending' || !p.raw?.approval_status
  );
  const approvedPhotos = photos.filter(
    (p) => p.raw?.approval_status === 'approved'
  );
  const rejectedPhotos = photos.filter(
    (p) => p.raw?.approval_status === 'rejected'
  );

  return (
    <div className="photo-grid-container">
      {/* Pending Photos Section */}
      {pendingPhotos.length > 0 && (
        <div className="photo-section">
          <div className="photo-section-header">
            <span className="photo-section-label">
              Pending Review ({pendingPhotos.length})
            </span>
          </div>
          <div className="user-photos-grid">
            {pendingPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                dishId={dishId}
                isUpdating={isUpdating}
                onSetOfficial={onSetOfficial}
                onApprove={onApprove}
                onReject={onReject}
                currentOfficialUrl={currentOfficialUrl}
                status="pending"
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Photos Section */}
      {approvedPhotos.length > 0 && (
        <div className="photo-section">
          <div className="photo-section-header">
            <span className="photo-section-label">
              Approved ({approvedPhotos.length})
            </span>
          </div>
          <div className="user-photos-grid">
            {approvedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                dishId={dishId}
                isUpdating={isUpdating}
                onSetOfficial={onSetOfficial}
                onApprove={onApprove}
                onReject={onReject}
                currentOfficialUrl={currentOfficialUrl}
                status="approved"
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Photos Section (Collapsed by default) */}
      {rejectedPhotos.length > 0 && (
        <div className="photo-section">
          <details className="photo-section-collapsible">
            <summary className="photo-section-header">
              <span className="photo-section-label">
                Rejected ({rejectedPhotos.length})
              </span>
            </summary>
            <div className="user-photos-grid">
              {rejectedPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  dishId={dishId}
                  isUpdating={isUpdating}
                  onSetOfficial={onSetOfficial}
                  onApprove={onApprove}
                  onReject={onReject}
                  currentOfficialUrl={currentOfficialUrl}
                  status="rejected"
                />
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

/**
 * PhotoCard Component
 * 
 * Individual photo card with moderation actions overlay on hover
 */
function PhotoCard({
  photo,
  dishId,
  isUpdating,
  onSetOfficial,
  onApprove,
  onReject,
  currentOfficialUrl,
  status,
}) {
  const isOfficial = currentOfficialUrl === photo.imageUrl;

  return (
    <div className={`user-photo-item ${isUpdating ? 'updating' : ''} ${status}`}>
      <img src={photo.imageUrl} alt="" className="user-photo" />

      {isOfficial && (
        <div className="official-indicator">
          <StarIcon />
        </div>
      )}

      {/* Moderation Actions Overlay */}
      <div className="photo-actions-overlay">
        <div className="photo-actions">
          {/* Set as Official (only for approved or pending photos) */}
          {status !== 'rejected' && (
            <button
              className="photo-action-btn set-official"
              onClick={() => onSetOfficial(dishId, photo, currentOfficialUrl)}
              title="Set as official photo"
              disabled={isOfficial}
            >
              <StarIcon />
            </button>
          )}

          {/* Approve (only for pending or rejected photos) */}
          {status !== 'approved' && (
            <button
              className="photo-action-btn approve"
              onClick={() => onApprove(photo.id, dishId)}
              title="Approve photo"
            >
              <CheckIcon />
            </button>
          )}

          {/* Reject (only for pending or approved photos) */}
          {status !== 'rejected' && (
            <button
              className="photo-action-btn reject"
              onClick={() => onReject(photo.id, dishId)}
              title="Reject photo"
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoGrid;
