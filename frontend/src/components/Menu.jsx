// components/Menu.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import PromoBanner from './PromoBanner';
import ClosureBadge from './ClosureBadge';
import PhotoModal from './PhotoModal';
import './Menu.css';
import { AuthContext } from '../context/AuthContext';

const Menu = ({ selectedHawkerCenter, onClearHawkerCentre }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [communityPhotos, setCommunityPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [likedPhotos, setLikedPhotos] = useState([]); // local set of photo IDs this client has liked
  const [pendingLikes, setPendingLikes] = useState({}); // track in-flight like requests by photoId
  const [selectedStallFilter, setSelectedStallFilter] = useState('All');
  const [selectedDishFilter, setSelectedDishFilter] = useState('All');
  const [failedImages, setFailedImages] = useState(new Set());
  const [dbStalls, setDbStalls] = useState([]); // Stalls from database for filtering
  const [loadingStalls, setLoadingStalls] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Selected photo for modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle image load error
  const handleImageError = (stallId) => {
    setFailedImages(prev => new Set([...prev, stallId]));
  };

  // Helper function to get cuisine icon based on cuisine type
  const getCuisineIcon = (cuisineType) => {
    const cuisineName = cuisineType?.toLowerCase() || '';
    const iconMap = {
      'chinese': '🏮',
      'malay': '🌙',
      'indian': '🍛',
      'peranakan': '🏺',
      'western': '🍔',
      'drinks': '🥤',
      'beverages': '🥤',
      'japanese': '🍣',
      'korean': '🍜',
      'thai': '🌶️',
      'vietnamese': '🍲',
      'seafood': '🦐',
      'vegetarian': '🥬',
      'halal': '☪️',
      'desserts': '🍰',
      'snacks': '🍿'
    };
    return iconMap[cuisineName] || '🍽️';
  };

  // Helper function to get default image based on cuisine type
  const getDefaultImage = (cuisineType) => {
    const cuisineName = cuisineType?.toLowerCase() || '';
    const imageMap = {
      'chinese': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=350&fit=crop',
      'malay': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&h=350&fit=crop',
      'indian': 'https://images.unsplash.com/photo-1585937421612-232d3d67d529?w=500&h=350&fit=crop',
      'peranakan': 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&h=350&fit=crop',
      'western': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&h=350&fit=crop',
      'drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&h=350&fit=crop',
      'beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&h=350&fit=crop',
      'japanese': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&h=350&fit=crop',
      'korean': 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=500&h=350&fit=crop',
      'thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&h=350&fit=crop'
    };
    return imageMap[cuisineName] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=350&fit=crop';
  };

  // Fetch stalls from database
  useEffect(() => {
    const fetchStalls = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/stalls');
        const data = await response.json();
        if (data.success) {
          setDbStalls(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching stalls:', error);
      } finally {
        setLoadingStalls(false);
      }
    };
    fetchStalls();
  }, []);

  // Filter stalls by selected hawker centre (when user clicked a centre on the map)
  const stallsAtCentre = selectedHawkerCenter
    ? dbStalls.filter(
        stall =>
          stall.hawker_centre_id === selectedHawkerCenter.id ||
          (stall.hawker_centres?.name && stall.hawker_centres.name === selectedHawkerCenter.name)
      )
    : dbStalls;

  // Get unique categories from stalls (at selected centre or all)
  const categories = ['All', ...new Set(stallsAtCentre
    .map(stall => stall.cuisine_types?.name)
    .filter(Boolean)
  )];

  // Get stalls from database for filtering (with "All" option)
  const stallFilterOptions = ['All', ...stallsAtCentre.map(s => s.name || s.stall_name)];

  // Get unique dishes from community photos (for selected stall)
  const filteredByStall = selectedStallFilter === 'All' 
    ? communityPhotos 
    : communityPhotos.filter(p => p.stallName === selectedStallFilter);
  
  const uniqueDishes = ['All', ...new Set(filteredByStall.map(p => p.dishName || 'Unknown Dish'))];

  // Filter photos by stall and dish
  const filteredCommunityPhotos = communityPhotos.filter(photo => {
    const stallMatch = selectedStallFilter === 'All' || photo.stallName === selectedStallFilter;
    const dishMatch = selectedDishFilter === 'All' || photo.dishName === selectedDishFilter;
    return stallMatch && dishMatch;
  });

  const filteredFeaturedPhotos = featuredPhotos
    .filter(photo => {
      const stallMatch = selectedStallFilter === 'All' || photo.stallName === selectedStallFilter;
      const dishMatch = selectedDishFilter === 'All' || photo.dishName === selectedDishFilter;
      return stallMatch && dishMatch;
    })
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 9);

  // Update likes count for a photo across featured/community lists
  const updatePhotoLikes = (photoId, newCount) => {
    setFeaturedPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: newCount } : p));
    setCommunityPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: newCount } : p));
    // Update selected photo if modal is open
    if (selectedPhoto && selectedPhoto.id === photoId) {
      setSelectedPhoto(prev => ({ ...prev, likes: newCount }));
    }
  };

  // Handle photo click to open modal
  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  // Handle like from modal
  const handleModalLike = (photoId) => {
    toggleLike(photoId);
  };

  const { token } = useContext(AuthContext);

  // Toggle like/unlike for a photo
  const toggleLike = async (photoId) => {
    // Don't allow actions if still pending
    if (pendingLikes[photoId]) return;

    try {
      setPendingLikes(prev => ({ ...prev, [photoId]: true }));

      const method = likedPhotos.includes(photoId) ? 'DELETE' : 'POST';
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const res = await fetch(`http://localhost:3000/api/photos/${photoId}/like`, { 
        method, 
        headers, 
        credentials: 'include' 
      });
      
      if (!res.ok) {
        console.error('Like/Unlike failed:', res.status);
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        // Update liked photos list based on the action
        if (method === 'POST') {
          // User just liked - add to likedPhotos
          setLikedPhotos(prev => Array.from(new Set([...prev, photoId])));
        } else {
          // User just unliked - remove from likedPhotos
          setLikedPhotos(prev => prev.filter(id => id !== photoId));
        }
        
        // Update the like count from server
        updatePhotoLikes(photoId, json.data.likesCount || 0);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setPendingLikes(prev => {
        const copy = { ...prev };
        delete copy[photoId];
        return copy;
      });
    }
  };

  // Fetch menu photos from API
  useEffect(() => {
    const fetchMenuPhotos = async () => {
      try {
        // Fetch menu photos (from food_items that have images)
        const response = await fetch('http://localhost:3000/api/menu-photos/stall/1');
        const data = await response.json();
        
        if (data.success) {
          // Merge menu photos into featured and community photos
          // (This data will be used if needed in future)
        }
      } catch (error) {
        console.error('Error fetching menu photos:', error);
      }
    };

    fetchMenuPhotos();
  }, []);

  // Fetch photos from API
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoadingPhotos(true);
      try {
        // Fetch featured photos
        const featuredResponse = await fetch('http://localhost:3000/api/photos/featured');
        const featuredData = await featuredResponse.json();
        
        console.log('Featured photos response:', featuredData);
        
        if (featuredData.success) {
          setFeaturedPhotos(featuredData.data || []);
          console.log('Featured photos set:', featuredData.data);
        }

        // Fetch community photos
        const communityResponse = await fetch('http://localhost:3000/api/photos?limit=12');
        const communityData = await communityResponse.json();
        
        console.log('Community photos response:', communityData);
        
        if (communityData.success) {
          setCommunityPhotos(communityData.data || []);
          console.log('Community photos set:', communityData.data);
        }

        // Fetch liked photo ids for current user
        if (token) {
          try {
            const likedRes = await fetch('http://localhost:3000/api/photos/liked', { 
              headers: { 
                Accept: 'application/json', 
                Authorization: `Bearer ${token}` 
              }, 
              credentials: 'include' 
            });
            const likedJson = await likedRes.json();
            if (likedRes.ok && likedJson.success) {
              setLikedPhotos(likedJson.data || []);
            }
          } catch (e) {
            console.warn('Could not fetch liked photo ids:', e);
          }
        } else {
          setLikedPhotos([]);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
        setLikedPhotos([]);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchPhotos();
  }, [token]);

  // Filter stalls by selected category (within stalls at selected centre)
  const filteredStalls = selectedCategory === 'All'
    ? stallsAtCentre
    : stallsAtCentre.filter(stall =>
        stall.cuisine_types?.name?.toLowerCase() === selectedCategory.toLowerCase()
      );

  return (
    <div className="menu-container">
      <PromoBanner />

      {/* Hall of Flavor Fame - Most Liked Photos */}
      <div className="menu-section fame-section">
        <div className="section-header">
          <h2>🏆 Hall of Flavor Fame</h2>
          <p className="section-subtitle">Most loved dishes captured by our community</p>
        </div>
        
        {loadingPhotos ? (
          <div className="photos-loading">
            <div className="loading-spinner"></div>
            <p>Loading amazing food photos...</p>
          </div>
        ) : (
          <div className="featured-photos-grid">
            {filteredFeaturedPhotos.length > 0 ? (
              filteredFeaturedPhotos.map(photo => (
                <div 
                  key={photo.id} 
                  className="featured-photo-card"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <div className="photo-container">
                    <img src={photo.imageUrl} alt={photo.dishName} className="photo-image" />
                    <div className="photo-overlay">
                      <div className="likes-badge">
                        <span
                          className={`heart-icon ${likedPhotos.includes(photo.id) ? 'liked' : ''} ${!token ? 'disabled' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (token) toggleLike(photo.id);
                          }}
                          role="button"
                          tabIndex={0}
                          title={!token ? 'Login to like photos' : 'Like'}
                        >
                          ❤️
                        </span>
                        <span className="likes-count">{photo.likes}</span>
                      </div>
                    </div>
                  </div>
                  <div className="photo-info">
                    <h4 className="dish-name">{photo.dishName}</h4>
                    <p className="stall-name">{photo.stallName}</p>
                    <div className="photo-meta">
                      <span className="username">
                        @{photo.username}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-photos-message">
                <span className="no-photos-icon">📷</span>
                <h4>No featured photos found!</h4>
                <p>Try changing the filters or check back later for amazing food photos!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Food Snapshots - All User Photos */}
      <div className="menu-section community-section">
        <div className="section-header">
          <h2>📸 Community Food Snapshots</h2>
          <p className="section-subtitle">Real dishes, real stories from fellow food lovers</p>
        </div>
        
        {loadingPhotos ? (
          <div className="photos-loading">
            <div className="loading-spinner"></div>
            <p>Loading community photos...</p>
          </div>
        ) : (
          <div className="community-photos-grid">
            {filteredCommunityPhotos.length > 0 ? (
              filteredCommunityPhotos.map(photo => (
                <div 
                  key={photo.id} 
                  className="community-photo-card"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <div className="photo-container">
                    <img src={photo.imageUrl} alt={photo.dishName} className="photo-image" />
                  </div>
                  <div className="photo-info">
                    <h5 className="dish-name">{photo.dishName}</h5>
                    <p className="stall-name">{photo.stallName}</p>
                    <div className="photo-meta-row">
                      <span className="username">@{photo.username}</span>
                      <div 
                        className="like-button-container"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (token) toggleLike(photo.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && token) toggleLike(photo.id);
                        }}
                        role="button"
                        tabIndex={0}
                        title={!token ? 'Login to like photos' : (likedPhotos.includes(photo.id) ? 'Unlike' : 'Like')}
                      >
                        <span className={`heart-icon ${likedPhotos.includes(photo.id) ? 'liked' : ''} ${!token ? 'disabled' : ''}`}>
                          {likedPhotos.includes(photo.id) ? '❤️' : '🤍'}
                        </span>
                        <span className="likes-count">{photo.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-photos-message">
                <span className="no-photos-icon">📷</span>
                <h4>No community photos found!</h4>
                <p>Try changing the filters or check back later for amazing food photos!</p>
              </div>
            )}
          </div>
        )}
        
        {filteredCommunityPhotos.length > 0 && (
          <div className="view-more-container">
            <button 
              className="view-more-btn"
              onClick={() => window.location.href = '/community-photos'}
            >
              📱 View All Community Photos
            </button>
          </div>
        )}
      </div>
      
      <div className="popular-section">
        <div className="popular-header">
          <h2>🔥 Popular near you</h2>
          <p className="popular-subtitle">
            {selectedHawkerCenter
              ? `Stalls at ${selectedHawkerCenter.name}`
              : 'Discover trending stalls in your area'}
          </p>
          {selectedHawkerCenter && onClearHawkerCentre && (
            <button
              type="button"
              className="clear-centre-filter"
              onClick={onClearHawkerCentre}
              aria-label="Show all stalls"
            >
              Show all stalls
            </button>
          )}
        </div>

      <div className="category-filter">
        {categories.map(category => (
          <button 
            key={category} 
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="stalls-grid">
        {loadingStalls ? (
          <div className="stalls-loading">
            <div className="loading-spinner"></div>
            <p>Loading stalls...</p>
          </div>
        ) : filteredStalls.length > 0 ? (
          filteredStalls.map(stall => {
            const stallName = stall.name || stall.stall_name;
            const cuisineType = stall.cuisine_types?.name || 'Food';
            const stallIcon = getCuisineIcon(cuisineType);
            const stallImage = stall.image_url || getDefaultImage(cuisineType);
            const hawkerCentre = stall.hawker_centres?.name || '';
            
            return (
              <Link
                key={stall.id}
                to={`/menu?stall=${stall.id}`}
                className="stall-card"
              >
                <div className={`stall-image ${failedImages.has(stall.id) ? 'image-failed' : ''}`}>
                  {!failedImages.has(stall.id) ? (
                    <img 
                      src={stallImage} 
                      alt={stallName}
                      onError={() => handleImageError(stall.id)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="stall-image-placeholder">
                      <span className="placeholder-icon">{stallIcon}</span>
                    </div>
                  )}
                  <div className="stall-icon">{stallIcon}</div>
                  <div className="stall-image-overlay">
                    <div className="stall-name-badge">
                      <span className="badge-icon">{stallIcon}</span>
                      <span className="badge-name">{stallName}</span>
                    </div>
                    <div className="stall-rating-badge">
                      <span>⭐ {stall.rating || '4.5'}</span>
                    </div>
                  </div>
                </div>
                <div className="stall-content">
                  {/* Closure Badge */}
                  {stall.is_currently_closed !== undefined && (
                    <div style={{ marginBottom: '12px' }}>
                      <ClosureBadge
                        isClosed={stall.is_currently_closed}
                        closureInfo={stall.closure_info}
                        size="normal"
                      />
                    </div>
                  )}
                  
                  <p className="stall-description">{stall.description || `${cuisineType} cuisine`}</p>
                  <div className="stall-meta">
                    <span className="meta-item">
                      <span className="meta-icon">🍽️</span>
                      {cuisineType}
                    </span>
                    {hawkerCentre && (
                      <span className="meta-item">
                        <span className="meta-icon">📍</span>
                        {hawkerCentre}
                      </span>
                    )}
                  </div>
                  <button className="view-menu-btn">View Menu →</button>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="no-stalls-message">
            <span className="no-stalls-icon">🏪</span>
            <h4>No stalls found</h4>
            <p>Try selecting a different category or check back later!</p>
          </div>
        )}
      </div>
      </div>

      {/* Photo Modal */}
      <PhotoModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onLike={handleModalLike}
        isLiked={selectedPhoto ? likedPhotos.includes(selectedPhoto.id) : false}
        token={token}
      />
    </div>
  );
};

export default Menu;