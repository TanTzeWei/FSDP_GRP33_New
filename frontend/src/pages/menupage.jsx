import React, { useState, useEffect, useContext } from 'react';
import { ShoppingCart, Star, Clock, MapPin, Search, ImageOff } from 'lucide-react';
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from '../components/Header';
import { CartContext } from '../context/CartContext';
import ClosureBadge from '../components/ClosureBadge';
import './menupage.css';

const MenuPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { cartItems, addToCart, getTotalItems, getTotalPrice } = useContext(CartContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stallId = searchParams.get('stall');
  const [stallImageError, setStallImageError] = useState(false);
  const [itemImageErrors, setItemImageErrors] = useState({});
  const [activeSection, setActiveSection] = useState('menu');
  const [promos, setPromos] = useState({});
  
  const [stall, setStall] = useState({
    name: 'Loading...',
    rating: 0,
    reviews: 0,
    deliveryTime: '',
    distance: '',
    image: '',
    categories: [],
    is_currently_closed: false,
    closure_info: null
  });

  // Filter menu items by search term
  const filtered = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(menuItems.map(i => i.category))];

  const handleStallImageError = () => {
    setStallImageError(true);
  };

  const handleItemImageError = (itemId) => {
    setItemImageErrors(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  const calculateDiscountedPrice = (foodItemId, originalPrice) => {
    if (!promos[foodItemId]) return null;
    
    const promo = promos[foodItemId];
    let discountedPrice = originalPrice;
    
    if (promo.discount_type === 'percentage') {
      discountedPrice = originalPrice - (originalPrice * promo.discount_value / 100);
    } else if (promo.discount_type === 'fixed_amount') {
      discountedPrice = originalPrice - promo.discount_value;
    }
    
    return Math.max(0, discountedPrice);
  };

  // Fetch dishes from backend when component mounts or stallId changes
  useEffect(() => {
    const id = stallId ? parseInt(stallId) : null;
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ? import.meta.env.VITE_API_BASE : '';

    if (!id) {
      // No stall id in URL — clear data
      setMenuItems([]);
      setStall({
        name: 'Loading...',
        rating: 0,
        reviews: 0,
        deliveryTime: '',
        distance: '',
        image: '',
        categories: []
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    // Fetch stall details
    fetch(`${apiBase}/api/stalls/${id}`)
      .then(async res => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && data.success && data.data) {
          const s = data.data;
          setStall({
            name: s.stall_name || s.stallName || 'Stall',
            rating: s.rating || 0,
            reviews: s.total_reviews || 0,
            deliveryTime: s.opening_hours ? `${s.opening_hours} - ${s.closing_hours}` : '',
            distance: '',
            image: s.image_url || s.image || '',
            categories: s.specialties || [],
            is_currently_closed: s.is_currently_closed || false,
            closure_info: s.closure_info || null
          });
        }
      })
      .catch(err => {
        console.warn('Failed to fetch stall details:', err);
        setError('Failed to load stall details');
      });

    // Fetch dishes from stall
    fetch(`${apiBase}/api/stalls/${id}/dishes`)
      .then(async res => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.data)) {
          const formatted = data.data.map(d => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            price: d.price !== undefined ? parseFloat(d.price) : 0,
            image: d.image_url || d.image || '',
            category: d.category || 'Main Dishes',
            popular: d.is_popular === 1 || d.is_popular === true
          }));
          setMenuItems(formatted);
        } else {
          setMenuItems([]);
          setError('No dishes found for this stall');
        }
      })
      .catch(err => {
        console.error('Failed to fetch dishes:', err);
        setError('Failed to load menu');
        setMenuItems([]);
      })
      .finally(() => setLoading(false));

    // Fetch active promos for this stall
    fetch(`${apiBase}/api/promos/stall/${id}/active`)
      .then(async res => {
        if (!res.ok) return {};
        return res.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          // Create a map of food_item_id -> promo data
          const promoMap = {};
          data.data.forEach(promo => {
            promoMap[promo.food_item_id] = {
              discount_type: promo.discount_type,
              discount_value: promo.discount_value,
              promo_name: promo.promo_name
            };
          });
          setPromos(promoMap);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch promos:', err);
      });
  }, [stallId]);

  return (
    <main className="menu-page">

      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onCartClick={() => navigate('/cart')}
      />

      {/* STALL HEADER */}
      <section className="stall-header">
        <div className="stall-container">
          <div className="stall-image-wrapper">
            {stallImageError || !stall.image ? (
              <div className="stall-image-placeholder">
                <ImageOff className="placeholder-icon" />
                <span>No image available</span>
              </div>
            ) : (
              <>
                <img 
                  src={stall.image} 
                  className="stall-image"
                  onError={handleStallImageError}
                  alt={stall.name}
                />
                <span className="image-overlay" />
              </>
            )}
          </div>

          <div className="stall-info">
            {/* Closure Status Badge */}
            <div style={{ marginBottom: '15px' }}>
              <ClosureBadge
                isClosed={stall.is_currently_closed}
                closureInfo={stall.closure_info}
                showDetails={true}
                size="large"
              />
            </div>

            <h2 className="stall-name">{stall.name}</h2>

            <ul className="stall-details">
              <li className="stall-detail-item">
                <Star className="icon icon-star" />
                <span className="rating-value">{stall.rating}</span>
                ({stall.reviews})
              </li>

              <li className="stall-detail-item">
                <Clock className="icon" /> {stall.deliveryTime}
              </li>

              <li className="stall-detail-item">
                <MapPin className="icon" /> {stall.distance}
              </li>
            </ul>

            <ul className="category-tags">
              {stall.categories.map((c,i) => (
                <li className="category-tag" key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="search-section">
        <div className="search-container">
          <label className="search-label">
            <Search className="search-icon" />
            <input 
              className="search-input"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <section className="error-section">
          <div className="error-message">{error}</div>
        </section>
      )}

      {/* LOADING STATE */}
      {loading && (
        <section className="loading-section">
          <div className="loading-message">Loading menu items...</div>
        </section>
      )}

      {/* EMPTY STATE */}
      {!loading && menuItems.length === 0 && !error && (
        <section className="empty-section">
          <div className="empty-message">No menu items available for this stall.</div>
        </section>
      )}

      {/* MENU */}
      {!loading && menuItems.length > 0 && (
        <section className="menu-section">
          {categories.map(category => {
            const items = filtered.filter(i => i.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category} className="menu-category">
                <h3 className="category-title">{category}</h3>

                <ul className="menu-items">
                  {items.map(item => (
                    <li key={item.id} className="menu-item">
                      <div className="menu-item-content">

                        <div className="item-image-wrapper">
                          {itemImageErrors[item.id] || !item.image ? (
                            <div className="item-image-placeholder">
                              <ImageOff className="placeholder-icon-small" />
                            </div>
                          ) : (
                            <img 
                              src={item.image} 
                              className="item-image"
                              onError={() => handleItemImageError(item.id)}
                              alt={item.name}
                            />
                          )}
                        </div>

                        <div className="item-details">
                          <div className="item-header">
                            <h4 className="item-name">
                              {item.name}
                              {item.popular && (
                                <span className="popular-badge">Popular</span>
                              )}
                            </h4>
                          </div>

                          <p className="item-description">{item.description}</p>
                          <div className="item-price-container">
                            {promos[item.id] ? (
                              <>
                                <p className="item-price original-price">${item.price.toFixed(2)}</p>
                                <p className="item-price discounted-price">
                                  ${calculateDiscountedPrice(item.id, item.price).toFixed(2)}
                                </p>
                              </>
                            ) : (
                              <p className="item-price">${item.price.toFixed(2)}</p>
                            )}
                          </div>
                        </div>

                        <button 
                          className="add-button"
                          onClick={() => {
                            const itemToAdd = { ...item };
                            if (promos[item.id]) {
                              itemToAdd.price = calculateDiscountedPrice(item.id, item.price);
                              itemToAdd.originalPrice = item.price;
                            }
                            addToCart(itemToAdd);
                          }}
                          disabled={stall.is_currently_closed}
                          title={stall.is_currently_closed ? 'Stall is currently closed' : 'Add to cart'}
                        >
                          {stall.is_currently_closed ? 'Closed' : 'Add'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {/* CART FOOTER */}
      {cartItems && cartItems.length > 0 && (
        <footer className="cart-footer">
          <div className="cart-footer-container">
            <div className="cart-summary">
              <span className="cart-items-count">{getTotalItems()} items</span>
              <span className="cart-total-price">${getTotalPrice().toFixed(2)}</span>
              <button 
                className="view-cart-button"
                onClick={() => navigate('/cart')}
              >
                View Cart
              </button>
            </div>
          </div>
        </footer>
      )}

    </main>
  );
};

export default MenuPage;