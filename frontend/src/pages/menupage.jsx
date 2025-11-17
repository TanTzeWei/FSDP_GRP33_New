import React, { useState } from 'react';
import { ShoppingCart, Star, Clock, MapPin, Search } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import './menupage.css';

const MenuPage = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const stall = {
    name: "Ah Seng Chicken Rice",
    rating: 4.5,
    reviews: 328,
    deliveryTime: "20–30 min",
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop",
    categories: ["Chicken Rice", "Local Delights", "Halal"]
  };

  const menuItems = [
    { id: 1, name: "Roasted Chicken Rice", description: "Tender roasted chicken served with fragrant rice.", price: 4.50, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop", category: "Main Dishes", popular: true },
    { id: 2, name: "Steamed Chicken Rice", description: "Succulent steamed chicken with aromatic rice.", price: 4.50, image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400&auto=format&fit=crop", category: "Main Dishes", popular: true },
    { id: 3, name: "Soy Sauce Chicken Rice", description: "Chicken marinated in soy sauce served with rice.", price: 4.50, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop", category: "Main Dishes" },
    { id: 4, name: "Chicken Wings (2 pcs)", description: "Crispy roasted chicken wings.", price: 3.00, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&auto=format&fit=crop", category: "Sides" },
    { id: 5, name: "Iced Lemon Tea", description: "Refreshing homemade iced lemon tea.", price: 1.50, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop", category: "Drinks" },
  ];

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const getTotalItems = () =>
    cart.reduce((sum, item) => sum + item.quantity, 0);

  const getTotalPrice = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  const filtered = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(menuItems.map(i => i.category))];

  return (
    <main className="menu-page">

      <Header
        activeSection="menu"
        setActiveSection={() => {}}
        onCartClick={() => navigate('/cart')}
      />

      {/* STALL HEADER */}
      <section className="stall-header">
        <div className="stall-container">
          <div className="stall-image-wrapper">
            <img src={stall.image} className="stall-image" />
            <span className="image-overlay" />
          </div>

          <div className="stall-info">
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

      {/* MENU */}
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
                        <img src={item.image} className="item-image" />
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
                        <p className="item-price">${item.price.toFixed(2)}</p>
                      </div>

                      <button 
                        className="add-button"
                        onClick={() => addToCart(item)}
                      >
                        Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* CART FOOTER */}
      {cart.length > 0 && (
        <footer className="cart-footer">
          <div className="cart-footer-container">
            <div className="cart-summary">
              <span className="cart-items-count">{getTotalItems()} items</span>
              <span className="cart-total-price">${getTotalPrice()}</span>
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