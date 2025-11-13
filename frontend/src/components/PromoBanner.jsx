import React from 'react';
import './PromoBanner.css';
import { useNavigate } from "react-router-dom";

const PromoBanner = () => {
  const navigate = useNavigate(); // <-- ACTIVATE navigation

  return (
    <section className="promo-banner">
      <div className="promo-container">
        <h1 className="promo-title">
          Hawker Hub Promo in <span className="location-highlight">Singapore</span>
        </h1>

        <div className="promo-grid">

          {/* Stall 1 */}
          <div 
            className="promo-card"
            onClick={() => navigate('/menu')}
            style={{ cursor: "pointer" }}
          >
            <div className="promo-badge">Promo</div>
            <div className="promo-image">🏪</div>
            <div className="promo-content">
              <h3>Local Hawker Delights</h3>
              <p className="promo-category">Singaporean, Street Food, Hawker</p>
              <div className="promo-meta">
                <span className="rating">⭐ 4.8</span>
                <span className="delivery-time">⏰ 25 mins</span>
                <span className="distance">📍 1.2 km</span>
              </div>
              <div className="promo-offer">Free Delivery</div>
            </div>
          </div>

          {/* Stall 2 */}
          <div 
            className="promo-card"
            onClick={() => navigate('/menu')}
            style={{ cursor: "pointer" }}
          >
            <div className="promo-badge">Promo</div>
            <div className="promo-image">🍜</div>
            <div className="promo-content">
              <h3>Noodle Paradise</h3>
              <p className="promo-category">Chinese, Noodles, Comfort Food</p>
              <div className="promo-meta">
                <span className="rating">⭐ 4.5</span>
                <span className="delivery-time">⏰ 30 mins</span>
                <span className="distance">📍 0.8 km</span>
              </div>
              <div className="promo-offer">20% Off</div>
            </div>
          </div>

          {/* Stall 3 */}
          <div 
            className="promo-card"
            onClick={() => navigate('/menu')}
            style={{ cursor: "pointer" }}
          >
            <div className="promo-badge">Promo</div>
            <div className="promo-image">🍛</div>
            <div className="promo-content">
              <h3>Rice & Curry House</h3>
              <p className="promo-category">Indian, Curry, Rice Dishes</p>
              <div className="promo-meta">
                <span className="rating">⭐ 4.7</span>
                <span className="delivery-time">⏰ 35 mins</span>
                <span className="distance">📍 1.5 km</span>
              </div>
              <div className="promo-offer">Buy 1 Get 1</div>
            </div>
          </div>

          {/* Stall 4 */}
          <div 
            className="promo-card"
            onClick={() => navigate('/menu')}
            style={{ cursor: "pointer" }}
          >
            <div className="promo-badge">Promo</div>
            <div className="promo-image">🥤</div>
            <div className="promo-content">
              <h3>Fresh Drinks Corner</h3>
              <p className="promo-category">Beverages, Fresh Juice, Bubble Tea</p>
              <div className="promo-meta">
                <span className="rating">⭐ 4.6</span>
                <span className="delivery-time">⏰ 15 mins</span>
                <span className="distance">📍 0.5 km</span>
              </div>
              <div className="promo-offer">15% Off</div>
            </div>
          </div>

        </div>

        <button className="see-all-btn">See all promotions</button>
      </div>
    </section>
  );
};

export default PromoBanner;