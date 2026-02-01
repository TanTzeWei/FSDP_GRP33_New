import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ShareButton from './ShareButton';
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

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(1);
};

// Component to handle map events and fix size issues
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  // Fix for map not loading tiles when initially hidden or container resizes
  useEffect(() => {
    // Small delay to ensure container is fully rendered
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    // Also handle window resize events
    const handleResize = () => {
      map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  
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
  const [selectedHawkerStalls, setSelectedHawkerStalls] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStalls, setLoadingStalls] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 1.3521, lng: 103.8198 }); // Singapore center
  const [zoom, setZoom] = useState(11);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [mapKey, setMapKey] = useState(Date.now()); // Key to force map remount
  const navigate = useNavigate();
  
  // Table reservation states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [tables, setTables] = useState([]);
  const [tableReservations, setTableReservations] = useState({});
  const [loadingTables, setLoadingTables] = useState(false);
  const [reservationError, setReservationError] = useState('');
  const [reservationSuccess, setReservationSuccess] = useState('');

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
          // Handle both array response and object with data property
          let hawkerData = Array.isArray(data) ? data : (data.data || data.hawkerCentres || []);
          
          if (hawkerData.length > 0) {
            // Merge API data with mock data to fill in missing stall counts
            const mockDataMap = mockHawkerData.reduce((map, item) => {
              map[item.id] = item;
              return map;
            }, {});
            
            hawkerData = hawkerData.map(hawker => {
              const mockData = mockDataMap[hawker.id];
              // If API data has no stalls but mock has, use mock's stall count
              if ((hawker.active_stalls === 0 || hawker.active_stalls === undefined || hawker.totalStalls === 0 || hawker.totalStalls === undefined) && mockData && mockData.totalStalls > 0) {
                return {
                  ...hawker,
                  totalStalls: mockData.totalStalls,
                  active_stalls: mockData.totalStalls
                };
              }
              return hawker;
            });
            
            setHawkerCentres(hawkerData);
          } else {
            // Fallback to mock data if API returns empty
            setHawkerCentres(mockHawkerData);
          }
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
        // Force map remount after data is loaded to ensure tiles render
        setTimeout(() => {
          setMapKey(Date.now());
        }, 100);
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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update occupancy status every 10 seconds when modal is open
  useEffect(() => {
    if (!showReservationModal || tables.length === 0) return;

    const updateOccupancy = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      console.log('🕐 Checking occupancy at:', currentTime);

      // Use the current tableReservations state by reading from the callback
      setTableReservations(prevReservations => {
        const updatedReservations = {};
        
        Object.keys(prevReservations).forEach(tableId => {
          const resData = prevReservations[tableId];
          if (resData && resData.reservations && Array.isArray(resData.reservations)) {
            const wasOccupied = resData.isOccupied;
            
            // Check if any reservation covers the current time
            const isCurrentlyOccupied = resData.reservations.some(res => {
              const occupied = res.status !== 'Cancelled' && res.start_time <= currentTime && res.end_time > currentTime;
              if (occupied) {
                console.log(`✓ Table ${tableId}: Reservation from ${res.start_time} to ${res.end_time} covers ${currentTime}`);
              }
              return occupied;
            });
            
            if (wasOccupied !== isCurrentlyOccupied) {
              console.log(`🔄 Table ${tableId}: Status changed to ${isCurrentlyOccupied ? 'Occupied' : 'Available'}`);
            }
            
            // Create new object to trigger React update
            updatedReservations[tableId] = {
              ...resData,
              isOccupied: isCurrentlyOccupied
            };
          } else {
            updatedReservations[tableId] = resData;
          }
        });

        console.log('📊 Updated occupancy:', updatedReservations);
        return updatedReservations;
      });
    };

    // Check immediately
    updateOccupancy();

    // Then check every 10 seconds (10000 ms)
    const interval = setInterval(updateOccupancy, 10000);

    return () => clearInterval(interval);
  }, [showReservationModal, tables]);

  const handleMarkerClick = (hawker) => {
    setSelectedHawker(hawker);
    setMapCenter({ lat: hawker.latitude, lng: hawker.longitude });
    setZoom(16);
    // Don't open modal automatically - just highlight the hawker
  };

  const openDetailModal = async (hawker) => {
    setSelectedHawker(hawker);
    setShowDetailModal(true);
    setLoadingStalls(true);
    setSelectedHawkerStalls([]);
    
    // Fetch detailed hawker centre information including stalls
    try {
      const response = await fetch(`http://localhost:3000/api/hawker-centres/${hawker.id}`);
      if (response.ok) {
        const data = await response.json();
        const hawkerData = data.data || data;
        setSelectedHawker(hawkerData);
        // Extract stalls from the response
        if (hawkerData.stalls && Array.isArray(hawkerData.stalls)) {
          setSelectedHawkerStalls(hawkerData.stalls);
        }
      } else {
        console.error('Failed to fetch hawker centre details');
      }
    } catch (error) {
      console.error('Error fetching hawker centre details:', error);
    } finally {
      setLoadingStalls(false);
    }
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

  const openReservationModal = async () => {
    setShowReservationModal(true);
    setSelectedTable(null);
    setReservationDate('');
    setReservationTime('');
    setReservationError('');
    setReservationSuccess('');
    setLoadingTables(true);
    
    // Fetch tables from database
    try {
      const response = await fetch(`http://localhost:3000/api/hawker-centres/${selectedHawker.id}/tables`);
      if (response.ok) {
        const data = await response.json();
        const tablesData = Array.isArray(data) ? data : (data.data || []);
        setTables(tablesData);
        
        // Fetch today's reservations for all tables to check current occupancy
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Fetch reservations for each table
        const allReservations = {};
        for (const table of tablesData) {
          try {
            const resResponse = await fetch(`http://localhost:3000/api/tables/${table.id}/reservations?date=${today}`);
            if (resResponse.ok) {
              const resData = await resResponse.json();
              const reservations = Array.isArray(resData) ? resData : (resData.data || []);
              
              // Check if any reservation covers the current time
              const isCurrentlyOccupied = reservations.some(res => {
                return res.status !== 'Cancelled' && res.start_time <= currentTime && res.end_time > currentTime;
              });
              
              allReservations[table.id] = {
                reservations: reservations,
                isOccupied: isCurrentlyOccupied
              };
            }
          } catch (error) {
            console.error(`Error fetching reservations for table ${table.id}:`, error);
          }
        }
        
        setTableReservations(allReservations);
      } else {
        setReservationError('Failed to load tables');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setReservationError('Error loading tables');
    } finally {
      setLoadingTables(false);
    }
  };

  const closeReservationModal = () => {
    setShowReservationModal(false);
    setSelectedTable(null);
    setReservationError('');
    setReservationSuccess('');
  };

  const handleTableSelect = async (table) => {
    if (table.status === 'Available') {
      setSelectedTable(table);
      
      // Fetch existing reservations for this table on the selected date
      if (reservationDate) {
        try {
          const response = await fetch(`http://localhost:3000/api/tables/${table.id}/reservations?date=${reservationDate}`);
          if (response.ok) {
            const data = await response.json();
            setTableReservations(prev => ({
              ...prev,
              [table.id]: Array.isArray(data) ? data : (data.data || [])
            }));
          }
        } catch (error) {
          console.error('Error fetching table reservations:', error);
        }
      }
    }
  };

  const handleReservationSubmit = async () => {
    if (!selectedTable || !reservationDate || !reservationTime) {
      setReservationError('Please select a table, date, and time for your reservation.');
      return;
    }
    
    // Calculate end time (1 hour after start time)
    const [hours, minutes] = reservationTime.split(':');
    const endHours = String(parseInt(hours) + 1).padStart(2, '0');
    const endTime = `${endHours}:${minutes}`;
    
    // Get token from localStorage - check both possible locations
    let token = localStorage.getItem('token');
    if (!token) {
      const authData = localStorage.getItem('authUser');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          token = parsed.token;
        } catch (e) {
          // ignore parse error
        }
      }
    }
    
    if (!token) {
      setReservationError('Please log in to make a reservation');
      return;
    }
    
    try {
      const requestBody = {
        hawkerCentreId: selectedHawker.id,
        seatId: selectedTable.id,
        reservationDate: reservationDate,
        startTime: reservationTime,
        endTime: endTime,
        specialRequests: ''
      };
      
      console.log('Creating reservation with:', requestBody);
      console.log('Token present:', !!token);
      
      const response = await fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      console.log('Reservation response:', { status: response.status, data });
      
      if (response.ok) {
        setReservationSuccess(`🎉 Reservation Confirmed!\n\nTable: ${selectedTable.table_code}\nCapacity: ${selectedTable.capacity} seats\nZone: ${selectedTable.zone}\nDate: ${reservationDate}\nTime: ${reservationTime} - ${endTime}`);
        setTimeout(() => {
          closeReservationModal();
        }, 2000);
      } else {
        setReservationError(data.error || data.message || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      setReservationError('Error creating reservation. Please try again.');
    }
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#00b14f';
      case 'Reserved': return '#ffa500';
      case 'Occupied': return '#ff6b6b';
      case 'Out of Service': return '#999';
      default: return '#ccc';
    }
  };

  const getTableStatusIcon = (status) => {
    switch (status) {
      case 'Available': return '✓';
      case 'Reserved': return '📅';
      case 'Occupied': return '👥';
      case 'Out of Service': return '🔧';
      default: return '?';
    }
  };

  const getTableReservations = (tableId) => {
    return tableReservations[tableId] || [];
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setReservationDate(newDate);
    
    // Fetch reservations for selected table on new date
    if (selectedTable) {
      try {
        const response = await fetch(`http://localhost:3000/api/tables/${selectedTable.id}/reservations?date=${newDate}`);
        if (response.ok) {
          const data = await response.json();
          setTableReservations(prev => ({
            ...prev,
            [selectedTable.id]: Array.isArray(data) ? data : (data.data || [])
          }));
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    }
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
                  key={mapKey}
                  center={[mapCenter.lat, mapCenter.lng]}
                  zoom={zoom}
                  style={{ height: '500px', width: '100%', borderRadius: '12px' }}
                  zoomControl={true}
                  whenReady={(map) => {
                    // Force invalidateSize after map is ready
                    setTimeout(() => {
                      map.target.invalidateSize();
                    }, 250);
                  }}
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
                            <span>{getRatingStars(hawker.rating || 0)} {hawker.rating || 0}</span>
                          </div>
                          <p className="popup-address">{hawker.address}</p>
                          <div className="popup-info">
                            <span>🏪 {hawker.totalStalls || hawker.active_stalls || 0} stalls</span>
                            <span>🕐 {hawker.openingHours || hawker.opening_hours || 'N/A'}</span>
                          </div>
                          <Link 
                            to={`/centres/${hawker.id}`}
                            className="popup-details-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📋 View Details
                          </Link>
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
                <div className="hawker-list-header">
                  <h3>📍 Nearby Hawker Centres ({hawkerCentres.length})</h3>
                </div>
                <div className="hawker-items">
                  {hawkerCentres.map((hawker) => {
                    // Handle both API and mock data field names
                    const cuisines = hawker.cuisines || hawker.available_cuisines || [];
                    const cuisineList = Array.isArray(cuisines) ? cuisines : (typeof cuisines === 'string' ? cuisines.split(', ').filter(c => c) : []);
                    const totalStalls = hawker.totalStalls || hawker.total_stalls || hawker.active_stalls || hawker.num_stalls || hawker.stall_count || hawker.stalls?.length || 0;
                    const totalReviews = hawker.totalReviews || hawker.total_reviews || 0;
                    const distance = userLocation ? `${calculateDistance(userLocation.lat, userLocation.lng, hawker.latitude, hawker.longitude).toFixed(1)} km` : 'N/A';
                    
                    return (
                    <div 
                      key={hawker.id}
                      className={`hawker-card ${selectedHawker?.id === hawker.id ? 'selected' : ''}`}
                      onClick={() => handleMarkerClick(hawker)}
                    >
                      <div className="hawker-card-header">
                        <h4>{hawker.name}</h4>
                        <div className="hawker-distance-badge">{distance}</div>
                      </div>
                      
                      <div className="hawker-card-rating">
                        <span className="stars">{getRatingStars(hawker.rating || 0)}</span>
                        <span className="rating-number">{hawker.rating || 0}</span>
                        <span className="rating-reviews">({totalReviews} reviews)</span>
                      </div>

                      <div className="hawker-card-meta">
                        <div className="meta-item">
                          <span className="meta-icon">📊</span>
                          <span className="meta-text">{totalStalls} stalls</span>
                        </div>
                      </div>

                      {cuisineList.length > 0 && (
                      <div className="hawker-cuisines">
                        {cuisineList.slice(0, 3).map((cuisine, idx) => (
                          <span key={idx} className="cuisine-tag">{cuisine}</span>
                        ))}
                        {cuisineList.length > 3 && (
                          <span className="cuisine-more">+{cuisineList.length - 3} more</span>
                        )}
                      </div>
                      )}

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
                        className="hawker-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(hawker);
                        }}
                      >
                        View Details <span className="hawker-arrow">→</span>
                      </button>
                    </div>
                  );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hawker Details Modal - Grab-inspired layout */}
      {showDetailModal && selectedHawker && (
        <div className="hawker-details-overlay" onClick={closeDetails}>
          <div className="modal-wrapper" onClick={e => e.stopPropagation()}>
            <button type="button" className="modal-close-outside" onClick={closeDetails} aria-label="Close">×</button>
            <div className="hawker-details-modal">
            <header className="modal-header">
              <div className="modal-header-top">
                <h1 className="hawker-detail-title">{selectedHawker.name}</h1>
                <div className="modal-header-actions">
                  <ShareButton
                    type="centre"
                    id={selectedHawker.id}
                    meta={{ name: selectedHawker.name, rating: selectedHawker.rating, description: selectedHawker.description, image: selectedHawker.image_url }}
                    variant="button"
                  />
                </div>
              </div>
              <div className="hawker-rating-block">
                <span className="stars-large" aria-hidden="true">{getRatingStars(selectedHawker.rating || 0)}</span>
                <span className="rating-number">{selectedHawker.rating ?? '—'}</span>
                <span className="review-count">({selectedHawker.totalReviews ?? selectedHawker.total_reviews ?? 0} reviews)</span>
              </div>
            </header>

            <div className="modal-content">
              <section className="detail-section">
                <h2 className="detail-section-title">Location</h2>
                <p className="address">{selectedHawker.address}</p>
              </section>

              <section className="detail-section">
                <h2 className="detail-section-title">What to Expect</h2>
                {selectedHawker.description && (
                  <p className="description">{selectedHawker.description}</p>
                )}
                <div className="stats-row">
                  <span className="stat-pill">{selectedHawker.totalStalls ?? selectedHawker.active_stalls ?? selectedHawker.total_stalls ?? 0} Stalls</span>
                  {selectedHawker.distance && (
                    <span className="stat-pill">{selectedHawker.distance} away</span>
                  )}
                </div>
              </section>

              {/* Stalls Section */}
              <section className="detail-section stalls-section">
                <h2 className="detail-section-title">Stalls ({selectedHawkerStalls.length})</h2>
                {loadingStalls ? (
                  <div className="loading-stalls">
                    <p>Loading stalls...</p>
                  </div>
                ) : selectedHawkerStalls.length > 0 ? (
                  <div className="stalls-list">
                    {selectedHawkerStalls.map((stall) => (
                      <div key={stall.id} className="stall-item">
                        <div className="stall-header">
                          <Link to={`/stalls/${stall.id}`} className="stall-link">
                            {stall.stall_name || stall.name}
                          </Link>
                          {stall.rating && (
                            <div className="stall-rating">
                              <span>{getRatingStars(stall.rating)} {stall.rating}</span>
                            </div>
                          )}
                        </div>
                        {stall.description && (
                          <p className="stall-description">{stall.description}</p>
                        )}
                        <div className="stall-meta">
                          {stall.cuisine_types && (
                            <span className="stall-cuisine">
                              🍜 {stall.cuisine_types.name || stall.cuisine_type}
                            </span>
                          )}
                          {stall.stall_number && (
                            <span className="stall-number">📍 Stall {stall.stall_number}</span>
                          )}
                        </div>
                        {stall.specialties && Array.isArray(stall.specialties) && stall.specialties.length > 0 && (
                          <div className="stall-specialties">
                            <strong>Specialties: </strong>
                            {stall.specialties.map((specialty, idx) => (
                              <span key={idx} className="specialty-tag">{specialty}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-stalls">No stalls available at this hawker centre.</p>
                )}
              </section>

              {selectedHawker.popularDishes && selectedHawker.popularDishes.length > 0 && (
                <section className="detail-section">
                  <h2 className="detail-section-title">Popular Dishes</h2>
                  <div className="tag-list">
                    {selectedHawker.popularDishes.map((dish, idx) => (
                      <span key={idx} className="tag tag-green">{dish}</span>
                    ))}
                  </div>
                </section>
              )}

              {(selectedHawker.cuisines || selectedHawker.available_cuisines) && (
                <section className="detail-section">
                  <h2 className="detail-section-title">Cuisine Types</h2>
                  <div className="tag-list">
                    {(Array.isArray(selectedHawker.cuisines) ? selectedHawker.cuisines : 
                      Array.isArray(selectedHawker.available_cuisines) ? selectedHawker.available_cuisines :
                      typeof selectedHawker.available_cuisines === 'string' ? selectedHawker.available_cuisines.split(', ') : []
                    ).map((cuisine, idx) => (
                      <span key={idx} className="tag tag-solid">{cuisine}</span>
                    ))}
                  </div>
                </section>
              )}

              {selectedHawker.facilities && Array.isArray(selectedHawker.facilities) && selectedHawker.facilities.length > 0 && (
                <section className="detail-section">
                  <h2 className="detail-section-title">Facilities</h2>
                  <div className="tag-list">
                    {selectedHawker.facilities.map((facility, idx) => (
                      <span key={idx} className="tag tag-outline">✓ {facility}</span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className="modal-actions">
              <button type="button" className="action-btn action-btn-primary" onClick={() => alert('Getting directions...')}>
                <span className="action-icon" aria-hidden="true">🧭</span>
                Get Directions
              </button>
              <button 
                type="button"
                className="action-btn action-btn-secondary" 
                onClick={() => {
                  if (onHawkerSelect) {
                    onHawkerSelect(selectedHawker);
                  }
                  navigate('/', { state: { activeSection: 'menu' } });
                  closeDetails();
                }}
              >
                <span className="action-icon" aria-hidden="true">📋</span>
                View Menu
              </button>
              <button type="button" className="action-btn action-btn-secondary action-btn-reserve" onClick={openReservationModal}>
                <span className="action-icon" aria-hidden="true">🪑</span>
                Reserve Table
              </button>
            </footer>
            </div>
          </div>
        </div>
      )}

      {/* Table Reservation Modal - Grab-inspired */}
      {showReservationModal && selectedHawker && (
        <div className="reservation-overlay" onClick={closeReservationModal}>
          <div className="reservation-modal" onClick={e => e.stopPropagation()}>
            <header className="reservation-header">
              <div className="reservation-header-content">
                <h1 className="reservation-modal-title">Reserve a Table</h1>
                <p className="reservation-venue">{selectedHawker.name}</p>
              </div>
              <button type="button" className="reservation-close-btn" onClick={closeReservationModal} aria-label="Close">×</button>
            </header>

            <div className="reservation-body">
              {/* Messages */}
              {reservationError && (
                <div className="res-alert res-alert-error">{reservationError}</div>
              )}
              {reservationSuccess && (
                <div className="res-alert res-alert-success">{reservationSuccess}</div>
              )}

              {/* Date & Time Picker */}
              <section className="res-section">
                <h2 className="res-section-title">When</h2>
                <div className="res-datetime-row">
                  <label className="res-input-group">
                    <span className="res-input-label">Date</span>
                    <input 
                      type="date" 
                      className="res-input"
                      value={reservationDate}
                      onChange={handleDateChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </label>
                  <label className="res-input-group">
                    <span className="res-input-label">Time</span>
                    <input 
                      type="time"
                      className="res-input"
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              {/* Table Selection */}
              <section className="res-section">
                <h2 className="res-section-title">Select a Table</h2>
                {loadingTables ? (
                  <div className="res-loading">
                    <div className="res-spinner"></div>
                    <span>Loading tables...</span>
                  </div>
                ) : tables.length > 0 ? (
                  <div className="res-zones">
                    {Array.from(new Set(tables.map(t => t.zone))).sort().map(zone => (
                      <div key={zone} className="res-zone">
                        <h3 className="res-zone-label">{zone || 'General'}</h3>
                        <div className="res-table-grid">
                          {tables
                            .filter(table => table.zone === zone)
                            .map(table => {
                              const tableStatus = tableReservations[table.id]?.isOccupied ? 'Occupied' : table.status;
                              const isAvailable = tableStatus === 'Available';
                              const isSelected = selectedTable?.id === table.id;
                              return (
                                <button 
                                  type="button"
                                  key={table.id}
                                  className={`res-table-card ${isAvailable ? '' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleTableSelect(table)}
                                  disabled={!isAvailable}
                                >
                                  <span className="res-table-code">{table.table_code}</span>
                                  <span className="res-table-seats">{table.capacity} seats</span>
                                  {table.is_shared && <span className="res-table-shared">Shared</span>}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="res-empty">No tables available for this hawker centre.</p>
                )}
              </section>

              {/* Selection Summary */}
              {selectedTable && (
                <section className="res-section res-summary">
                  <h2 className="res-section-title">Your Selection</h2>
                  <div className="res-summary-card">
                    <div className="res-summary-row">
                      <span>Table</span>
                      <strong>{selectedTable.table_code}</strong>
                    </div>
                    <div className="res-summary-row">
                      <span>Seats</span>
                      <strong>{selectedTable.capacity}</strong>
                    </div>
                    <div className="res-summary-row">
                      <span>Zone</span>
                      <strong>{selectedTable.zone}</strong>
                    </div>
                    <div className="res-summary-row">
                      <span>Type</span>
                      <strong>{selectedTable.is_shared ? 'Shared' : 'Private'}</strong>
                    </div>
                  </div>
                  {getTableReservations(selectedTable.id).length > 0 && (
                    <div className="res-existing">
                      <p className="res-existing-label">Existing reservations on {reservationDate}:</p>
                      {getTableReservations(selectedTable.id).map(res => (
                        <div key={res.id} className="res-existing-slot">
                          <span>{res.start_time} – {res.end_time}</span>
                          <span className={`res-slot-status res-slot-${res.status.toLowerCase()}`}>{res.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            <footer className="reservation-footer">
              <button type="button" className="res-btn res-btn-cancel" onClick={closeReservationModal}>
                Cancel
              </button>
              <button 
                type="button"
                className="res-btn res-btn-confirm" 
                onClick={handleReservationSubmit}
                disabled={!selectedTable || !reservationDate || !reservationTime}
              >
                Confirm Reservation
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;