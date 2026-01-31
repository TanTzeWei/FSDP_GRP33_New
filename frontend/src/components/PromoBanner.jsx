import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PromoBanner.css';
import { useNavigate } from "react-router-dom";

const PromoBanner = () => {
  const navigate = useNavigate();
  const [promoData, setPromoData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const stallsResponse = await axios.get('/api/stalls');
      const stalls = stallsResponse.data.data || [];

      const allPromos = [];
      
      for (const stall of stalls) {
        try {
          const promosResponse = await axios.get(`/api/promos/stall/${stall.id}/active`);
          const stallPromos = promosResponse.data.data || [];
          
          if (stallPromos.length > 0) {
            for (const promo of stallPromos) {
              // Fetch food item price, image, and name
              let itemPrice = null;
              let itemImage = null;
              let itemName = null;
              try {
                const foodItemResponse = await axios.get(`/api/dishes/${promo.food_item_id}`);
                if (foodItemResponse.data.success && foodItemResponse.data.data) {
                  itemPrice = parseFloat(foodItemResponse.data.data.price);
                  itemImage = foodItemResponse.data.data.image_url || foodItemResponse.data.data.image;
                  itemName = foodItemResponse.data.data.name;
                }
              } catch (err) {
                console.warn(`Failed to fetch food item ${promo.food_item_id}:`, err);
              }

              allPromos.push({
                id: promo.id,
                title: stall.stall_name || stall.name,
                itemName: itemName || 'Special Item',
                category: stall.cuisine_type || 'Hawker Food',
                rating: stall.rating || 4.5,
                time: stall.estimated_delivery_time || 30,
                distance: stall.distance_km || 1.0,
                offer: formatPromoOffer(promo),
                promoName: promo.promo_name || 'Special Offer',
                endDate: promo.end_date,
                discountType: promo.discount_type,
                discountValue: promo.discount_value,
                originalPrice: itemPrice,
                discountedPrice: calculateDiscountedPrice(itemPrice, promo),
                image: itemImage || stall.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&q=80',
                alt: `${stall.stall_name || stall.name} - Promotion`,
                stallId: stall.id
              });
            }
          }
        } catch (error) {
          console.error(`Error loading promos for stall ${stall.id}:`, error);
        }
      }

      setPromoData(allPromos);
    } catch (error) {
      console.error('Error loading promotions:', error);
      setPromoData(getFallbackPromoData());
    } finally {
      setLoading(false);
    }
  };

  const formatPromoOffer = (promo) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% Off`;
    } else if (promo.discount_type === 'fixed_amount') {
      return `$${promo.discount_value} Off`;
    }
    return promo.promo_name;
  };

  const calculateDiscountedPrice = (originalPrice, promo) => {
    if (!originalPrice || !promo) return null;
    
    let discountedPrice = originalPrice;
    
    if (promo.discount_type === 'percentage') {
      discountedPrice = originalPrice - (originalPrice * promo.discount_value / 100);
    } else if (promo.discount_type === 'fixed_amount') {
      discountedPrice = originalPrice - promo.discount_value;
    }
    
    return Math.max(0, discountedPrice);
  };

  const formatEndDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFallbackPromoData = () => [
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
    }
  ];

  return (
    <section className="promo-banner">
      <div className="promo-container">
        <h1 className="promo-title">
          Hawker Hub Promo in <span className="location-highlight">Singapore</span>
        </h1>

        {loading ? (
          <div className="loading-message">Loading promotions...</div>
        ) : promoData.length === 0 ? (
          <div className="no-promos-message">No active promotions at the moment</div>
        ) : (
          <>
            <div className="promo-grid">
              {promoData.map((promo) => (
                <div 
                  key={promo.id}
                  className="promo-card"
                  onClick={() => navigate(`/menu?stall=${promo.stallId}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="promo-image">
                    <img 
                      src={promo.image} 
                      alt={promo.alt}
                      className="promo-image-actual"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="promo-image-overlay"></div>
                    <div className="promo-offer-badge">{promo.offer}</div>
                  </div>
                  <div className="promo-content">
                    <h3>{promo.title}</h3>
                    <p className="promo-item-name">🍽️ {promo.itemName}</p>
                    <p className="promo-name">📌 {promo.promoName}</p>
                    <p className="promo-category">{promo.category}</p>
                    <div className="promo-meta">
                      <span className="rating">⭐ {promo.rating}</span>
                      <span className="delivery-time">⏰ {promo.time} mins</span>
                      <span className="distance">📍 {promo.distance} km</span>
                    </div>
                    
                    {promo.originalPrice && promo.discountedPrice !== null && (
                      <div className="promo-pricing">
                        <p className="original-price">${promo.originalPrice.toFixed(2)}</p>
                        <p className="discounted-price">${promo.discountedPrice.toFixed(2)}</p>
                      </div>
                    )}
                    
                    <div className="promo-footer">
                      <div className="promo-end-date">Ends: {formatEndDate(promo.endDate)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default PromoBanner;