import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AdminApprovals.css'; // Reusing the same styles

export default function AdminStalls() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, stall: null });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchStalls = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3000/api/stalls');
      setStalls(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stalls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStalls();
    }
  }, [token]);

  const handleDelete = async (stall) => {
    setActionLoading(stall.id);
    try {
      await axios.delete(`http://localhost:3000/api/stalls/${stall.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Stall "${stall.stall_name}" has been deleted.`, 'success');
      fetchStalls();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete stall', 'error');
    } finally {
      setActionLoading(null);
      setConfirmModal({ show: false, stall: null });
    }
  };

  const openConfirmModal = (stall) => {
    setConfirmModal({ show: true, stall });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-approvals">
      <Link to="/dashboard/admin" className="back-link">
        ← Back to Dashboard
      </Link>

      <h1>
        <span className="icon">🏪</span>
        Manage Stalls
      </h1>
      <p className="subtitle">View and manage all stalls in the system</p>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#2196F3' }}>🏪</div>
          <div className="stat-info">
            <h3>{stalls.length}</h3>
            <p>Total Stalls</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading stalls...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && stalls.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🏪</div>
          <h3>No stalls found</h3>
          <p>There are no stalls in the system yet.</p>
        </div>
      )}

      {/* Stalls List */}
      {!loading && stalls.length > 0 && (
        <div className="pending-list">
          {stalls.map((stall) => (
            <div key={stall.id} className="pending-card">
              <div className="pending-card-header">
                <div className="owner-info">
                  <div className="owner-avatar" style={{ background: '#2196F3' }}>
                    🏪
                  </div>
                  <div className="owner-details">
                    <h3>{stall.stall_name}</h3>
                    <p className="email">
                      <span>📍</span> {stall.hawker_centre_name || 'Unknown Location'}
                    </p>
                  </div>
                </div>
                <span className={`status-badge ${stall.status === 'Active' ? 'approved' : 'pending'}`}>
                  {stall.status || 'Active'}
                </span>
              </div>

              {/* Stall Information */}
              <div className="stall-info">
                <div className="stall-info-row">
                  <div className="stall-info-item">
                    <span className="label">Stall Number</span>
                    <span className="value">
                      {stall.stall_number || 'Not assigned'}
                    </span>
                  </div>
                  <div className="stall-info-item">
                    <span className="label">Cuisine Type</span>
                    <span className="value">
                      {stall.cuisine_type_name || 'Not specified'}
                    </span>
                  </div>
                  <div className="stall-info-item">
                    <span className="label">Rating</span>
                    <span className="value">
                      ⭐ {stall.rating || '0.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="btn btn-delete"
                  onClick={() => openConfirmModal(stall)}
                  disabled={actionLoading === stall.id}
                  style={{ 
                    backgroundColor: '#f5f5f5', 
                    color: '#d32f2f',
                    border: '1px solid #d32f2f'
                  }}
                >
                  🗑️ Delete Stall
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, stall: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🗑️ Delete Stall</h3>
            <p>
              Are you sure you want to permanently delete <span className="owner-name">{confirmModal.stall?.stall_name}</span>?
            </p>
            <p style={{ color: '#d32f2f', fontWeight: '500' }}>
              ⚠️ This will also unlink any owners associated with this stall. This action cannot be undone!
            </p>
            
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ show: false, stall: null })}
              >
                Cancel
              </button>
              <button
                className="btn btn-reject"
                onClick={() => handleDelete(confirmModal.stall)}
                disabled={actionLoading}
                style={{ backgroundColor: '#d32f2f' }}
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
