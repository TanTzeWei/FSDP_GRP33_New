import React from 'react';
import StatusBadge from './StatusBadge';
import PhotoGrid from './PhotoGrid';

/**
 * MenuItemCard Component
 * 
 * Displays a single menu item with:
 * - Checkbox for bulk selection
 * - Status badge (Draft/Live/Pending)
 * - Item details (name, price, description)
 * - Action buttons (edit, upload)
 * - Official photo preview
 * - User uploads with moderation actions
 */

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

function MenuItemCard({
  dish,
  photos = [],
  isUpdating = false,
  isSelected = false,
  onSelect,
  onEdit,
  onUpload,
  onSetOfficial,
  onApprovePhoto,
  onRejectPhoto,
  hasError,
  errorMessage,
}) {
  return (
    <div className={`menu-item-card ${isSelected ? 'selected' : ''}`}>
      {/* Selection Checkbox */}
      <div className="card-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(dish.id, e.target.checked)}
          aria-label={`Select ${dish.name}`}
        />
      </div>

      {/* Card Header */}
      <div className="menu-item-header">
        <div className="menu-item-title">
          <div className="title-row">
            <h3 className="menu-item-name">{dish.name}</h3>
            <StatusBadge menuItem={dish} userPhotosCount={photos.length} />
          </div>
          <p className="menu-item-price">
            ${parseFloat(dish.price || 0).toFixed(2)}
          </p>
          {dish.description && (
            <p className="menu-item-description">{dish.description}</p>
          )}
        </div>
        <div className="menu-item-actions">
          <button
            className="btn-icon"
            onClick={() => onEdit(dish)}
            title="Edit menu item"
          >
            <EditIcon />
          </button>
          <button
            className="btn-icon"
            onClick={() => onUpload(dish)}
            title="Upload photo"
          >
            <UploadIcon />
          </button>
        </div>
      </div>

      {/* Official Photo Section */}
      <div className="official-photo-section">
        <div className="official-photo-label">Official Photo</div>
        <div className="official-photo-container">
          {dish.image_url ? (
            <img
              src={dish.image_url}
              alt={dish.name}
              className="official-photo"
            />
          ) : (
            <div className="no-photo-placeholder">
              <ImageIcon className="no-photo-icon" />
              <p className="no-photo-text">No photo selected</p>
            </div>
          )}
        </div>
      </div>

      {/* User Uploads Section */}
      <div className="user-uploads-section">
        <div className="uploads-header">
          <div className="uploads-label">User Uploads</div>
          <div className="uploads-count">{photos.length} photos</div>
        </div>

        <PhotoGrid
          photos={photos}
          dishId={dish.id}
          isUpdating={isUpdating}
          onSetOfficial={onSetOfficial}
          onApprove={onApprovePhoto}
          onReject={onRejectPhoto}
          currentOfficialUrl={dish.image_url}
        />
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="card-error-message">{errorMessage}</div>
      )}
    </div>
  );
}

export default MenuItemCard;
