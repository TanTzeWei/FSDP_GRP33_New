// components/Deals.js - Upload page with beautiful UI
import React, { useState } from 'react';
import PhotoUpload from './PhotoUpload';
import './Deals.css';

const Deals = () => {
  const [uploadCount, setUploadCount] = useState(0);
  const [recentUploads, setRecentUploads] = useState([]);

  // Handle successful photo upload
  const handleUploadSuccess = async (uploadedPhoto) => {
    setUploadCount(prev => prev + 1);
    setRecentUploads(prev => [uploadedPhoto, ...prev.slice(0, 2)]); // Keep only last 3
  };

  return (
    <div className="upload-page">
      {/* Hero Section */}
      <div className="upload-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              📸 Share Your Food Moments
            </h1>
            <p className="hero-subtitle">
              Capture and share the delicious dishes that make your day special. 
              Help fellow food lovers discover amazing hawker gems across Singapore!
            </p>
          </div>
          <div className="hero-visual">
            <div className="food-emoji-grid">
              <span className="food-emoji">🍜</span>
              <span className="food-emoji">🥟</span>
              <span className="food-emoji">🍲</span>
              <span className="food-emoji">🥘</span>
              <span className="food-emoji">🍱</span>
              <span className="food-emoji">🧋</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-main-section">
        <div className="upload-container">
          <PhotoUpload onUploadSuccess={handleUploadSuccess} embedded={true} />
        </div>
      </div>

      {/* Tips Section */}
      <div className="upload-tips">
        <h3 className="tips-title">📷 Photography Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">💡</div>
            <h4>Good Lighting</h4>
            <p>Natural light works best. Avoid harsh shadows and overly bright spots.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h4>Focus on Details</h4>
            <p>Capture the texture, colors, and unique features that make the dish special.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📐</div>
            <h4>Composition</h4>
            <p>Try different angles - overhead shots work great for flat dishes.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🏮</div>
            <h4>Tell a Story</h4>
            <p>Include context like the stall setting or eating utensils for authenticity.</p>
          </div>
        </div>
      </div>

      {/* Recent Uploads Preview */}
      {recentUploads.length > 0 && (
        <div className="recent-uploads">
          <h3 className="recent-title">🎉 Your Recent Uploads</h3>
          <div className="recent-grid">
            {recentUploads.map((photo, index) => (
              <div key={index} className="recent-photo">
                <div className="success-badge">✓ Uploaded</div>
                <img 
                  src={photo.imageUrl} 
                  alt={photo.dishName}
                  className="recent-image"
                />
                <p className="recent-name">{photo.dishName}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Deals;