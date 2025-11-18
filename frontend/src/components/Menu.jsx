// components/Menu.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PromoBanner from './PromoBanner';
import './Menu.css';

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const stallItems = [
    {
      id: 1,
      name: "Ah Lim's Chinese Stall",
      description: "Authentic Chinese dishes • Wonton noodles, Char Siu Rice, Fried Rice",
      rating: "4.8",
      deliveryTime: "25-35 mins",
      distance: "1.2 km",
      image: "/api/placeholder/300/200",
      category: "chinese",
      stallIcon: "🏮"
    },
    {
      id: 2,
      name: "Warung Pak Hasan",
      description: "Traditional Malay cuisine • Nasi Lemak, Rendang, Satay, Mee Goreng",
      rating: "4.6",
      deliveryTime: "20-30 mins", 
      distance: "0.8 km",
      image: "/api/placeholder/300/200",
      category: "malay",
      stallIcon: "🌙"
    },
    {
      id: 3,
      name: "Mumbai Spice Corner",
      description: "North & South Indian food • Biryani, Curry, Roti Prata, Tandoori",
      rating: "4.7",
      deliveryTime: "30-40 mins",
      distance: "1.5 km", 
      image: "/api/placeholder/300/200",
      category: "indian",
      stallIcon: "🇮🇳"
    },
    {
      id: 4,
      name: "Peranakan Kitchen",
      description: "Nyonya heritage cuisine • Laksa, Kueh, Ayam Buah Keluak",
      rating: "4.9",
      deliveryTime: "35-45 mins",
      distance: "2.1 km",
      image: "/api/placeholder/300/200", 
      category: "peranakan",
      stallIcon: "🏺"
    },
    {
      id: 5,
      name: "Western Grill House",
      description: "Western comfort food • Burgers, Steaks, Fish & Chips, Pasta",
      rating: "4.4",
      deliveryTime: "25-35 mins",
      distance: "1.8 km",
      image: "/api/placeholder/300/200",
      category: "western",
      stallIcon: "🍔"
    },
    {
      id: 6,
      name: "Fresh Drinks Bar",
      description: "Refreshing beverages • Fresh Juice, Bubble Tea, Coffee, Smoothies",
      rating: "4.5",
      deliveryTime: "15-25 mins",
      distance: "0.5 km",
      image: "/api/placeholder/300/200",
      category: "drinks",
      stallIcon: "🥤"
    }
  ];

  const categories = ["All", "Chinese", "Malay", "Indian", "Peranakan", "Western", "Drinks"];

  // Mock data for user-uploaded photos (will be replaced with API data later)
  const featuredPhotos = [
    { id: 1, imageUrl: "/api/placeholder/200/200", dishName: "Signature Laksa", stallName: "Peranakan Kitchen", likes: 247, username: "foodie_anna", verified: true },
    { id: 2, imageUrl: "/api/placeholder/200/200", dishName: "Char Siu Rice", stallName: "Ah Lim's Chinese Stall", likes: 189, username: "hungry_tom", verified: false },
    { id: 3, imageUrl: "/api/placeholder/200/200", dishName: "Rendang Beef", stallName: "Warung Pak Hasan", likes: 203, username: "spice_lover", verified: true },
    { id: 4, imageUrl: "/api/placeholder/200/200", dishName: "Masala Dosa", stallName: "Mumbai Spice Corner", likes: 156, username: "curry_king", verified: false }
  ];

  const communityPhotos = [
    { id: 5, imageUrl: "/api/placeholder/150/150", dishName: "Wonton Noodles", stallName: "Ah Lim's Chinese Stall", likes: 42, username: "noodle_ninja" },
    { id: 6, imageUrl: "/api/placeholder/150/150", dishName: "Nasi Lemak", stallName: "Warung Pak Hasan", likes: 38, username: "coconut_rice" },
    { id: 7, imageUrl: "/api/placeholder/150/150", dishName: "Fish & Chips", stallName: "Western Grill House", likes: 31, username: "crispy_fish" },
    { id: 8, imageUrl: "/api/placeholder/150/150", dishName: "Bubble Tea", stallName: "Fresh Drinks Bar", likes: 67, username: "boba_boss" },
    { id: 9, imageUrl: "/api/placeholder/150/150", dishName: "Roti Prata", stallName: "Mumbai Spice Corner", likes: 29, username: "flaky_bread" },
    { id: 10, imageUrl: "/api/placeholder/150/150", dishName: "Kueh Lapis", stallName: "Peranakan Kitchen", likes: 45, username: "heritage_food" },
    { id: 11, imageUrl: "/api/placeholder/150/150", dishName: "Mee Goreng", stallName: "Warung Pak Hasan", likes: 33, username: "spicy_noodles" },
    { id: 12, imageUrl: "/api/placeholder/150/150", dishName: "Fresh Juice", stallName: "Fresh Drinks Bar", likes: 28, username: "vitamin_c" }
  ];

  const filteredStalls = selectedCategory === 'All' 
    ? stallItems 
    : stallItems.filter(stall => stall.category === selectedCategory.toLowerCase());

  return (
    <div className="menu-container">
      <PromoBanner />

      {/* Hall of Flavor Fame - Most Liked Photos */}
      <div className="menu-section fame-section">
        <div className="section-header">
          <h2>🏆 Hall of Flavor Fame</h2>
          <p className="section-subtitle">Most loved dishes captured by our community</p>
        </div>
        
        <div className="featured-photos-grid">
          {featuredPhotos.map(photo => (
            <div key={photo.id} className="featured-photo-card">
              <div className="photo-container">
                <img src={photo.imageUrl} alt={photo.dishName} className="photo-image" />
                <div className="photo-overlay">
                  <div className="likes-badge">
                    <span className="heart-icon">❤️</span>
                    <span className="likes-count">{photo.likes}</span>
                  </div>
                </div>
              </div>
              <div className="photo-info">
                <h4 className="dish-name">{photo.dishName}</h4>
                <p className="stall-name">{photo.stallName}</p>
                <div className="photo-meta">
                  <span className="username">
                    {photo.verified && <span className="verified-badge">✓</span>}
                    @{photo.username}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Food Snapshots - All User Photos */}
      <div className="menu-section community-section">
        <div className="section-header">
          <h2>📸 Community Food Snapshots</h2>
          <p className="section-subtitle">Real dishes, real stories from fellow food lovers</p>
        </div>
        
        <div className="community-photos-grid">
          {communityPhotos.map(photo => (
            <div key={photo.id} className="community-photo-card">
              <div className="photo-container">
                <img src={photo.imageUrl} alt={photo.dishName} className="photo-image" />
                <div className="photo-overlay">
                  <div className="likes-badge small">
                    <span className="heart-icon">❤️</span>
                    <span className="likes-count">{photo.likes}</span>
                  </div>
                </div>
              </div>
              <div className="photo-info">
                <h5 className="dish-name">{photo.dishName}</h5>
                <p className="stall-name">{photo.stallName}</p>
                <span className="username">@{photo.username}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="view-more-container">
          <button className="view-more-btn">
            📱 View All Community Photos
          </button>
        </div>
      </div>
      
      <div className="menu-section">
        <h2>Popular near you</h2>

      <div className="category-filter">
        {categories.map(category => (
          <button 
            key={category} 
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="stalls-grid">
        {filteredStalls.map(stall => (
          <Link
            key={stall.id}
            to={`/menu?stall=${stall.id}`}
            className="stall-card"
          >
            <div className="stall-image">
              <img src={stall.image} alt={stall.name} />
              <div className="stall-icon">{stall.stallIcon}</div>
            </div>
            <div className="stall-content">
              <h3>{stall.name}</h3>
              <p className="stall-description">{stall.description}</p>
              <div className="stall-meta">
                <span className="rating">⭐ {stall.rating}</span>
                <span className="delivery-time">🕐 {stall.deliveryTime}</span>
                <span className="distance">📍 {stall.distance}</span>
              </div>
              <div className="view-menu-btn">View Menu</div>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
};

export default Menu;