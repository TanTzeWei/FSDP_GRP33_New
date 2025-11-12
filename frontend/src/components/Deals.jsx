// components/Deals.js
import React from 'react';
import './Deals.css';

const Deals = () => {
  const deals = [
    {
      id: 1,
      title: "Family Feast",
      description: "2 mains, 2 sides, and 4 drinks",
      price: "$25.00",
      originalPrice: "$32.00"
    },
    {
      id: 2,
      title: "Lunch Special",
      description: "1 main + 1 drink (11am-2pm)",
      price: "$8.50",
      originalPrice: "$11.00"
    }
  ];

  return (
    <div className="deals-container">
      <h2>Today's Special Deals</h2>
      <div className="deals-grid">
        {deals.map(deal => (
          <div key={deal.id} className="deal-card">
            <div className="deal-badge">HOT DEAL</div>
            <h3>{deal.title}</h3>
            <p>{deal.description}</p>
            <div className="deal-price">
              <span className="current-price">{deal.price}</span>
              <span className="original-price">{deal.originalPrice}</span>
            </div>
            <button className="redeem-btn">Redeem Offer</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Deals;