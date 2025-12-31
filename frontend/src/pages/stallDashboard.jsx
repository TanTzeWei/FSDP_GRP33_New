import React, { useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import MenuItemModal from '../components/MenuItemModal';
import PhotoUploadModal from '../components/PhotoUploadModal';
import './stallDashboard.css';

// Lightweight inline icons
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

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

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function StallDashboard() {
  const { user } = useContext(AuthContext);

  /* =======================
     Core State
  ======================= */
  const [stall, setStall] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [photosByDish, setPhotosByDish] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  /* =======================
     UI State
  ======================= */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingDishIds, setUpdatingDishIds] = useState({});
  const [actionErrors, setActionErrors] = useState({});
  const [sortBy, setSortBy] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

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

      const stallId = getUserStallId();
      if (!stallId) {
        setError('No stall associated with this account.');
        setLoading(false);
        return;
      }

      try {
        const [stallRes, dishesRes, photosRes] = await Promise.all([
          axios.get(`/api/stalls/${stallId}`),
          axios.get(`/api/stalls/${stallId}/dishes`),
          axios.get(`/api/menu-photos/stall/${stallId}`)
        ]);

        const stallData = stallRes.data?.data || stallRes.data;
        const dishesList = dishesRes.data?.data || dishesRes.data || [];
        const photosList = photosRes.data?.data || photosRes.data || [];

        setStall(stallData);
        setDishes(dishesList);

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

    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId ? { ...d, image_url: photo.imageUrl } : d
      )
    );

    try {
      await axios.put(`/api/dishes/${dishId}`, {
        image_url: photo.imageUrl
      });
    } catch {
      setDishes(prevDishes);
      setActionErrors((p) => ({
        ...p,
        [dishId]: 'Failed to update photo'
      }));
    } finally {
      setUpdatingDishIds((p) => ({ ...p, [dishId]: false }));
    }
  };

  const handleSaveMenuItem = async (formData) => {
    if (editingMenuItem) {
      await axios.put(`/api/dishes/${editingMenuItem.id}`, formData);
      setDishes((p) =>
        p.map((d) => (d.id === editingMenuItem.id ? { ...d, ...formData } : d))
      );
      showSuccess('Menu item updated');
    } else {
      const res = await axios.post('/api/dishes', formData);
      setDishes((p) => [res.data?.data || res.data, ...p]);
      showSuccess('Menu item added');
    }

    setMenuItemModalOpen(false);
    setEditingMenuItem(null);
  };

  const filteredDishes =
    activeFilter === 'with_photos'
      ? dishes.filter((d) => d.image_url)
      : activeFilter === 'without_photos'
      ? dishes.filter((d) => !d.image_url)
      : dishes;

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
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stall-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="stall-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Stall Dashboard</h1>
        </div>
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
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Action Bar */}
      <div className="action-bar">
        <div className="filter-group">
          <span className="filter-label">Filter:</span>
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
          <h2 className="empty-title">No Menu Items Yet</h2>
          <p className="empty-description">
            Get started by adding your first menu item to showcase your dishes.
          </p>
          <button
            className="btn-primary"
            onClick={() => setMenuItemModalOpen(true)}
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="menu-items-grid">
          {filteredDishes.map((dish) => {
            const photos = photosByDish[dish.name] || [];
            const isUpdating = updatingDishIds[dish.id];
            const hasError = actionErrors[dish.id];

            return (
              <div key={dish.id} className="menu-item-card">
                {/* Card Header */}
                <div className="menu-item-header">
                  <div className="menu-item-title">
                    <h3 className="menu-item-name">{dish.name}</h3>
                    <p className="menu-item-price">
                      ${parseFloat(dish.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="menu-item-actions">
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setEditingMenuItem(dish);
                        setMenuItemModalOpen(true);
                      }}
                      title="Edit menu item"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setUploadingForMenuItem(dish);
                        setPhotoUploadModalOpen(true);
                      }}
                      title="Upload photo"
                    >
                      <UploadIcon />
                    </button>
                  </div>
                </div>

                {/* Official Photo */}
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

                {/* User Uploaded Photos */}
                <div className="user-uploads-section">
                  <div className="uploads-header">
                    <div className="uploads-label">User Uploads</div>
                    <div className="uploads-count">{photos.length} photos</div>
                  </div>

                  {photos.length > 0 ? (
                    <div className="user-photos-grid">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className={`user-photo-item ${
                            isUpdating ? 'updating' : ''
                          }`}
                          onClick={() =>
                            handleSelectOfficialPhoto(
                              dish.id,
                              photo,
                              dish.image_url
                            )
                          }
                          title="Click to set as official photo"
                        >
                          <img
                            src={photo.imageUrl}
                            alt=""
                            className="user-photo"
                          />
                          <div className="select-overlay">
                            <CheckIcon className="select-icon" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-uploads-message">
                      <ImageIcon className="no-uploads-icon" />
                      <p className="no-uploads-text">
                        No user uploads yet for this dish
                      </p>
                      <p className="no-uploads-hint">
                        Customers can upload photos when they order
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {hasError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '13px',
                    }}
                  >
                    {hasError}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
