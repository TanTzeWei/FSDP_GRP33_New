import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationMap.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom map pin icon for hawker centres
const createHawkerIcon = (rating) => {
  const color = rating >= 4.0 ? '#00b14f' : rating >= 3.5 ? '#ffa500' : '#ff6b6b';
  
  return L.divIcon({
    className: 'custom-hawker-marker',
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">🏪</div>
      </div>
      <div style="
        position: absolute;
        top: 32px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">${rating}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// Custom user location icon - blue circle with white outer ring
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-location',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #007AFF;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        position: relative;
      ">
      </div>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid rgba(0, 122, 255, 0.3);
        background: rgba(0, 122, 255, 0.1);
        animation: pulse 2s infinite;
      ">
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Component to handle map events
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const LocationMap = ({ onHawkerSelect }) => {
  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [selectedHawker, setSelectedHawker] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 1.3521, lng: 103.8198 }); // Singapore center
  const [zoom, setZoom] = useState(11);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Mock hawker centre data (in real app, this would come from API)
  const mockHawkerData = [
    {
      id: 1,
      name: 'Maxwell Food Centre',
      description: 'One of Singapore\'s most famous hawker centres located in the heart of Chinatown',
      address: '1 Kadayanallur Street, Singapore 069184',
      latitude: 1.2800,
      longitude: 103.8455,
      rating: 4.3,
      totalReviews: 2847,
      openingHours: '08:00 AM - 02:00 AM',
      operatingDays: 'Monday - Sunday',
      totalStalls: 120,
      facilities: ['WiFi', 'Air Conditioning', 'Wheelchair Accessible'],
      cuisines: ['Chinese', 'Malay', 'Indian', 'Western'],
      distance: '0.8 km',
      priceRange: '$',
      popularDishes: ['Hainanese Chicken Rice', 'Char Kway Teow', 'Laksa'],
      // Manually entered sample menu for display on stall cards
      menu: [
        { name: 'Hainanese Chicken Rice', price: 5.00 },
        { name: 'Char Kway Teow', price: 4.50 },
        { name: 'Laksa (Regular)', price: 4.00 }
      ],
      phoneNumber: '+65 6225 8359'
    },
    {
      id: 2,
      name: 'Lau Pa Sat',
      description: 'Historic Victorian-era hawker centre in the Central Business District',
      address: '18 Raffles Quay, Singapore 048582',
      latitude: 1.2806,
      longitude: 103.8505,
      rating: 4.1,
      totalReviews: 1923,
      openingHours: '24 Hours',
      operatingDays: 'Monday - Sunday',
      totalStalls: 80,
      facilities: ['24/7 Opening', 'Historic Building', 'Tourist Attraction'],
      cuisines: ['Chinese', 'Malay', 'Indian', 'Seafood'],
      distance: '1.2 km',
      priceRange: '$$',
      popularDishes: ['Satay', 'Bak Kut Teh', 'Carrot Cake'],
      menu: [
        { name: 'Chicken Satay (5pcs)', price: 6.50 },
        { name: 'Bak Kut Teh (Small)', price: 5.50 }
      ],
      phoneNumber: '+65 6220 2138'
    },
    {
      id: 3,
      name: 'Newton Food Centre',
      description: 'Popular late-night hawker centre known for seafood and satay',
      address: '500 Clemenceau Avenue North, Singapore 229495',
      latitude: 1.3129,
      longitude: 103.8439,
      rating: 3.9,
      totalReviews: 1654,
      openingHours: '12:00 PM - 02:00 AM',
      operatingDays: 'Monday - Sunday',
      totalStalls: 86,
      facilities: ['Late Night', 'Outdoor Seating', 'Tourist Popular'],
      cuisines: ['Seafood', 'Chinese', 'Malay', 'Drinks'],
      distance: '2.1 km',
      priceRange: '$$',
      popularDishes: ['BBQ Seafood', 'Satay', 'Oyster Omelette'],
      menu: [
        { name: 'BBQ Prawns', price: 12.00 },
        { name: 'Oyster Omelette', price: 7.50 }
      ],
      phoneNumber: '+65 6235 1471'
    },
    {
      id: 4,
      name: 'Chinatown Complex',
      description: 'Large hawker centre with diverse food options in Chinatown',
      address: '335 Smith Street, Singapore 050335',
      latitude: 1.2820,
      longitude: 103.8430,
      rating: 4.2,
      totalReviews: 3421,
      openingHours: '06:00 AM - 02:00 AM',
      operatingDays: 'Monday - Sunday',
      totalStalls: 260,
      facilities: ['Large Complex', 'Wet Market', 'Multiple Levels'],
      cuisines: ['Chinese', 'Malay', 'Indian', 'Peranakan'],
      distance: '0.5 km',
      priceRange: '$',
      popularDishes: ['Soya Sauce Chicken', 'Fish Ball Noodles', 'Rojak'],
      menu: [
        { name: 'Soya Sauce Chicken Rice', price: 4.50 },
        { name: 'Fish Ball Noodles', price: 3.50 }
      ],
      phoneNumber: '+65 6534 6984'
    },
    {
      id: 5,
      name: 'Tekka Centre',
      description: 'Vibrant Little India hawker centre with authentic Indian cuisine',
      address: '665 Buffalo Road, Singapore 210665',
      latitude: 1.3067,
      longitude: 103.8526,
      rating: 4.0,
      totalReviews: 1876,
      openingHours: '06:00 AM - 10:00 PM',
      operatingDays: 'Monday - Sunday',
      totalStalls: 175,
      facilities: ['Cultural Hub', 'Wet Market', 'Indian Cuisine'],
      cuisines: ['Indian', 'Malay', 'Chinese', 'Drinks'],
      distance: '1.8 km',
      priceRange: '$',
      popularDishes: ['Biryani', 'Roti Prata', 'Fish Head Curry'],
      menu: [
        { name: 'Fish Head Curry', price: 8.50 },
        { name: 'Roti Prata', price: 2.50 }
      ],
      phoneNumber: '+65 6297 1059'
    },
    {
      id: 6,
      name: 'Tiong Bahru Market',
      description: 'Trendy heritage hawker centre in hip Tiong Bahru district',
      address: '30 Seng Poh Road, Singapore 160030',
      latitude: 1.2853,
      longitude: 103.8267,
      rating: 4.4,
      totalReviews: 987,
      openingHours: '06:00 AM - 03:00 PM',
      operatingDays: 'Monday - Sunday',
      totalStalls: 50,
      facilities: ['Heritage', 'Hipster Area', 'Morning Market'],
      cuisines: ['Chinese', 'Western', 'Drinks', 'Desserts'],
      distance: '1.5 km',
      priceRange: '$$',
      popularDishes: ['Lor Mee', 'Chwee Kueh', 'Kaya Toast'],
      menu: [
        { name: 'Lor Mee', price: 4.00 },
        { name: 'Chwee Kueh (3pcs)', price: 2.50 }
      ],
      phoneNumber: '+65 6270 7611'
    }
  ];

  useEffect(() => {
    // Fetch hawker centres from API
    const fetchHawkerCentres = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/hawker-centres');
        if (response.ok) {
          const data = await response.json();
          setHawkerCentres(data);
        } else {
          // Fallback to mock data if API fails
          setHawkerCentres(mockHawkerData);
        }
      } catch (error) {
        console.error('Error fetching hawker centres:', error);
        // Use mock data as fallback
        setHawkerCentres(mockHawkerData);
      } finally {
        setLoading(false);
      }
    };

    fetchHawkerCentres();
  }, []);

  // Get user's current location
  useEffect(() => {
    const getUserLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setLocationError(null);
            console.log('User location obtained:', latitude, longitude);
          },
          (error) => {
            console.error('Error getting user location:', error);
            setLocationError(error.message);
            // Fallback to Singapore center if location access is denied
            setUserLocation({ lat: 1.3521, lng: 103.8198 });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser');
        setLocationError('Geolocation not supported');
        // Fallback to Singapore center
        setUserLocation({ lat: 1.3521, lng: 103.8198 });
      }
    };

    getUserLocation();
  }, []);

  const handleMarkerClick = (hawker) => {
    setSelectedHawker(hawker);
    setMapCenter({ lat: hawker.latitude, lng: hawker.longitude });
    setZoom(16);
    // Don't open modal automatically - just highlight the hawker
  };

  const openDetailModal = (hawker) => {
    setSelectedHawker(hawker);
    setShowDetailModal(true);
  };

  const handleOrderHere = (hawker) => {
    // Update the header location text with selected hawker
    if (onHawkerSelect) {
      onHawkerSelect(hawker);
    }
    
    // Optional: You can add additional order logic here
    console.log(`Order placed at: ${hawker.name}`);
    
    // Show a brief confirmation or redirect to menu
    alert(`🛍️ Great choice! You're now ordering from ${hawker.name}`);
  };

  const closeDetails = () => {
    setShowDetailModal(false);
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('⭐');
    }
    return stars.join('');
  };

  const getMarkerColor = (rating) => {
    if (rating >= 4.0) return '#00b14f'; // Green for excellent
    if (rating >= 3.5) return '#ffa500'; // Orange for good
    return '#ff6b6b'; // Red for average
  };

  return (
    <div className="location-map-container">
      <div className="map-header">
        <h2>🏪 Hawker Centres Near You</h2>
        <p>Discover authentic local flavors across Singapore</p>
      </div>

      <div className="map-content">
        {loading ? (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading hawker centres...</p>
          </div>
        ) : (
          <>
            {/* Real Interactive Map using Leaflet */}
            <div className="map-area">
              <div className="real-map-container">
                <MapContainer
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={zoom}
                  style={{ height: '500px', width: '100%', borderRadius: '12px' }}
                  zoomControl={true}
                >
                  <MapController center={mapCenter} zoom={zoom} />
                  
                  {/* OpenStreetMap tiles - free and reliable */}
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* User Current Location Marker */}
                  {userLocation && (
                    <Marker
                      position={[userLocation.lat, userLocation.lng]}
                      icon={createUserLocationIcon()}
                    >
                      <Popup>
                        <div className="map-popup">
                          <h4>📍 Your Current Location</h4>
                          <p className="popup-address">
                            Lat: {userLocation.lat.toFixed(6)}<br/>
                            Lng: {userLocation.lng.toFixed(6)}
                          </p>
                          <div className="popup-info">
                            <span>🎯 You are here</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Hawker Centre Markers with Custom Pins */}
                  {hawkerCentres.map((hawker) => (
                    <Marker
                      key={hawker.id}
                      position={[hawker.latitude, hawker.longitude]}
                      icon={createHawkerIcon(hawker.rating)}
                      eventHandlers={{
                        click: () => handleMarkerClick(hawker)
                      }}
                    >
                      <Popup>
                        <div className="map-popup">
                          <h4>{hawker.name}</h4>
                          <div className="popup-rating">
                            <span>{getRatingStars(hawker.rating)} {hawker.rating}</span>
                          </div>
                          <p className="popup-address">{hawker.address}</p>
                          <div className="popup-info">
                            <span>🏪 {hawker.totalStalls} stalls</span>
                            <span>🕐 {hawker.openingHours}</span>
                          </div>
                          <button 
                            className="popup-order-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderHere(hawker);
                            }}
                          >
                            🛍️ Order Here
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Hawker List */}
              <div className="hawker-list">
                <h3>📍 Nearby Hawker Centres ({hawkerCentres.length})</h3>
                <div className="hawker-items">
                  {hawkerCentres.map((hawker) => (
                    <div 
                      key={hawker.id}
                      className={`hawker-item ${selectedHawker?.id === hawker.id ? 'selected' : ''}`}
                      onClick={() => handleMarkerClick(hawker)}
                    >
                      <div className="hawker-info">
                        <div className="hawker-header">
                          <h4>{hawker.name}</h4>
                          <div className="hawker-distance">{hawker.distance}</div>
                        </div>
                        
                        <div className="hawker-rating">
                          <span className="stars">{getRatingStars(hawker.rating)}</span>
                          <span className="rating-text">{hawker.rating} ({hawker.totalReviews} reviews)</span>
                        </div>

                        <div className="hawker-meta">
                          <span className="stalls">📊 {hawker.totalStalls} stalls</span>
                          <span className="price">{hawker.priceRange}</span>
                          <span className="hours">🕐 {hawker.openingHours}</span>
                        </div>

                        <div className="hawker-cuisines">
                          {hawker.cuisines.slice(0, 3).map((cuisine, idx) => (
                            <span key={idx} className="cuisine-tag">{cuisine}</span>
                          ))}
                          {hawker.cuisines.length > 3 && (
                            <span className="cuisine-more">+{hawker.cuisines.length - 3} more</span>
                          )}
                        </div>

                        {/* Manually-entered menu preview shown on the bottom of the stall card */}
                        {hawker.menu && hawker.menu.length > 0 && (
                          <div className="hawker-menu">
                            {hawker.menu.slice(0,3).map((m, idx) => (
                              <div key={idx} className="menu-item-chip">
                                <span className="menu-item-name">{m.name}</span>
                                <span className="menu-item-price">${m.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button 
                          className="hawker-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(hawker);
                          }}
                        >
                          View Details
                        </button>
                      </div>

                      <div className="hawker-arrow">
                        <span>👆</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hawker Details Modal */}
      {showDetailModal && selectedHawker && (
        <div className="hawker-details-overlay" onClick={closeDetails}>
          <div className="hawker-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="hawker-title">
                <h2>{selectedHawker.name}</h2>
                <button className="close-btn" onClick={closeDetails}>×</button>
              </div>
              
              <div className="hawker-rating-large">
                <span className="stars-large">{getRatingStars(selectedHawker.rating)}</span>
                <div className="rating-details">
                  <span className="rating-number">{selectedHawker.rating}</span>
                  <span className="review-count">({selectedHawker.totalReviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="modal-content">
              <div className="detail-section">
                <h3>📍 Location & Hours</h3>
                <p className="address">{selectedHawker.address}</p>
                <div className="hours-info">
                  <span>🕐 Open: {selectedHawker.openingHours}</span>
                  <span>📅 {selectedHawker.operatingDays}</span>
                </div>
                <div className="contact">
                  <span>📞 {selectedHawker.phoneNumber}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>🍽️ What to Expect</h3>
                <p className="description">{selectedHawker.description}</p>
                <div className="stats">
                  <span className="stat">📊 {selectedHawker.totalStalls} Stalls</span>
                  <span className="stat">💰 {selectedHawker.priceRange} Price Range</span>
                  <span className="stat">📍 {selectedHawker.distance} Away</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>🌟 Popular Dishes</h3>
                <div className="popular-dishes">
                  {selectedHawker.popularDishes.map((dish, idx) => (
                    <span key={idx} className="dish-tag">{dish}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>🍜 Cuisine Types</h3>
                <div className="cuisine-types">
                  {selectedHawker.cuisines.map((cuisine, idx) => (
                    <span key={idx} className="cuisine-badge">{cuisine}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>🏪 Facilities</h3>
                <div className="facilities">
                  {selectedHawker.facilities.map((facility, idx) => (
                    <span key={idx} className="facility-tag">✓ {facility}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="action-btn primary" onClick={() => alert('Getting directions...')}>
                🧭 Get Directions
              </button>
              <button className="action-btn secondary" onClick={() => alert('View menu...')}>
                📋 View Menu
              </button>
              <button className="action-btn secondary" onClick={() => alert('Call hawker centre...')}>
                📞 Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;