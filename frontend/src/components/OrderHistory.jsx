import React from 'react';
import './OrderHistory.css';

const OrderHistory = () => {
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
    },
    {
      id: 'ORD-004',
      date: '2024-10-28',
      total: 23.80,
      status: 'Delivered',
      stallName: 'Warung Pak Hasan',
      items: ['Nasi Lemak', 'Rendang Beef', 'Teh Tarik'],
      deliveryTime: '30 mins'
    },
    {
      id: 'ORD-005',
      date: '2024-10-25',
      total: 18.90,
      status: 'Delivered',
      stallName: 'Western Grill House',
      items: ['Classic Burger', 'French Fries'],
      deliveryTime: '25 mins'
    }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#00b14f';
      case 'preparing':
        return '#ff9500';
      case 'on the way':
        return '#007aff';
      case 'cancelled':
        return '#ff3b30';
      default:
        return '#666';
    }
  };

  const reorderItems = (order) => {
    alert(`Reordering items from ${order.stallName}...`);
  };

  return (
    <div className="order-history">
      <div className="order-history-header">
        <div className="header-content">
          <h1>🛍️ Order History</h1>
          <p>Track your past orders and reorder your favorites</p>
        </div>
      </div>

      <div className="orders-container">
        <div className="orders-stats">
          <div className="stat-card">
            <span className="stat-number">{orderHistory.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              ${orderHistory.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
            </span>
            <span className="stat-label">Total Spent</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {Math.round(orderHistory.reduce((sum, order) => sum + parseInt(order.deliveryTime), 0) / orderHistory.length)}m
            </span>
            <span className="stat-label">Avg Delivery</span>
          </div>
        </div>

        <div className="orders-list">
          <h2>Recent Orders</h2>
          {orderHistory.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>{order.stallName}</h3>
                  <div className="order-meta">
                    <span className="order-id">#{order.id}</span>
                    <span className="order-date">
                      {new Date(order.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="order-status-section">
                  <span 
                    className="order-status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                  <span className="order-total">${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="order-details">
                <div className="order-items">
                  <h4>Items Ordered:</h4>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="delivery-info">
                  <span className="delivery-time">🕐 Delivered in {order.deliveryTime}</span>
                </div>
              </div>

              <div className="order-actions">
                <button 
                  className="reorder-btn"
                  onClick={() => reorderItems(order)}
                >
                  🔄 Reorder
                </button>
                <button className="receipt-btn">
                  📄 View Receipt
                </button>
              </div>
            </div>
          ))}
        </div>

        {orderHistory.length === 0 && (
          <div className="empty-orders">
            <div className="empty-icon">🛍️</div>
            <h3>No orders yet</h3>
            <p>When you place your first order, it will appear here.</p>
            <button className="browse-btn">Browse Stalls</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;