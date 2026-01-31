import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoModal from '../components/PhotoModal';
import { AuthContext } from '../context/AuthContext';
import './communityPhotosPage.css';

const CommunityPhotosPage = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [communityPhotos, setCommunityPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [likedPhotos, setLikedPhotos] = useState([]);
  const [pendingLikes, setPendingLikes] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStallFilter, setSelectedStallFilter] = useState('All');
  const [selectedDishFilter, setSelectedDishFilter] = useState('All');

  // Fetch all community photos
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoadingPhotos(true);
      try {
        // Fetch all community photos (limit: 300)
        const communityResponse = await fetch('http://localhost:3000/api/photos?limit=300');
        const communityData = await communityResponse.json();
        
        if (communityData.success) {
          setCommunityPhotos(communityData.data || []);
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

  // Get unique stalls and dishes for filtering
  const stallFilterOptions = ['All', ...new Set(communityPhotos.map(p => p.stallName || 'Unknown'))];
  const filteredByStall = selectedStallFilter === 'All' 
    ? communityPhotos 
    : communityPhotos.filter(p => p.stallName === selectedStallFilter);
  
  const uniqueDishes = ['All', ...new Set(filteredByStall.map(p => p.dishName || 'Unknown Dish'))];

  // Filter photos by stall and dish
  const filteredPhotos = communityPhotos.filter(photo => {
    const stallMatch = selectedStallFilter === 'All' || photo.stallName === selectedStallFilter;
    const dishMatch = selectedDishFilter === 'All' || photo.dishName === selectedDishFilter;
    return stallMatch && dishMatch;
  });

  const toggleLike = async (photoId) => {
    if (!token) {
      alert('Please login to like photos');
      return;
    }

    if (pendingLikes[photoId]) return;
    setPendingLikes(prev => ({ ...prev, [photoId]: true }));

    const isLiked = likedPhotos.includes(photoId);
    const endpoint = isLiked ? 'unlike' : 'like';

    try {
      const response = await fetch(`http://localhost:3000/api/photos/${photoId}/${endpoint}`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        if (isLiked) {
          setLikedPhotos(prev => prev.filter(id => id !== photoId));
        } else {
          setLikedPhotos(prev => [...prev, photoId]);
        }

        setCommunityPhotos(prev =>
          prev.map(p =>
            p.id === photoId
              ? { ...p, likes: p.likes + (isLiked ? -1 : 1) }
              : p
          )
        );
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

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  return (
    <div className="community-photos-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h1>📸 Community Food Snapshots</h1>
        <p className="subtitle">Real dishes, real stories from fellow food lovers</p>
      </div>

      {/* Filters */}
      <div className="photos-filters-section">
        <div className="filter-group">
          <label className="filter-label">Filter by Stall:</label>
          <div className="filter-buttons-scroll">
            {stallFilterOptions.map(stall => (
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
            ))}
          </div>
        </div>

        {uniqueDishes.length > 1 && (
          <div className="filter-group">
            <label className="filter-label">Filter by Dish:</label>
            <div className="filter-buttons-scroll">
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

      {/* Photos Grid */}
      {loadingPhotos ? (
        <div className="photos-loading">
          <div className="loading-spinner"></div>
          <p>Loading all community photos...</p>
        </div>
      ) : (
        <>
          <div className="photos-count">
            Found {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
          </div>
          
          {filteredPhotos.length > 0 ? (
            <div className="all-photos-grid">
              {filteredPhotos.map(photo => (
                <div 
                  key={photo.id} 
                  className="photo-card-full"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <div className="photo-container">
                    <img src={photo.imageUrl} alt={photo.dishName} className="photo-image" />
                  </div>
                  <div className="photo-info">
                    <h4 className="dish-name">{photo.dishName}</h4>
                    <p className="stall-name">{photo.stallName}</p>
                    <div className="photo-meta-row">
                      <span className="username">@{photo.username}</span>
                      <div 
                        className="like-button-container"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (token) toggleLike(photo.id);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className={`heart-icon ${likedPhotos.includes(photo.id) ? 'liked' : ''} ${!token ? 'disabled' : ''}`}>
                          {likedPhotos.includes(photo.id) ? '❤️' : '🤍'}
                        </span>
                        <span className="likes-count">{photo.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-photos-message">
              <span className="no-photos-icon">📷</span>
              <h3>No photos found</h3>
              <p>Try adjusting your filters or check back later!</p>
            </div>
          )}
        </>
      )}

      {isModalOpen && selectedPhoto && (
        <PhotoModal 
          photo={selectedPhoto}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPhoto(null);
          }}
        />
      )}
    </div>
  );
};

export default CommunityPhotosPage;
