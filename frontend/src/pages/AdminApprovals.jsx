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
  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [approvalForm, setApprovalForm] = useState({ stallName: '', hawkerCentreId: '' });

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

  const fetchHawkerCentres = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/hawker-centres');
      setHawkerCentres(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch hawker centres:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPending();
      fetchHawkerCentres();
    }
  }, [token]);

  const handleApprove = async (owner) => {
    setActionLoading(owner.user_id);
    try {
      const payload = {
        stall_name: approvalForm.stallName || owner.pending_stall_name || owner.stall_name,
        hawker_centre_id: approvalForm.hawkerCentreId ? parseInt(approvalForm.hawkerCentreId) : undefined
      };
      
      await axios.post(`http://localhost:3000/admin/owners/${owner.user_id}/approve`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`${owner.name} has been approved as a stall owner!`, 'success');
      fetchPending();
      setApprovalForm({ stallName: '', hawkerCentreId: '' });
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

  const handleDelete = async (owner) => {
    setActionLoading(owner.user_id);
    try {
      const deleteStall = confirmModal.deleteStall || false;
      await axios.delete(`http://localhost:3000/admin/owners/${owner.user_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { deleteStall }
      });
      showToast(`${owner.name} has been permanently deleted.`, 'success');
      fetchPending();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete owner', 'error');
    } finally {
      setActionLoading(null);
      setConfirmModal({ show: false, type: '', owner: null, deleteStall: false });
    }
  };

  const openConfirmModal = (type, owner) => {
    setConfirmModal({ show: true, type, owner, deleteStall: false });
    if (type === 'approve') {
      // Pre-fill form with owner's pending stall name and hawker centre if available
      setApprovalForm({
        stallName: owner.pending_stall_name || owner.stall_name || '',
        hawkerCentreId: owner.pending_hawker_centre_id || owner.hawker_centre_id || ''
      });
    }
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
                    <span className="label">Requested Stall Name</span>
                    <span className="value highlight">
                      {owner.pending_stall_name || owner.stall_name || 'Not specified - will be set during approval'}
                    </span>
                  </div>
                  <div className="stall-info-item">
                    <span className="label">Requested Hawker Centre</span>
                    <span className="value">
                      {owner.pending_hawker_centre_name || (owner.pending_hawker_centre_id ? `ID: ${owner.pending_hawker_centre_id}` : 'Not specified')}
                    </span>
                  </div>
                </div>
                <div className="stall-info-row">
                  <div className="stall-info-item">
                    <span className="label">Status</span>
                    <span className="value">
                      Pending stall creation
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
                <button
                  className="btn btn-delete"
                  onClick={() => openConfirmModal('delete', owner)}
                  disabled={actionLoading === owner.user_id}
                  style={{ 
                    backgroundColor: '#f5f5f5', 
                    color: '#d32f2f',
                    border: '1px solid #d32f2f'
                  }}
                >
                  🗑️ Delete
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
                  Approve <span className="owner-name">{confirmModal.owner?.name}</span> as a stall owner
                </p>
                
                {/* Stall Details Form */}
                <div className="form-group" style={{ marginTop: '20px', textAlign: 'left' }}>
                  <label htmlFor="stallName">Stall Name *</label>
                  <input
                    id="stallName"
                    type="text"
                    placeholder="Enter stall name"
                    value={approvalForm.stallName}
                    onChange={(e) => setApprovalForm({ ...approvalForm, stallName: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginTop: '5px'
                    }}
                  />
                </div>
                
                <div className="form-group" style={{ marginTop: '15px', textAlign: 'left' }}>
                  <label htmlFor="hawkerCentreId">Hawker Centre *</label>
                  <select
                    id="hawkerCentreId"
                    value={approvalForm.hawkerCentreId}
                    onChange={(e) => setApprovalForm({ ...approvalForm, hawkerCentreId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginTop: '5px'
                    }}
                  >
                    <option value="">Select Hawker Centre</option>
                    {hawkerCentres.map((hc) => (
                      <option key={hc.id} value={hc.id}>
                        {hc.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <p style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>
                  The stall will be created with "Active" status upon approval.
                </p>
              </>
            ) : confirmModal.type === 'delete' ? (
              <>
                <h3>🗑️ Delete Stall Owner</h3>
                <p>
                  Are you sure you want to permanently delete <span className="owner-name">{confirmModal.owner?.name}</span>?
                </p>
                <p style={{ color: '#d32f2f', fontWeight: '500' }}>⚠️ This action cannot be undone!</p>
                
                {confirmModal.owner?.stall_id && (
                  <div className="form-group" style={{ marginTop: '15px', textAlign: 'left' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={confirmModal.deleteStall}
                        onChange={(e) => setConfirmModal({ ...confirmModal, deleteStall: e.target.checked })}
                      />
                      <span>Also delete associated stall</span>
                    </label>
                  </div>
                )}
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
                  disabled={actionLoading || !approvalForm.stallName || !approvalForm.hawkerCentreId}
                >
                  {actionLoading ? 'Approving...' : 'Approve & Create Stall'}
                </button>
              ) : confirmModal.type === 'delete' ? (
                <button
                  className="btn btn-reject"
                  onClick={() => handleDelete(confirmModal.owner)}
                  disabled={actionLoading}
                  style={{ backgroundColor: '#d32f2f' }}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Permanently'}
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
