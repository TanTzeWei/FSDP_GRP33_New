import React, { useState } from 'react';
import { ShoppingCart, Star, Clock, MapPin, Search } from 'lucide-react';
import './menupage.css';

const HawkerMenuPage = () => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample stall data
  const stall = {
    name: "Ah Seng Chicken Rice",
    rating: 4.5,
    reviews: 328,
    deliveryTime: "20-30 min",
    distance: "1.2 km",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop",
    categories: ["Chicken Rice", "Local Delights", "Halal"]
  };

  const menuItems = [
    {
      id: 1,
      name: "Roasted Chicken Rice",
      description: "Tender roasted chicken served with fragrant rice, cucumber, and homemade chili sauce",
      price: 4.50,
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop",
      category: "Main Dishes",
      popular: true
    },
    {
      id: 2,
      name: "Steamed Chicken Rice",
      description: "Succulent steamed chicken with aromatic rice and ginger sauce",
      price: 4.50,
      image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400&auto=format&fit=crop",
      category: "Main Dishes",
      popular: true
    },
    {
      id: 3,
      name: "Soy Sauce Chicken Rice",
      description: "Flavorful soy sauce marinated chicken with rice",
      price: 4.50,
      image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop",
      category: "Main Dishes",
      popular: false
    },
    {
      id: 4,
      name: "Chicken Wings (2 pcs)",
      description: "Crispy roasted chicken wings",
      price: 3.00,
      image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&auto=format&fit=crop",
      category: "Sides",
      popular: false
    },
    {
      id: 5,
      name: "Iced Lemon Tea",
      description: "Refreshing homemade iced lemon tea",
      price: 1.50,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop",
      category: "Drinks",
      popular: false
    }
  ];

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <main className="menu-page">
      {/* Header */}
      <header className="header">
        <nav className="nav-container">
          <section className="nav-content">
            <h1 className="app-title">HawkerEats</h1>
            <button className="cart-button" aria-label="View cart">
              <ShoppingCart className="cart-icon" />
              {getTotalItems() > 0 && (
                <span className="cart-badge">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </section>
        </nav>
      </header>

      {/* Stall Header */}
      <article className="stall-header">
        <section className="stall-container">
          <figure className="stall-image-wrapper">
            <img 
              src={stall.image} 
              alt={stall.name}
              className="stall-image"
            />
            <span className="image-overlay" aria-hidden="true"></span>
          </figure>
          
          <section className="stall-info">
            <h2 className="stall-name">{stall.name}</h2>
            
            <ul className="stall-details">
              <li className="stall-detail-item">
                <Star className="icon icon-star" aria-hidden="true" />
                <span className="rating-value">{stall.rating}</span>
                <span className="rating-count">({stall.reviews})</span>
              </li>
              <li className="stall-detail-item">
                <Clock className="icon" aria-hidden="true" />
                <span>{stall.deliveryTime}</span>
              </li>
              <li className="stall-detail-item">
                <MapPin className="icon" aria-hidden="true" />
                <span>{stall.distance}</span>
              </li>
            </ul>

            <ul className="category-tags">
              {stall.categories.map((cat, idx) => (
                <li key={idx} className="category-tag">
                  {cat}
                </li>
              ))}
            </ul>
          </section>
        </section>
      </article>

      {/* Search Bar */}
      <section className="search-section">
        <form className="search-container" onSubmit={(e) => e.preventDefault()}>
          <label className="search-label">
            <Search className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search menu items"
            />
          </label>
        </form>
      </section>

      {/* Menu Items */}
      <section className="menu-section">
        {categories.map(category => {
          const categoryItems = filteredItems.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;
          
          return (
            <article key={category} className="menu-category">
              <h3 className="category-title">{category}</h3>
              <ul className="menu-items">
                {categoryItems.map(item => (
                  <li key={item.id} className="menu-item">
                    <article className="menu-item-content">
                      <figure className="item-image-wrapper">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="item-image"
                        />
                      </figure>
                      <section className="item-details">
                        <header className="item-header">
                          <section className="item-info">
                            <h4 className="item-name">
                              {item.name}
                              {item.popular && (
                                <span className="popular-badge">
                                  Popular
                                </span>
                              )}
                            </h4>
                            <p className="item-description">{item.description}</p>
                            <p className="item-price">${item.price.toFixed(2)}</p>
                          </section>
                        </header>
                      </section>
                      <button
                        onClick={() => addToCart(item)}
                        className="add-button"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        Add
                      </button>
                    </article>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}

        {filteredItems.length === 0 && (
          <section className="no-results">
            <p>No items found matching your search.</p>
          </section>
        )}
      </section>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <footer className="cart-footer">
          <section className="cart-footer-container">
            <section className="cart-summary">
              <section className="cart-totals">
                <p className="cart-items-count">{getTotalItems()} item(s)</p>
                <p className="cart-total-price">${getTotalPrice()}</p>
              </section>
              <button className="view-cart-button">
                View Cart
              </button>
            </section>
          </section>
        </footer>
      )}
    </main>
  );
};

export default HawkerMenuPage;