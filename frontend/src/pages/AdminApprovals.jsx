import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './AdminApprovals.css';

export default function AdminApprovals() {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', owner: null });
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

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3000/admin/owners/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPending(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending owners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPending();
    }
  }, [token]);

  const handleApprove = async (owner) => {
    setActionLoading(owner.user_id);
    try {
      await axios.post(`http://localhost:3000/admin/owners/${owner.user_id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`${owner.name} has been approved as a stall owner!`, 'success');
      fetchPending();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve owner', 'error');
    } finally {
      setActionLoading(null);
      setConfirmModal({ show: false, type: '', owner: null });
    }
  };

  const handleReject = async (owner) => {
    setActionLoading(owner.user_id);
    try {
      await axios.post(`http://localhost:3000/admin/owners/${owner.user_id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`${owner.name}'s application has been rejected.`, 'success');
      fetchPending();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject owner', 'error');
    } finally {
      setActionLoading(null);
      setConfirmModal({ show: false, type: '', owner: null });
    }
  };

  const openConfirmModal = (type, owner) => {
    setConfirmModal({ show: true, type, owner });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
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
        <span className="icon">👥</span>
        Stall Owner Approvals
      </h1>
      <p className="subtitle">Review and manage pending stall owner registration requests</p>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-info">
            <h3>{pending.length}</h3>
            <p>Pending Approvals</p>
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
          <p>Loading pending approvals...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && pending.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>All caught up!</h3>
          <p>There are no pending stall owner registrations at the moment.</p>
        </div>
      )}

      {/* Pending Owners List */}
      {!loading && pending.length > 0 && (
        <div className="pending-list">
          {pending.map((owner) => (
            <div key={owner.user_id} className="pending-card">
              <div className="pending-card-header">
                <div className="owner-info">
                  <div className="owner-avatar">
                    {getInitials(owner.name)}
                  </div>
                  <div className="owner-details">
                    <h3>{owner.name}</h3>
                    <p className="email">
                      <span>📧</span> {owner.email}
                    </p>
                  </div>
                </div>
                <span className="status-badge pending">
                  ⏳ Pending Review
                </span>
              </div>

              {/* Stall Information */}
              <div className="stall-info">
                <div className="stall-info-row">
                  <div className="stall-info-item">
                    <span className="label">Stall Name</span>
                    <span className="value highlight">
                      {owner.stall_name || 'Not specified'}
                    </span>
                  </div>
                  <div className="stall-info-item">
                    <span className="label">Stall Number</span>
                    <span className="value">
                      {owner.stall_number || 'Not assigned'}
                    </span>
                  </div>
                  <div className="stall-info-item">
                    <span className="label">Hawker Centre</span>
                    <span className="value">
                      {owner.hawker_centre_name || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="meta-info">
                <span className="meta-item">
                  <span>📅</span> Applied: {formatDate(owner.created_at)}
                </span>
                <span className="meta-item">
                  <span>⏰</span> {getTimeAgo(owner.created_at)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="btn btn-reject"
                  onClick={() => openConfirmModal('reject', owner)}
                  disabled={actionLoading === owner.user_id}
                >
                  ❌ Reject
                </button>
                <button
                  className="btn btn-approve"
                  onClick={() => openConfirmModal('approve', owner)}
                  disabled={actionLoading === owner.user_id}
                >
                  ✓ Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, type: '', owner: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {confirmModal.type === 'approve' ? (
              <>
                <h3>✅ Approve Stall Owner</h3>
                <p>
                  Are you sure you want to approve <span className="owner-name">{confirmModal.owner?.name}</span> as a stall owner
                  {confirmModal.owner?.stall_name && (
                    <> for <strong>{confirmModal.owner.stall_name}</strong></>
                  )}
                  ?
                </p>
                <p>They will be able to manage their stall and menu items immediately.</p>
              </>
            ) : (
              <>
                <h3>❌ Reject Application</h3>
                <p>
                  Are you sure you want to reject <span className="owner-name">{confirmModal.owner?.name}</span>'s application?
                </p>
                <p>Their stall registration will be declined and they will need to re-apply.</p>
              </>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmModal({ show: false, type: '', owner: null })}
              >
                Cancel
              </button>
              {confirmModal.type === 'approve' ? (
                <button
                  className="btn btn-approve"
                  onClick={() => handleApprove(confirmModal.owner)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              ) : (
                <button
                  className="btn btn-reject"
                  onClick={() => handleReject(confirmModal.owner)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              )}
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
