import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Avatar from './Avatar';
import './Header.css';

const Header = ({ activeSection, setActiveSection, onCartClick, selectedHawkerCenter }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const navItems = [
    { key: 'menu', label: 'Food', path: '/' },
    { key: 'deals', label: 'Upload', path: '/#upload' },
    { key: 'rewards', label: 'Rewards', path: '/points' }
  ];

  const handleNavClick = (item) => {
    // Set active section first
    setActiveSection && setActiveSection(item.key);
    
    // Navigate to the appropriate page
    if (item.key === 'rewards') {
      navigate('/points');
    } else if (item.key === 'menu') {
      navigate('/');
    } else if (item.key === 'deals') {
      // Navigate to home with deals section active
      navigate('/', { state: { activeSection: 'deals' } });
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo" onClick={() => {
            setActiveSection && setActiveSection('menu');
            navigate('/');
          }}>
            <div className="hawker-logo">🏪</div>
            <span className="brand-name">Hawker Hub</span>
          </Link>
          
          <nav className="main-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${activeSection === item.key ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="header-right">
          <div className="location-selector" onClick={() => {
            setActiveSection && setActiveSection('location');
            // Always navigate to home with location section active
            navigate('/', { state: { activeSection: 'location' } });
          }}>
            <span className="location-icon">📍</span>
            <span className="location-text">
              {selectedHawkerCenter ? selectedHawkerCenter.name : 'Singapore'}
            </span>
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
          
          {user ? (
            <div className="user-profile" onClick={() => {
              // Only navigate to profile if not a guest
              if (!user.isGuest) {
                navigate('/profile');
              }
            }}>
              <Avatar name={user.name} size={36} />
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                {user.isGuest ? (
                  <Link to="/login" className="upgrade-link" onClick={(e) => e.stopPropagation()}>
                    Sign up to save
                  </Link>
                ) : (
                  <button 
                    className="logout-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      logout();
                      navigate('/');
                      setActiveSection && setActiveSection('menu');
                    }}
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-link">Login</Link>
              <span className="separator">/</span>
              <Link to="/signup" className="auth-link">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;