import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

/**
 * Stall Owner Dashboard
 * - Fetches logged-in user via AuthContext
 * - Loads stall, dishes and publicly uploaded photos
 * - Allows selecting a public photo as the official `image_url` for a dish
 */
function StallDashboard() {
  const { user } = useContext(AuthContext);

  // Core data states
  const [stall, setStall] = useState(null);
  const [dishes, setDishes] = useState([]); // dishes for this stall
  const [photosByDish, setPhotosByDish] = useState({}); // { dishName: [photo, ...] }

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingDishIds, setUpdatingDishIds] = useState({}); // { [dishId]: boolean }
  const [actionErrors, setActionErrors] = useState({}); // { [dishId]: 'msg' }

  // Determine stallId from user object (supports multiple shapes)
  const getUserStallId = () => user?.stallId || user?.stall_id || user?.stallId || null;

  useEffect(() => {
    // Load stall, dishes and photos when user is available
    async function loadAll() {
      setLoading(true);
      setError('');
      setDishes([]);
      setPhotosByDish({});

      if (!user) {
        setLoading(false);
        return;
      }

      const stallId = getUserStallId();
      if (!stallId) {
        setError('No stall associated with this account.');
        setLoading(false);
        return;
      }

      try {
        // Fetch stall details
        const stallRes = await axios.get(`/api/stalls/${stallId}`);
        const stallData = stallRes.data?.data || stallRes.data || null;
        setStall(stallData);

        // Fetch dishes and public menu photos in parallel
        const [dishesRes, photosRes] = await Promise.all([
          axios.get(`/api/stalls/${stallId}/dishes`),
          axios.get(`/api/menu-photos/stall/${stallId}`)
        ]);

        const dishesList = dishesRes.data?.data || dishesRes.data || [];
        const photosList = photosRes.data?.data || photosRes.data || [];

        setDishes(dishesList || []);

        // Group photos by the dish name they were uploaded for
        const grouped = {};
        (photosList || []).forEach(p => {
          // Controller may return dishName or name — support both
          const name = p.dishName || p.name || p.dish_name || p.name?.trim();
          const imageUrl = p.imageUrl || p.image_url || p.file_path || p.image_url;
          const id = p.id;
          if (!name || !imageUrl) return;
          const key = name.trim();
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id, imageUrl, raw: p });
        });

        setPhotosByDish(grouped);
      } catch (err) {
        console.error('Error loading dashboard data', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [user]);

  // Handler: set a photo as the official image for a dish (optimistic)
  const handleSelectOfficialPhoto = async (dishId, photo) => {
    setActionErrors(prev => ({ ...prev, [dishId]: '' }));
    // Optimistic update: snapshot previous dishes
    const prevDishes = JSON.parse(JSON.stringify(dishes));

    // Mark as updating
    setUpdatingDishIds(prev => ({ ...prev, [dishId]: true }));

    // Immediately update local dish image_url for UI responsiveness
    setDishes(prev => prev.map(d => (d.id === dishId ? { ...d, image_url: photo.imageUrl } : d)));

    try {
      // Call backend to update dish (PUT /api/dishes/:id)
      await axios.put(`/api/dishes/${dishId}`, { image_url: photo.imageUrl });

      // success: keep optimistic state
      setUpdatingDishIds(prev => ({ ...prev, [dishId]: false }));
    } catch (err) {
      console.error('Failed to update dish image_url', err);
      // revert optimistic change
      setDishes(prevDishes);
      setActionErrors(prev => ({ ...prev, [dishId]: 'Failed to update official photo. Try again.' }));
      setUpdatingDishIds(prev => ({ ...prev, [dishId]: false }));
    }
  };

  if (!user) return <div style={{ padding: 20 }}>Please log in as a stall owner to access the dashboard.</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Stall Owner Dashboard</h2>
      <p>Welcome, {user.name || user.email}</p>

      {loading && <p>Loading dashboard...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !stall && <p>No stall found for your account.</p>}

      {stall && (
        <div>
          <h3 style={{ marginTop: 8 }}>{stall.name || stall.title || `Stall #${stall.id || stall.stallId}`}</h3>
          <p style={{ color: '#666', marginTop: 0 }}>{stall.description || ''}</p>

          {/* Dashboard: one card per dish */}
          <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            {dishes.length === 0 && <div>No dishes found. Upload dishes or photos to get started.</div>}

            {dishes.map(dish => {
              const photos = photosByDish[dish.name?.trim()] || photosByDish[dish.name?.toLowerCase?.()] || [];
              return (
                <div key={dish.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{dish.name}</strong>
                      <div style={{ color: '#666', fontSize: 13 }}>{dish.category || ''} • ${dish.price?.toFixed?.(2) || dish.price}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#666' }}>Approved photo</div>
                      {dish.image_url ? (
                        <img src={dish.image_url} alt="approved" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '2px solid #4caf50' }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: 6, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>—</div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 8, color: '#444' }}>Public photos for this dish</div>

                    {photos.length === 0 ? (
                      <div style={{ color: '#777', fontSize: 13 }}>No public photos uploaded yet for this dish.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                        {photos.map(p => {
                          const isApproved = dish.image_url && (dish.image_url === p.imageUrl || dish.image_url === p.image_url);
                          return (
                            <div key={p.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: isApproved ? '3px solid #4caf50' : '1px solid #e6e6e6' }}>
                              <img src={p.imageUrl} alt={dish.name} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />

                              {isApproved && (
                                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(76,175,80,0.95)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>Approved</div>
                              )}

                              <div style={{ display: 'flex', gap: 8, padding: 8, background: '#fff' }}>
                                <button
                                  onClick={() => handleSelectOfficialPhoto(dish.id, p)}
                                  disabled={!!updatingDishIds[dish.id]}
                                  style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none', background: isApproved ? '#a5d6a7' : '#1976d2', color: '#fff', cursor: 'pointer' }}
                                >
                                  {updatingDishIds[dish.id] ? 'Updating...' : isApproved ? 'Selected' : 'Select as Official Photo'}
                                </button>

                                <a href={p.imageUrl} target="_blank" rel="noreferrer" style={{ padding: '6px 8px', background: '#f5f5f5', borderRadius: 6, textDecoration: 'none', color: '#333', fontSize: 13 }}>View</a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {actionErrors[dish.id] && <div style={{ color: 'red', marginTop: 8 }}>{actionErrors[dish.id]}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StallDashboard;
