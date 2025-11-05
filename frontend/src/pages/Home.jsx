import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import './foodhome.css';

// Lightweight inline icons to avoid adding new dependencies
const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const BellIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 0 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const HomeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
  </svg>
);
const GridIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
const HeartIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);
const UserIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function FoodDeliveryHome() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="fd-container">
      {/* Header */}
      <header className="fd-header">
        <div className="fd-time">9:43</div>
        <h1 className="fd-title">Home</h1>
        <div className="fd-bell">
          {/* show login/signup when unauthenticated, or avatar+logout when authenticated */}
          <AuthHeader />
        </div>
      </header>

      {/* Search Bar */}
      <div className="fd-search-wrap">
        <div className="fd-search">
          <SearchIcon className="fd-search-icon" />
          <input
            type="text"
            placeholder="Search for restaurants or dishes"
            className="fd-search-input"
          />
        </div>
      </div>

      {/* Delivery Banner */}
      <div className="fd-banner">
        <div className="fd-banner-content">
          <div className="fd-banner-top">
            <h2 className="fd-banner-title">Delivery to Home</h2>
            <span className="fd-banner-arrow">›</span>
          </div>
          <p className="fd-banner-sub">2118 Thornridge Cir. Syracuse</p>
          <div className="fd-banner-eta">18 Mins</div>
        </div>
      </div>

      {/* Featured Item */}
      <div className="fd-feature">
        <div className="fd-feature-left">
          <h3 className="fd-feature-title">Chicken Teriyaki</h3>
          <p className="fd-feature-sub">Discount 20%</p>
          <button className="fd-order-btn">Order Now</button>
        </div>
        <div className="fd-feature-right">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
            alt="Chicken Teriyaki"
            className="fd-feature-img"
          />
        </div>
      </div>

      {/* Top of Week Section */}
      <div className="fd-top-week">
        <h2 className="fd-section-title">Top of Week</h2>
        <div className="fd-grid">
          <div className="fd-card">
            <img
              src="https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=200&h=150&fit=crop"
              alt="Asian Spring Pancake"
              className="fd-card-img"
            />
            <div className="fd-card-body">
              <h3 className="fd-card-title">Asian Spring Pancake</h3>
              <p className="fd-card-price">$15.99</p>
            </div>
          </div>
          <div className="fd-card">
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=150&fit=crop"
              alt="Tomato Cream Pasta"
              className="fd-card-img"
            />
            <div className="fd-card-body">
              <h3 className="fd-card-title">Tomato Cream Pasta</h3>
              <p className="fd-card-price">$22.00</p>
            </div>
          </div>
          <div className="fd-card">
            <img
              src="https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=150&fit=crop"
              alt="Fresh Salad"
              className="fd-card-img"
            />
            <div className="fd-card-body">
              <h3 className="fd-card-title">Healthy Green Salad</h3>
              <p className="fd-card-price">$18.99</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fd-bottom-nav">
        <div className="fd-nav-inner">
          <button onClick={() => setActiveTab('home')} className={`fd-nav-btn ${activeTab === 'home' ? 'active' : ''}`}>
            <HomeIcon />
            <span>Home</span>
          </button>
          <button onClick={() => setActiveTab('categories')} className={`fd-nav-btn ${activeTab === 'categories' ? 'active' : ''}`}>
            <GridIcon />
            <span>Categories</span>
          </button>
          <button onClick={() => setActiveTab('favorites')} className={`fd-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}>
            <HeartIcon />
            <span>Favorites</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`fd-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}>
            <UserIcon />
            <span>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function AuthHeader() {
  const { user, logout } = useContext(AuthContext);
  if (!user) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/login" className="fd-link">Login</Link>
        <Link to="/signup" className="fd-cta">Sign Up</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar name={user.name} size={36} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="fd-username">{user.name}</span>
        <button className="fd-logout" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
