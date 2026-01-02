// components/Menu.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import PromoBanner from './PromoBanner';
import './Menu.css';
import { AuthContext } from '../context/AuthContext';

const Menu = () => {
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

  // Handle image load error
  const handleImageError = (stallId) => {
    setFailedImages(prev => new Set([...prev, stallId]));
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

  const stallItems = [
    {
      id: 1,
      name: "Ah Lim's Chinese Stall",
      description: "Authentic Chinese dishes • Wonton noodles, Char Siu Rice, Fried Rice",
      rating: "4.8",
      deliveryTime: "25-35 mins",
      distance: "1.2 km",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=350&fit=crop",
      category: "chinese",
      stallIcon: "🏮"
    },
    {
      id: 2,
      name: "Warung Pak Hasan",
      description: "Traditional Malay cuisine • Nasi Lemak, Rendang, Satay, Mee Goreng",
      rating: "4.6",
      deliveryTime: "20-30 mins", 
      distance: "0.8 km",
      image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&h=350&fit=crop",
      category: "malay",
      stallIcon: "🌙"
    },
    {
      id: 3,
      name: "Mumbai Spice Corner",
      description: "North & South Indian food • Biryani, Curry, Roti Prata, Tandoori",
      rating: "4.7",
      deliveryTime: "30-40 mins",
      distance: "1.5 km", 
      image: "https://images.unsplash.com/photo-1585937421612-232d3d67d529?w=500&h=350&fit=crop",
      category: "indian",
      stallIcon: "🇮🇳"
    },
    {
      id: 4,
      name: "Peranakan Kitchen",
      description: "Nyonya heritage cuisine • Laksa, Kueh, Ayam Buah Keluak",
      rating: "4.9",
      deliveryTime: "35-45 mins",
      distance: "2.1 km",
      image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&h=350&fit=crop", 
      category: "peranakan",
      stallIcon: "🏺"
    },
    {
      id: 5,
      name: "Western Grill House",
      description: "Western comfort food • Burgers, Steaks, Fish & Chips, Pasta",
      rating: "4.4",
      deliveryTime: "25-35 mins",
      distance: "1.8 km",
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&h=350&fit=crop",
      category: "western",
      stallIcon: "🍔"
    },
    {
      id: 6,
      name: "Fresh Drinks Bar",
      description: "Refreshing beverages • Fresh Juice, Bubble Tea, Coffee, Smoothies",
      rating: "4.5",
      deliveryTime: "15-25 mins",
      distance: "0.5 km",
      image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&h=350&fit=crop",
      category: "drinks",
      stallIcon: "🥤"
    }
  ];

  const categories = ["All", "Chinese", "Malay", "Indian", "Peranakan", "Western", "Drinks"];

  // Get stalls from database for filtering (with "All" option)
  const stallFilterOptions = ['All', ...dbStalls.map(s => s.name)];

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

  const filteredFeaturedPhotos = featuredPhotos.filter(photo => {
    const stallMatch = selectedStallFilter === 'All' || photo.stallName === selectedStallFilter;
    const dishMatch = selectedDishFilter === 'All' || photo.dishName === selectedDishFilter;
    return stallMatch && dishMatch;
  });

  // Update likes count for a photo across featured/community lists
  const updatePhotoLikes = (photoId, newCount) => {
    setFeaturedPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: newCount } : p));
    setCommunityPhotos(prev => prev.map(p => p.id === photoId ? { ...p, likes: newCount } : p));
  };

  const { token } = useContext(AuthContext);

  // Toggle like/unlike for a photo
  const toggleLike = async (photoId) => {
    const isLiked = likedPhotos.includes(photoId);
    // Prevent duplicate requests
    if (pendingLikes[photoId]) return;

    try {
      setPendingLikes(prev => ({ ...prev, [photoId]: true }));

      // Optimistic UI update
      if (!isLiked) {
        setLikedPhotos(prev => Array.from(new Set([...prev, photoId])));
        updatePhotoLikes(photoId, (featuredPhotos.find(p => p.id === photoId)?.likes || communityPhotos.find(p => p.id === photoId)?.likes || 0) + 1);
      } else {
        setLikedPhotos(prev => prev.filter(id => id !== photoId));
        updatePhotoLikes(photoId, Math.max(0, (featuredPhotos.find(p => p.id === photoId)?.likes || communityPhotos.find(p => p.id === photoId)?.likes || 1) - 1));
      }

      const method = isLiked ? 'DELETE' : 'POST';
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`http://localhost:3000/api/photos/${photoId}/like`, { method, headers, credentials: 'include' });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.data) {
        updatePhotoLikes(photoId, json.data.likesCount);
        // ensure likedPhotos matches server authoritative state
        setLikedPhotos(prev => isLiked ? prev.filter(id => id !== photoId) : Array.from(new Set([...prev, photoId])));
      } else {
        console.warn('Like/Unlike failed', res.status, json);
        // rollback optimistic update on failure
        if (!isLiked) {
          setLikedPhotos(prev => prev.filter(id => id !== photoId));
          // decrement rollback
          updatePhotoLikes(photoId, Math.max(0, (featuredPhotos.find(p => p.id === photoId)?.likes || communityPhotos.find(p => p.id === photoId)?.likes || 1) - 1));
        } else {
          setLikedPhotos(prev => Array.from(new Set([...prev, photoId])));
          updatePhotoLikes(photoId, (featuredPhotos.find(p => p.id === photoId)?.likes || communityPhotos.find(p => p.id === photoId)?.likes || 0) + 1);
        }
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

        // Fetch liked photo ids for current user (optional - will fallback to empty)
        try {
          if (token) {
            const likedRes = await fetch('http://localhost:3000/api/photos/liked', { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, credentials: 'include' });
            const likedJson = await likedRes.json();
            if (likedRes.ok && likedJson.success) {
              setLikedPhotos(likedJson.data || []);
            }
          } else {
            setLikedPhotos([]);
          }
        
        } catch (e) {
          console.warn('Could not fetch liked photo ids:', e);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
        // Set fallback mock data if API fails
        setFeaturedPhotos([
          { id: 1, imageUrl: "/api/placeholder/200/200", dishName: "Signature Laksa", stallName: "Peranakan Kitchen", likes: 247, username: "foodie_anna" },
          { id: 2, imageUrl: "/api/placeholder/200/200", dishName: "Char Siu Rice", stallName: "Ah Lim's Chinese Stall", likes: 189, username: "hungry_tom" },
          { id: 3, imageUrl: "/api/placeholder/200/200", dishName: "Rendang Beef", stallName: "Warung Pak Hasan", likes: 203, username: "spice_lover" },
          { id: 4, imageUrl: "/api/placeholder/200/200", dishName: "Masala Dosa", stallName: "Mumbai Spice Corner", likes: 156, username: "curry_king" }
        ]);
        setCommunityPhotos([
          { id: 5, imageUrl: "/api/placeholder/150/150", dishName: "Wonton Noodles", stallName: "Ah Lim's Chinese Stall", likes: 42, username: "noodle_ninja" },
          { id: 6, imageUrl: "/api/placeholder/150/150", dishName: "Nasi Lemak", stallName: "Warung Pak Hasan", likes: 38, username: "coconut_rice" },
          { id: 7, imageUrl: "/api/placeholder/150/150", dishName: "Fish & Chips", stallName: "Western Grill House", likes: 31, username: "crispy_fish" },
          { id: 8, imageUrl: "/api/placeholder/150/150", dishName: "Bubble Tea", stallName: "Fresh Drinks Bar", likes: 67, username: "boba_boss" }
        ]);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchPhotos();
  }, []);



  const filteredStalls = selectedCategory === 'All' 
    ? stallItems 
    : stallItems.filter(stall => stall.category === selectedCategory.toLowerCase());

  return (
    <div className="menu-container">
      <PromoBanner />

      {/* Hall of Flavor Fame - Most Liked Photos */}
      <div className="menu-section fame-section">
        <div className="section-header">
          <h2>🏆 Hall of Flavor Fame</h2>
          <p className="section-subtitle">Most loved dishes captured by our community</p>
        </div>

        {/* Stall and Dish Filters */}
        <div className="photo-filters">
          <div className="filter-group">
            <label className="filter-label">Filter by Stall:</label>
            <div className="filter-buttons">
              {loadingStalls ? (
                <span className="filter-loading">Loading stalls...</span>
              ) : stallFilterOptions.length > 1 ? (
                stallFilterOptions.map(stall => (
                  <button
                    key={stall}
                    className={`filter-btn stall-filter-btn ${selectedStallFilter === stall ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedStallFilter(stall);
                      setSelectedDishFilter('All');
                    }}
                  >
                    {stall}
                  </button>
                ))
              ) : (
                <span className="filter-empty">No stalls available</span>
              )}
            </div>
          </div>

          {uniqueDishes.length > 1 && (
              <div className="filter-group">
                <label className="filter-label">Filter by Dish:</label>
                <div className="filter-buttons">
                  {uniqueDishes.map(dish => (
                    <button
                      key={dish}
                      className={`filter-btn dish-filter-btn ${selectedDishFilter === dish ? 'active' : ''}`}
                      onClick={() => setSelectedDishFilter(dish)}
                    >
                      {dish}
                    </button>
                  ))}
                </div>
              </div>
          )}
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
                <div key={photo.id} className="featured-photo-card">
                  <div className="photo-container">
                    <img src={photo.imageUrl} alt={photo.dishName} className="photo-image" />
                    <div className="photo-overlay">
                      <div className="likes-badge">
                        <span
                          className={`heart-icon ${likedPhotos.includes(photo.id) ? 'liked' : ''} ${!token ? 'disabled' : ''}`}
                          onClick={() => token ? toggleLike(photo.id) : null}
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
                <div key={photo.id} className="community-photo-card">
                  <div className="photo-container">
                    <img src={photo.imageUrl} alt={photo.dishName} className="photo-image" />
                    <div className="photo-overlay">
                      <div className="likes-badge small">
                        <span
                          className={`heart-icon ${likedPhotos.includes(photo.id) ? 'liked' : ''} ${!token ? 'disabled' : ''}`}
                          onClick={() => token ? toggleLike(photo.id) : null}
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
                    <h5 className="dish-name">{photo.dishName}</h5>
                    <p className="stall-name">{photo.stallName}</p>
                    <span className="username">@{photo.username}</span>
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
            <button className="view-more-btn">
              📱 View All Community Photos
            </button>
          </div>
        )}
      </div>
      
      <div className="menu-section">
        <h2>Popular near you</h2>

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
        {filteredStalls.map(stall => (
          <Link
            key={stall.id}
            to={`/menu?stall=${stall.id}`}
            className="stall-card"
          >
            <div className={`stall-image ${failedImages.has(stall.id) ? 'image-failed' : ''}`}>
              {!failedImages.has(stall.id) ? (
                <img 
                  src={stall.image} 
                  alt={stall.name}
                  onError={() => handleImageError(stall.id)}
                  loading="lazy"
                />
              ) : (
                <div className="stall-image-placeholder">
                  <span className="placeholder-icon">{stall.stallIcon}</span>
                </div>
              )}
              <div className="stall-icon">{stall.stallIcon}</div>
              <div className="stall-image-overlay">
                <div className="stall-name-badge">
                  <span className="badge-icon">{stall.stallIcon}</span>
                  <span className="badge-name">{stall.name}</span>
                </div>
                <div className="stall-rating-badge">
                  <span>⭐ {stall.rating}</span>
                </div>
              </div>
            </div>
            <div className="stall-content">
              <p className="stall-description">{stall.description}</p>
              <div className="stall-meta">
                <span className="meta-item">
                  <span className="meta-icon">🕐</span>
                  {stall.deliveryTime}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">📍</span>
                  {stall.distance}
                </span>
              </div>
              <button className="view-menu-btn">View Menu →</button>
            </div>
          </Link>
        ))}
      </div>
      </div>


    </div>
  );
};

export default Menu;