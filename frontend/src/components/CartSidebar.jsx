import React, { useState } from 'react';
import './CartSidebar.css';

const CartSidebar = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('cart');
  
  console.log('CartSidebar component mounted!');
  
  // Current cart items (this would come from your cart context/state)
  const cartItems = [
    {
      id: 1,
      name: 'Char Kway Teow',
      stallName: 'Ah Lim Chinese Stall',
      price: 6.50,
      quantity: 2,
      image: '🍜'
    },
    {
      id: 2,
      name: 'Bubble Tea',
      stallName: 'Fresh Drinks Bar',
      price: 4.80,
      quantity: 1,
      image: '🧋'
    }
  ];

  // Order history
  const orderHistory = [
    {
      id: 'ORD-001',
      date: '2024-11-08',
      total: 28.99,
      status: 'Delivered',
      stallName: 'Ah Lim\'s Chinese Stall',
      items: ['Char Kway Teow', 'Wonton Soup', 'Chinese Tea'],
      deliveryTime: '35 mins'
    },
    {
      id: 'ORD-002',
      date: '2024-11-05',
      total: 15.50,
      status: 'Delivered',
      stallName: 'Fresh Drinks Bar',
      items: ['Bubble Tea', 'Fresh Orange Juice'],
      deliveryTime: '20 mins'
    },
    {
      id: 'ORD-003',
      date: '2024-11-01',
      total: 42.75,
      status: 'Delivered',
      stallName: 'Mumbai Spice Corner',
      items: ['Chicken Biryani', 'Mango Lassi', 'Garlic Naan'],
      deliveryTime: '45 mins'
    }
  ];

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalOrders = orderHistory.length;
  const totalSpent = orderHistory.reduce((sum, order) => sum + order.total, 0);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      // Remove item logic
      console.log('Remove item', id);
    } else {
      // Update quantity logic
      console.log('Update quantity', id, newQuantity);
    }
  };

  const proceedToCheckout = () => {
    alert('Proceeding to checkout...');
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose}></div>
      <div className="cart-sidebar">
        <div className="cart-header">
          <div className="cart-tabs">
            <button 
              className={`cart-tab ${activeTab === 'cart' ? 'active' : ''}`}
              onClick={() => setActiveTab('cart')}
            >
              🛒 Cart ({cartItems.length})
            </button>
            <button 
              className={`cart-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📋 Orders
            </button>
          </div>
          <button className="cart-close" onClick={onClose}>×</button>
        </div>

        <div className="cart-content">
          {activeTab === 'cart' ? (
            <>
              {cartItems.length > 0 ? (
                <>
                  <div className="cart-items">
                    {cartItems.map((item) => (
                      <div key={item.id} className="cart-item">
                        <div className="item-image">{item.image}</div>
                        <div className="item-details">
                          <h4>{item.name}</h4>
                          <p>{item.stallName}</p>
                          <div className="item-controls">
                            <div className="quantity-controls">
                              <button 
                                className="qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                -
                              </button>
                              <span className="quantity">{item.quantity}</span>
                              <button 
                                className="qty-btn"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                            <div className="item-price">${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-summary">
                    <div className="summary-stats">
                      <div className="stat">
                        <span className="stat-label">Total Orders</span>
                        <span className="stat-value">{totalOrders}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Total Spent</span>
                        <span className="stat-value">${totalSpent.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="cart-total">
                      <div className="subtotal">
                        <span>Subtotal</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="delivery-fee">
                        <span>Delivery Fee</span>
                        <span>$2.50</span>
                      </div>
                      <div className="total">
                        <span>Total</span>
                        <span>${(cartTotal + 2.50).toFixed(2)}</span>
                      </div>
                    </div>

                    <button className="checkout-btn" onClick={proceedToCheckout}>
                      🚀 Checkout - ${(cartTotal + 2.50).toFixed(2)}
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-cart">
                  <div className="empty-icon">🛒</div>
                  <h3>Your cart is empty</h3>
                  <p>Add items from stalls to get started</p>
                </div>
              )}
            </>
          ) : (
            <div className="order-history-tab">
              <div className="history-stats">
                <div className="stat-card">
                  <span className="stat-number">{totalOrders}</span>
                  <span className="stat-label">Total Orders</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">${totalSpent.toFixed(2)}</span>
                  <span className="stat-label">Total Spent</span>
                </div>
              </div>

              <div className="history-list">
                {orderHistory.map((order) => (
                  <div key={order.id} className="history-item">
                    <div className="history-header">
                      <div className="order-info">
                        <h4>{order.stallName}</h4>
                        <span className="order-id">#{order.id}</span>
                      </div>
                      <div className="order-status delivered">{order.status}</div>
                    </div>
                    <div className="order-details">
                      <div className="order-items">
                        {order.items.join(', ')}
                      </div>
                      <div className="order-meta">
                        <span className="order-date">
                          {new Date(order.date).toLocaleDateString()}
                        </span>
                        <span className="order-total">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <button className="reorder-btn">🔄 Reorder</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;