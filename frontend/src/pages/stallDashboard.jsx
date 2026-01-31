import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import MenuItemModal from '../components/MenuItemModal';
import PhotoUploadModal from '../components/PhotoUploadModal';
import MenuItemCard from '../components/MenuItemCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import CommunityPhotoGallery from '../components/CommunityPhotoGallery';
import StallClosureSchedule from '../components/StallClosureSchedule';
import ClosureBadge from '../components/ClosureBadge';
import PromoManagement from '../components/PromoManagement';
import SocialMediaManager from '../components/SocialMediaManager';
import ReviewList from '../components/ReviewList';
import './stallDashboard.css';

/**
 * StallDashboard Component
 * 
 * Main dashboard for stall owners to manage menu items and photos.
 * Features:
 * - View and manage menu items
 * - Review and moderate user-uploaded photos
 * - Set official photos for menu items
 * - Bulk actions support
 * - Filter by status (All, With Photos, Without Photos)
 */

// Lightweight inline icons
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const ImageOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />
    <line x1="13.5" y1="13.5" x2="6" y2="21" />
    <line x1="18" y1="12" x2="21" y2="15" />
    <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" />
    <path d="M21 15V5a2 2 0 0 0-2-2H9" />
  </svg>
);

function StallDashboard() {
  const { user, logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  /* =======================
     Core State
  ======================= */
  const [stall, setStall] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [photosByDish, setPhotosByDish] = useState({});
  const [communityPhotos, setCommunityPhotos] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* =======================
     UI State
  ======================= */
  const [loading, setLoading] = useState(true);
  const [loadingCommunityPhotos, setLoadingCommunityPhotos] = useState(false);
  const [error, setError] = useState('');
  const [uploadingStallImage, setUploadingStallImage] = useState(false);
  const [updatingDishIds, setUpdatingDishIds] = useState({});
  const [updatingPhotoIds, setUpdatingPhotoIds] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  const [sortBy, setSortBy] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'community', 'closures', 'promos', 'reviews', 'social'
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());

  /* =======================
     Modal State
  ======================= */
  const [menuItemModalOpen, setMenuItemModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [photoUploadModalOpen, setPhotoUploadModalOpen] = useState(false);
  const [uploadingForMenuItem, setUploadingForMenuItem] = useState(null);

  /* =======================
     Helpers
  ======================= */
  const getUserStallId = useCallback(
    () => user?.stallId ?? user?.stall_id ?? null,
    [user]
  );

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  /* =======================
     Stall Image Upload
  ======================= */
  const handleStallImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image must be less than 5MB');
      return;
    }

    const stallId = getUserStallId();
    if (!stallId) {
      showError('No stall associated with this account');
      return;
    }

    setUploadingStallImage(true);

    try {
      const formData = new FormData();
      formData.append('stallImage', file);

      const response = await axios.post(`/api/stalls/${stallId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        // Update local stall state with new image
        setStall(prev => ({
          ...prev,
          image_url: response.data.data.imageUrl
        }));
        showSuccess('Stall image updated successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading stall image:', err);
      showError(err.response?.data?.message || 'Failed to upload stall image');
    } finally {
      setUploadingStallImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  /* =======================
     Filtered Dishes
  ======================= */
  const filteredDishes = useMemo(() => {
    if (activeFilter === 'with_photos') {
      return dishes.filter((d) => d.image_url);
    } else if (activeFilter === 'without_photos') {
      return dishes.filter((d) => !d.image_url);
    }
    return dishes;
  }, [dishes, activeFilter]);

  /* =======================
     Bulk Selection Handlers
  ======================= */
  const handleSelectItem = useCallback((dishId, checked) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(dishId);
      } else {
        newSet.delete(dishId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        setSelectedItems(new Set(filteredDishes.map((d) => d.id)));
      } else {
        setSelectedItems(new Set());
      }
    },
    [filteredDishes]
  );

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmMsg = `Delete ${selectedItems.size} selected item${
      selectedItems.size > 1 ? 's' : ''
    }?`;

    if (!window.confirm(confirmMsg)) return;

    // TODO: Implement bulk delete API call
    showSuccess(`${selectedItems.size} items prepared for deletion`);
    setSelectedItems(new Set());
  };

  /* =======================
     Data Loading
  ======================= */
  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      setPhotosByDish({});
      setDishes([]);
      setCommunityPhotos([]);

      const stallId = getUserStallId();
      if (!stallId) {
        setError('No stall associated with this account.');
        setLoading(false);
        return;
      }

      try {
        const [stallRes, dishesRes, photosRes, communityRes] = await Promise.all([
          axios.get(`/api/stalls/${stallId}`),
          axios.get(`/api/stalls/${stallId}/dishes`),
          axios.get(`/api/menu-photos/stall/${stallId}`),
          axios.get(`/api/photos/stall/${stallId}`)
        ]);

        const stallData = stallRes.data?.data || stallRes.data;
        const dishesList = dishesRes.data?.data || dishesRes.data || [];
        const photosList = photosRes.data?.data || photosRes.data || [];
        const communityList = communityRes.data?.data || communityRes.data || [];

        setStall(stallData);
        setDishes(dishesList);
        setCommunityPhotos(communityList);

        const grouped = {};
        photosList.forEach((p) => {
          const name = (p.dishName || p.name || p.dish_name || '').trim();
          const imageUrl = p.imageUrl || p.image_url || p.file_path;
          if (!name || !imageUrl) return;

          if (!grouped[name]) grouped[name] = [];
          grouped[name].push({ id: p.id, imageUrl, raw: p });
        });

        setPhotosByDish(grouped);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, getUserStallId]);

  /* =======================
     Actions
  ======================= */
  const handleSelectOfficialPhoto = async (dishId, photo, currentImageUrl) => {
    if (currentImageUrl && !window.confirm('Replace current photo?')) return;

    setUpdatingDishIds((p) => ({ ...p, [dishId]: true }));
    const prevDishes = [...dishes];

    // Optimistic update
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId ? { ...d, image_url: photo.imageUrl } : d
      )
    );

    try {
      await axios.put(`/api/dishes/${dishId}`, {
        image_url: photo.imageUrl,
      });
      showSuccess('Official photo updated');
    } catch (err) {
      setDishes(prevDishes);
      setActionErrors((p) => ({
        ...p,
        [dishId]: 'Failed to update photo',
      }));
      showError('Failed to update official photo');
    } finally {
      setUpdatingDishIds((p) => ({ ...p, [dishId]: false }));
    }
  };

  const handleApprovePhoto = async (photoId, dishId) => {
    try {
      // TODO: Implement photo approval API
      // await axios.put(`/api/menu-photos/${photoId}/approve`);

      // Update local state
      setPhotosByDish((prev) => {
        const dishName = dishes.find((d) => d.id === dishId)?.name;
        if (!dishName) return prev;

        const photos = prev[dishName] || [];
        return {
          ...prev,
          [dishName]: photos.map((p) =>
            p.id === photoId
              ? { ...p, raw: { ...p.raw, approval_status: 'approved' } }
              : p
          ),
        };
      });

      showSuccess('Photo approved');
    } catch (err) {
      showError('Failed to approve photo');
    }
  };

  const handleRejectPhoto = async (photoId, dishId) => {
    try {
      // TODO: Implement photo rejection API
      // await axios.put(`/api/menu-photos/${photoId}/reject`);

      // Update local state
      setPhotosByDish((prev) => {
        const dishName = dishes.find((d) => d.id === dishId)?.name;
        if (!dishName) return prev;

        const photos = prev[dishName] || [];
        return {
          ...prev,
          [dishName]: photos.map((p) =>
            p.id === photoId
              ? { ...p, raw: { ...p.raw, approval_status: 'rejected' } }
              : p
          ),
        };
      });

      showSuccess('Photo rejected');
    } catch (err) {
      showError('Failed to reject photo');
    }
  };

  /* =======================
     Community Photo Actions
  ======================= */
  const handleApproveCommunityPhoto = async (photoId) => {
    setUpdatingPhotoIds((p) => ({ ...p, [photoId]: true }));
    
    try {
      await axios.put(`/api/photos/${photoId}/approval`, { status: 'approved' });
      
      // Update local state
      setCommunityPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, approvalStatus: 'approved', isApproved: true } : p
        )
      );
      
      showSuccess('Photo approved successfully');
    } catch (err) {
      console.error('Error approving photo:', err);
      showError('Failed to approve photo');
    } finally {
      setUpdatingPhotoIds((p) => ({ ...p, [photoId]: false }));
    }
  };

  const handleRejectCommunityPhoto = async (photoId) => {
    setUpdatingPhotoIds((p) => ({ ...p, [photoId]: true }));
    
    try {
      await axios.put(`/api/photos/${photoId}/approval`, { status: 'rejected' });
      
      // Update local state
      setCommunityPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, approvalStatus: 'rejected', isApproved: false } : p
        )
      );
      
      showSuccess('Photo rejected');
    } catch (err) {
      console.error('Error rejecting photo:', err);
      showError('Failed to reject photo');
    } finally {
      setUpdatingPhotoIds((p) => ({ ...p, [photoId]: false }));
    }
  };

  const handleSetCommunityPhotoAsOfficial = async (dishId, photo) => {
    const dish = dishes.find((d) => d.id === dishId);
    if (dish?.image_url && !window.confirm(`Set this photo as the official photo for "${dish.name}"?`)) return;

    setUpdatingDishIds((p) => ({ ...p, [dishId]: true }));
    const prevDishes = [...dishes];

    // Optimistic update
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId ? { ...d, image_url: photo.imageUrl } : d
      )
    );

    try {
      await axios.put(`/api/dishes/${dishId}`, {
        image_url: photo.imageUrl,
      });
      showSuccess(`Official photo updated for "${dish?.name}"`);
    } catch (err) {
      setDishes(prevDishes);
      showError('Failed to update official photo');
    } finally {
      setUpdatingDishIds((p) => ({ ...p, [dishId]: false }));
    }
  };

  const handleSaveMenuItem = async (formData) => {
    try {
      let imageUrl = formData.image_url || null;
      const stallId = getUserStallId();
      const originalStallImage = stall?.image_url || null;

      // If there's a new image file, upload it first
      if (formData.imageFile) {
        // Save current stall image to restore later
        const imageFormData = new FormData();
        imageFormData.append('stallImage', formData.imageFile);

        const uploadRes = await axios.post(`/api/stalls/${stallId}/image`, imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        if (uploadRes.data?.success && uploadRes.data?.data?.imageUrl) {
          imageUrl = uploadRes.data.data.imageUrl;
          
          // Restore original stall image if it was different
          if (originalStallImage && originalStallImage !== imageUrl) {
            try {
              await axios.put(`/api/stalls/${stallId}`, { image_url: originalStallImage }, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
            } catch (restoreErr) {
              console.warn('Could not restore stall image:', restoreErr);
              // Not critical, continue with dish creation
            }
          }
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Prepare dish data (remove imageFile, add image_url)
      const { imageFile, ...dishData } = formData;
      const payload = {
        ...dishData,
        image_url: imageUrl
      };

      if (editingMenuItem) {
        await axios.put(`/api/dishes/${editingMenuItem.id}`, payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDishes((p) =>
          p.map((d) =>
            d.id === editingMenuItem.id ? { ...d, ...payload } : d
          )
        );
        showSuccess('Menu item updated');
      } else {
        const res = await axios.post('/api/dishes', payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDishes((p) => [res.data?.data || res.data, ...p]);
        showSuccess('Menu item added');
      }

      setMenuItemModalOpen(false);
      setEditingMenuItem(null);
    } catch (err) {
      console.error('Error saving menu item:', err);
      showError(
        err.response?.data?.message || (editingMenuItem ? 'Failed to update item' : 'Failed to add item')
      );
    }
  };

  /* =======================
     Render
  ======================= */
  if (!user) {
    return (
      <div className="stall-dashboard">
        <div className="loading-container">
          <p className="loading-text">Please log in as a stall owner.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stall-dashboard">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  const allSelected =
    filteredDishes.length > 0 &&
    filteredDishes.every((d) => selectedItems.has(d.id));
  const someSelected = selectedItems.size > 0 && !allSelected;

  return (
    <div className="stall-dashboard">
      {/* Stall Banner Image Section */}
      <div className="stall-banner-section">
        <div className="stall-banner-wrapper">
          {stall?.image_url ? (
            <img 
              src={stall.image_url} 
              alt={stall.name || stall.stall_name || 'Stall'} 
              className="stall-banner-image"
            />
          ) : (
            <div className="stall-banner-placeholder">
              <ImageOffIcon />
              <span>No stall image</span>
            </div>
          )}
          <label className={`stall-banner-upload-btn ${uploadingStallImage ? 'uploading' : ''}`}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleStallImageUpload}
              disabled={uploadingStallImage}
              style={{ display: 'none' }}
            />
            {uploadingStallImage ? (
              <>
                <span className="upload-spinner"></span>
                Uploading...
              </>
            ) : (
              <>
                <CameraIcon />
                {stall?.image_url ? 'Change Image' : 'Upload Stall Image'}
              </>
            )}
          </label>
        </div>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Stall Dashboard</h1>
        </div>
        <div className="dashboard-header-right">
          {stall && (
            <div className="dashboard-header-info">
              <div className="stall-name">{stall.name || stall.stall_name}</div>
              {lastUpdated && (
                <div className="last-updated">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
          <div className="user-menu">
            <div className="user-info">
              <UserIcon />
              <span className="user-name">
                {user?.username || user?.name || 'Stall Owner'}
              </span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              <LogoutIcon />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Bulk Actions Toolbar */}
      {selectedItems.size > 0 && activeTab === 'menu' && (
        <div className="bulk-actions-toolbar">
          <div className="bulk-info">
            <span className="bulk-count">{selectedItems.size} selected</span>
          </div>
          <div className="bulk-actions">
            <button
              className="bulk-action-btn bulk-delete"
              onClick={handleBulkDelete}
            >
              <TrashIcon />
              Delete Selected
            </button>
            <button
              className="bulk-action-btn bulk-cancel"
              onClick={() => setSelectedItems(new Set())}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          <ImageIcon /> Menu Items ({dishes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          📷 Community Photos ({communityPhotos.length})
          {communityPhotos.filter(p => !p.approvalStatus || p.approvalStatus === 'pending').length > 0 && (
            <span className="pending-badge">
              {communityPhotos.filter(p => !p.approvalStatus || p.approvalStatus === 'pending').length}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'closures' ? 'active' : ''}`}
          onClick={() => setActiveTab('closures')}
        >
          🔒 Closure Schedule
        </button>
        <button
          className={`tab-btn ${activeTab === 'promos' ? 'active' : ''}`}
          onClick={() => setActiveTab('promos')}
        >
          🏷️ Promotions
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Reviews
        </button>
        <button
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          📱 Social Media
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'menu' ? (
        <>
          {/* Action Bar */}
          <div className="action-bar">
            <div className="filter-group">
              <div className="select-all-container">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all items"
                />
                <span className="filter-label">
                  {someSelected ? 'Some selected' : allSelected ? 'All selected' : 'Select all'}
                </span>
              </div>
              <div className="filter-divider"></div>
              <button
                className={`filter-btn ${activeFilter === null ? 'active' : ''}`}
                onClick={() => setActiveFilter(null)}
              >
                All Items ({dishes.length})
              </button>
              <button
                className={`filter-btn ${
                  activeFilter === 'with_photos' ? 'active' : ''
                }`}
                onClick={() => setActiveFilter('with_photos')}
              >
                With Photos ({dishes.filter((d) => d.image_url).length})
              </button>
              <button
                className={`filter-btn ${
                  activeFilter === 'without_photos' ? 'active' : ''
                }`}
                onClick={() => setActiveFilter('without_photos')}
              >
                Without Photos ({dishes.filter((d) => !d.image_url).length})
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setEditingMenuItem(null);
                setMenuItemModalOpen(true);
              }}
            >
              <PlusIcon /> Add Menu Item
            </button>
          </div>

          {/* Menu Items Grid */}
          {filteredDishes.length === 0 ? (
            <div className="empty-state">
              <ImageIcon className="empty-icon" />
              <h2 className="empty-title">
                {activeFilter
                  ? 'No items match this filter'
                  : 'No Menu Items Yet'}
              </h2>
              <p className="empty-description">
                {activeFilter
                  ? 'Try selecting a different filter to view other items.'
                  : 'Get started by adding your first menu item to showcase your dishes.'}
              </p>
              {!activeFilter && (
                <button
                  className="btn-primary"
                  onClick={() => setMenuItemModalOpen(true)}
                >
                  Add Your First Item
                </button>
              )}
            </div>
          ) : (
            <div className="menu-items-grid">
              {filteredDishes.map((dish) => {
                const photos = photosByDish[dish.name] || [];
                const isUpdating = updatingDishIds[dish.id];
                const hasError = actionErrors[dish.id];

                return (
                  <MenuItemCard
                    key={dish.id}
                    dish={dish}
                    photos={photos}
                    isUpdating={isUpdating}
                    isSelected={selectedItems.has(dish.id)}
                    onSelect={handleSelectItem}
                    onEdit={(item) => {
                      setEditingMenuItem(item);
                      setMenuItemModalOpen(true);
                    }}
                    onUpload={() => {}} // No longer used, but kept for component compatibility
                    onSetOfficial={handleSelectOfficialPhoto}
                    onApprovePhoto={handleApprovePhoto}
                    onRejectPhoto={handleRejectPhoto}
                    hasError={!!hasError}
                    errorMessage={hasError}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : activeTab === 'community' ? (
        /* Community Photos Tab */
        <CommunityPhotoGallery
          photos={communityPhotos}
          dishes={dishes}
          isLoading={loadingCommunityPhotos}
          onApprove={handleApproveCommunityPhoto}
          onReject={handleRejectCommunityPhoto}
          onSetAsOfficialPhoto={handleSetCommunityPhotoAsOfficial}
          updatingPhotoIds={updatingPhotoIds}
        />
      ) : activeTab === 'closures' ? (
        /* Closure Schedule Tab */
        <StallClosureSchedule stallId={getUserStallId()} />
      ) : activeTab === 'promos' ? (
        /* Promotions Tab */
        <PromoManagement stallId={getUserStallId()} />
      ) : activeTab === 'reviews' ? (
        /* Customer Reviews Tab */
        <div className="reviews-tab-content">
          <h3 className="reviews-tab-title">Customer Reviews & Ratings</h3>
          <p className="reviews-tab-subtitle">See what customers are saying about your stall.</p>
          <ReviewList
            entityType="stall"
            entityId={getUserStallId()}
            limit={20}
          />
        </div>
      ) : activeTab === 'social' ? (
        /* Social Media Tab */
        <div className="social-tab-content">
          <SocialMediaManager 
            stallId={getUserStallId()} 
            onUpdate={() => {
              // Refresh stall data after social media update
              fetchStallData();
            }}
          />
        </div>
      ) : null}

      {/* Modals */}
      <MenuItemModal
        isOpen={menuItemModalOpen}
        onClose={() => {
          setMenuItemModalOpen(false);
          setEditingMenuItem(null);
        }}
        onSave={handleSaveMenuItem}
        menuItem={editingMenuItem}
        stallId={getUserStallId()}
      />

      <PhotoUploadModal
        isOpen={photoUploadModalOpen}
        onClose={() => {
          setPhotoUploadModalOpen(false);
          setUploadingForMenuItem(null);
        }}
        menuItem={uploadingForMenuItem}
        stallId={getUserStallId()}
        hawkerCentreId={stall?.hawker_centre_id}
      />
    </div>
  );
}

export default StallDashboard;
