import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import axios from 'axios';
import './ProfilePage.css';

function ProfilePage() {
  const { user, login, logout, token } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.put(
        'http://localhost:3000/profile',
        { name: formData.name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update user in context
      login({ user: res.data.user, token: token });
      showToast('Profile updated successfully!', { type: 'success' });
      setIsEditing(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', { type: 'error' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', { type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        'http://localhost:3000/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showToast('Password changed successfully!', { type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to change password', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      await axios.delete('http://localhost:3000/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showToast('Account deleted successfully', { type: 'success' });
      logout();
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete account', { type: 'error' });
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header Section */}
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h1>My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            <Avatar name={user.name} size={100} />
            <div className="profile-basic-info">
              <h2>{user.name}</h2>
              <p className="profile-email">{user.email}</p>
              <span className="member-since">Member since {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="profile-form-section">
            <div className="section-header">
              <h3>Profile Information</h3>
              {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <button className="cancel-btn" onClick={handleCancel}>
                  ✖ Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="disabled-input"
                />
                <span className="input-hint">Email cannot be changed</span>
              </div>

              {isEditing && (
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? '⏳ Saving Profile...' : '💾 Save Profile Changes'}
                </button>
              )}
            </form>
          </div>

          {/* Password Section */}
          <div className="profile-form-section">
            <div className="section-header">
              <h3>Password & Security</h3>
              {!showPasswordSection && (
                <button
                  className="edit-btn"
                  onClick={() => setShowPasswordSection(true)}
                >
                  🔒 Change Password
                </button>
              )}
            </div>

            {showPasswordSection && (
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    ✖ Cancel Password Change
                  </button>
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? '⏳ Updating Password...' : '🔒 Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Stats */}
          <div className="profile-stats-section">
            <h3>Account Activity</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">🛒</span>
                <div className="stat-info">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Total Orders</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📸</span>
                <div className="stat-info">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Photos Uploaded</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">❤️</span>
                <div className="stat-info">
                  <span className="stat-value">0</span>
                  <span className="stat-label">Total Likes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="danger-zone">
            <h3>Danger Zone</h3>
            <p className="danger-description">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="delete-btn" onClick={handleDeleteAccount} disabled={loading}>
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
