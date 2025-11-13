import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ activeSection, setActiveSection, onCartClick }) => {
  const navItems = [
    { key: 'menu', label: 'Food' },
    { key: 'deals', label: 'Upload' },
    { key: 'rewards', label: 'Rewards' }
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo" onClick={() => setActiveSection('menu')}>
            <div className="hawker-logo">🏪</div>
            <span className="brand-name">Hawker Hub</span>
          </div>
          
          <nav className="main-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="header-right">
          <div className="location-selector" onClick={() => setActiveSection('location')}>
            <span className="location-icon">📍</span>
            <span className="location-text">Singapore</span>
          </div>
          
          <button 
            className="bag-button"
            onClick={() => {
              console.log('Bag button clicked in Header!');
              onCartClick && onCartClick();
            }}
            title="Cart & Order History"
          >
            <span className="bag-icon">🛍️</span>
          </button>
          
          <div className="auth-buttons">
            <Link to="/login" className="auth-link">Login</Link>
            <span className="separator">/</span>
            <Link to="/signup" className="auth-link">Sign up</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;