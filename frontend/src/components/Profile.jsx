import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    birthdate: '1990-05-15',
    preferences: {
      dietaryRestrictions: ['Vegetarian'],
      favoriteFood: 'Italian',
      notifications: true
    }
  });

  const [tempUserData, setTempUserData] = useState(userData);

  const orderHistory = [
    {
      id: 'ORD-001',
      date: '2024-11-08',
      total: 28.99,
      status: 'Delivered',
      items: ['Beef Burger', 'French Fries', 'Coke']
    },
    {
      id: 'ORD-002',
      date: '2024-11-05',
      total: 15.50,
      status: 'Delivered',
      items: ['Caesar Salad', 'Fresh Juice']
    },
    {
      id: 'ORD-003',
      date: '2024-11-01',
      total: 42.75,
      status: 'Delivered',
      items: ['Pasta Carbonara', 'Chocolate Cake', 'Wine']
    }
  ];

  const handleEdit = () => {
    setIsEditing(true);
    setTempUserData(userData);
  };

  const handleSave = () => {
    setUserData(tempUserData);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setTempUserData(userData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setTempUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setTempUserData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const addDietaryRestriction = (restriction) => {
    if (!tempUserData.preferences.dietaryRestrictions.includes(restriction)) {
      setTempUserData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          dietaryRestrictions: [...prev.preferences.dietaryRestrictions, restriction]
        }
      }));
    }
  };

  const removeDietaryRestriction = (restriction) => {
    setTempUserData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        dietaryRestrictions: prev.preferences.dietaryRestrictions.filter(r => r !== restriction)
      }
    }));
  };

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {userData.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
        <div className="profile-info">
          <h2>{userData.name}</h2>
          <p>{userData.email}</p>
          <div className="profile-actions">
            {!isEditing ? (
              <button className="edit-btn" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3>Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={tempUserData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              ) : (
                <span>{userData.name}</span>
              )}
            </div>
            <div className="info-item">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={tempUserData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              ) : (
                <span>{userData.email}</span>
              )}
            </div>
            <div className="info-item">
              <label>Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={tempUserData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              ) : (
                <span>{userData.phone}</span>
              )}
            </div>
            <div className="info-item">
              <label>Birth Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={tempUserData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                />
              ) : (
                <span>{new Date(userData.birthdate).toLocaleDateString()}</span>
              )}
            </div>
            <div className="info-item full-width">
              <label>Address</label>
              {isEditing ? (
                <textarea
                  value={tempUserData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows="3"
                />
              ) : (
                <span>{userData.address}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Food Preferences</h3>
          <div className="preferences-content">
            <div className="preference-item">
              <label>Dietary Restrictions</label>
              <div className="dietary-tags">
                {(isEditing ? tempUserData : userData).preferences.dietaryRestrictions.map((restriction) => (
                  <span key={restriction} className="dietary-tag">
                    {restriction}
                    {isEditing && (
                      <button 
                        className="remove-tag"
                        onClick={() => removeDietaryRestriction(restriction)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <div className="add-dietary">
                    <select onChange={(e) => {
                      if (e.target.value) {
                        addDietaryRestriction(e.target.value);
                        e.target.value = '';
                      }
                    }}>
                      <option value="">Add restriction...</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Gluten-Free">Gluten-Free</option>
                      <option value="Dairy-Free">Dairy-Free</option>
                      <option value="Nut-Free">Nut-Free</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="preference-item">
              <label>Favorite Cuisine</label>
              {isEditing ? (
                <select
                  value={tempUserData.preferences.favoriteFood}
                  onChange={(e) => handlePreferenceChange('favoriteFood', e.target.value)}
                >
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Indian">Indian</option>
                  <option value="Japanese">Japanese</option>
                  <option value="American">American</option>
                </select>
              ) : (
                <span>{userData.preferences.favoriteFood}</span>
              )}
            </div>
            <div className="preference-item">
              <label>Email Notifications</label>
              {isEditing ? (
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={tempUserData.preferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              ) : (
                <span>{userData.preferences.notifications ? 'Enabled' : 'Disabled'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Order History</h3>
          <div className="order-history">
            {orderHistory.map((order) => (
              <div key={order.id} className="order-item">
                <div className="order-header">
                  <span className="order-id">#{order.id}</span>
                  <span className="order-date">{new Date(order.date).toLocaleDateString()}</span>
                  <span className={`order-status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <div className="order-items">
                    {order.items.join(', ')}
                  </div>
                  <div className="order-total">
                    ${order.total}
                  </div>
                </div>
                <button className="reorder-btn">
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;