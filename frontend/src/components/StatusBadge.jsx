import React from 'react';

/**
 * StatusBadge Component
 * 
 * Displays the current status of a menu item based on its photo state:
 * - Draft: No official photo selected
 * - Live: Has an approved official photo
 * - Pending: Has user uploads awaiting moderation
 * 
 * Status is derived from data, not hardcoded.
 */
function StatusBadge({ menuItem, userPhotosCount }) {
  // Derive status from menu item data
  const getStatus = () => {
    const hasOfficialPhoto = !!menuItem.image_url;
    const hasPendingPhotos = userPhotosCount > 0;

    if (hasOfficialPhoto) {
      return { label: 'Live', className: 'status-live' };
    } else if (hasPendingPhotos) {
      return { label: 'Pending', className: 'status-pending' };
    } else {
      return { label: 'Draft', className: 'status-draft' };
    }
  };

  const status = getStatus();

  return (
    <span className={`status-badge ${status.className}`}>
      {status.label}
    </span>
  );
}

export default StatusBadge;
