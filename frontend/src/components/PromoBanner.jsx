import React from 'react';
import './PromoBanner.css';
import { useNavigate } from "react-router-dom";

const PromoBanner = () => {
  const navigate = useNavigate();

  // Promo data with online images
  const promoData = [
    {
      id: 1,
      title: "Local Hawker Delights",
      category: "Singaporean, Street Food, Hawker",
      rating: 4.8,
      time: 25,
      distance: 1.2,
      offer: "Free Delivery",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&q=80",
      alt: "Local Hawker Delights - Singaporean Street Food"
    },
    {
      id: 2,
      title: "Noodle Paradise",
      category: "Chinese, Noodles, Comfort Food",
      rating: 4.5,
      time: 30,
      distance: 0.8,
      offer: "20% Off",
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop&q=80",
      alt: "Noodle Paradise - Chinese Noodles"
    },
    {
      id: 3,
      title: "Rice & Curry House",
      category: "Indian, Curry, Rice Dishes",
      rating: 4.7,
      time: 35,
      distance: 1.5,
      offer: "Buy 1 Get 1",
      image: "https://images.unsplash.com/photo-1585937421456-de714db1eb1b?w=600&h=400&fit=crop&q=80",
      alt: "Rice & Curry House - Indian Curry"
    },
    {
      id: 4,
      title: "Fresh Drinks Corner",
      category: "Beverages, Fresh Juice, Bubble Tea",
      rating: 4.6,
      time: 15,
      distance: 0.5,
      offer: "15% Off",
      image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=400&fit=crop&q=80",
      alt: "Fresh Drinks Corner - Bubble Tea"
    },
    {
      id: 5,
      title: "BBQ Master Grill",
      category: "Grilled Meat, BBQ, Skewers",
      rating: 4.9,
      time: 20,
      distance: 0.9,
      offer: "$5 Off",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561a1b?w=600&h=400&fit=crop&q=80",
      alt: "BBQ Master Grill - Grilled Meat"
    },
    {
      id: 6,
      title: "Laksa Express",
      category: "Malaysian, Laksa, Spicy Noodles",
      rating: 4.7,
      time: 25,
      distance: 1.1,
      offer: "Free Drink",
      image: "https://images.unsplash.com/photo-1568206351336-e4694af5055f?w=600&h=400&fit=crop&q=80",
      alt: "Laksa Express - Malaysian Laksa"
    }
  ];

  return (
    <section className="promo-banner">
      <div className="promo-container">
        <h1 className="promo-title">
          Hawker Hub Promo in <span className="location-highlight">Singapore</span>
        </h1>

        <div className="promo-grid">
          {promoData.map((promo) => (
            <div 
              key={promo.id}
              className="promo-card"
              onClick={() => navigate('/menu')}
              style={{ cursor: "pointer" }}
            >
              <div className="promo-badge">Promo</div>
              <div className="promo-image">
                <img 
                  src={promo.image} 
                  alt={promo.alt}
                  className="promo-image-actual"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    e.target.style.display = 'none';
                  }}
                />
                <div className="promo-image-overlay"></div>
              </div>
              <div className="promo-content">
                <h3>{promo.title}</h3>
                <p className="promo-category">{promo.category}</p>
                <div className="promo-meta">
                  <span className="rating">⭐ {promo.rating}</span>
                  <span className="delivery-time">⏰ {promo.time} mins</span>
                  <span className="distance">📍 {promo.distance} km</span>
                </div>
                <div className="promo-offer">{promo.offer}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="see-all-btn">See all promotions</button>
      </div>
    </section>
  );
};

export default PromoBanner;