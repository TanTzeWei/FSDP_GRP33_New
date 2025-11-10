import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import './CartPage.css';

const CartPage = () => {
  // Sample cart data
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Roasted Chicken Rice",
      stallName: "Ah Seng Chicken Rice",
      price: 4.50,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop",
      specialInstructions: ""
    },
    {
      id: 2,
      name: "Steamed Chicken Rice",
      stallName: "Ah Seng Chicken Rice",
      price: 4.50,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=400&auto=format&fit=crop",
      specialInstructions: "Extra chili please"
    },
    {
      id: 5,
      name: "Iced Lemon Tea",
      stallName: "Ah Seng Chicken Rice",
      price: 1.50,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop",
      specialInstructions: ""
    }
  ]);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const deliveryFee = 2.50;
  const serviceFee = 0.50;

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      removeItem(id);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const updateInstructions = (id, instructions) => {
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, specialInstructions: instructions } : item
    ));
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'FIRST10') {
      setAppliedPromo({ code: 'FIRST10', discount: getSubtotal() * 0.1 });
    } else {
      alert('Invalid promo code');
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getDiscount = () => {
    return appliedPromo ? appliedPromo.discount : 0;
  };

  const getTotal = () => {
    return getSubtotal() + deliveryFee + serviceFee - getDiscount();
  };

  const handleCheckout = () => {
    alert('Proceeding to checkout...');
  };

  return (
    <main className="cart-page">
      {/* Header */}
      <header className="cart-header">
        <nav className="cart-nav">
          <button className="back-button" aria-label="Go back">
            <ArrowLeft className="back-icon" />
          </button>
          <h1 className="cart-title">Your Cart</h1>
          <span className="cart-count">{cartItems.length} items</span>
        </nav>
      </header>

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <section className="empty-cart">
          <ShoppingBag className="empty-cart-icon" />
          <h2 className="empty-cart-title">Your cart is empty</h2>
          <p className="empty-cart-text">Add some delicious hawker food to get started!</p>
          <button className="browse-button">Browse Menu</button>
        </section>
      ) : (
        <section className="cart-content">
          {/* Cart Items */}
          <section className="cart-items-section">
            <h2 className="section-title">Order Items</h2>
            <ul className="cart-items-list">
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <article className="cart-item-content">
                    <figure className="cart-item-image-wrapper">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="cart-item-image"
                      />
                    </figure>
                    
                    <section className="cart-item-details">
                      <header className="cart-item-header">
                        <section className="item-info">
                          <h3 className="item-name">{item.name}</h3>
                          <p className="item-stall">{item.stallName}</p>
                          <p className="item-price">${item.price.toFixed(2)} each</p>
                        </section>
                        <button 
                          className="remove-button"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="remove-icon" />
                        </button>
                      </header>

                      <section className="quantity-controls">
                        <button 
                          className="quantity-button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="quantity-icon" />
                        </button>
                        <span className="quantity-display">{item.quantity}</span>
                        <button 
                          className="quantity-button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="quantity-icon" />
                        </button>
                      </section>

                      <section className="instructions-section">
                        <label htmlFor={`instructions-${item.id}`} className="instructions-label">
                          Special Instructions (optional)
                        </label>
                        <input
                          id={`instructions-${item.id}`}
                          type="text"
                          value={item.specialInstructions}
                          onChange={(e) => updateInstructions(item.id, e.target.value)}
                          placeholder="e.g., No vegetables, extra spicy"
                          className="instructions-input"
                        />
                      </section>

                      <p className="item-total">
                        Subtotal: <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                      </p>
                    </section>
                  </article>
                </li>
              ))}
            </ul>
          </section>

          {/* Order Summary */}
          <aside className="order-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            {/* Promo Code */}
            <section className="promo-section">
              <label htmlFor="promo-input" className="promo-label">Have a promo code?</label>
              <section className="promo-input-group">
                <input
                  id="promo-input"
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="promo-input"
                />
                <button 
                  onClick={applyPromoCode}
                  className="promo-button"
                >
                  Apply
                </button>
              </section>
              {appliedPromo && (
                <p className="promo-success">✓ Promo code applied!</p>
              )}
            </section>

            {/* Price Breakdown */}
            <section className="price-breakdown">
              <section className="price-row">
                <span className="price-label">Subtotal</span>
                <span className="price-value">${getSubtotal().toFixed(2)}</span>
              </section>
              <section className="price-row">
                <span className="price-label">Delivery Fee</span>
                <span className="price-value">${deliveryFee.toFixed(2)}</span>
              </section>
              <section className="price-row">
                <span className="price-label">Service Fee</span>
                <span className="price-value">${serviceFee.toFixed(2)}</span>
              </section>
              {appliedPromo && (
                <section className="price-row discount-row">
                  <span className="price-label">Discount ({appliedPromo.code})</span>
                  <span className="price-value discount-value">-${getDiscount().toFixed(2)}</span>
                </section>
              )}
              <hr className="price-divider" />
              <section className="price-row total-row">
                <span className="total-label">Total</span>
                <span className="total-value">${getTotal().toFixed(2)}</span>
              </section>
            </section>

            <button 
              className="checkout-button"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
          </aside>
        </section>
      )}
    </main>
  );
};

export default CartPage;