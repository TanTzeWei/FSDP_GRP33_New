import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './DashboardAdmin.css';

export default function DashboardAdmin() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingOwners: 0,
    approvedOwners: 0,
    totalStalls: 0,
    totalHawkerCentres: 0
  });
  const [pendingOwners, setPendingOwners] = useState([]);
  const [allOwners, setAllOwners] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch all admin data
  const fetchAdminData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      // Fetch pending owners - handle errors gracefully
      let pending = [];
      try {
        const pendingRes = await axios.get('http://localhost:3000/admin/owners/pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
        pending = pendingRes.data?.data || [];
        setPendingOwners(pending);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch pending owners';
        console.error('Failed to fetch pending owners:', errorMsg, err.response?.data);
        // Continue with empty array if this fails
        setPendingOwners([]);
        if (!error) setError(`Warning: ${errorMsg}`);
      }

      // Fetch all stall owners (approved and rejected) - handle errors gracefully
      let owners = [];
      try {
        const allOwnersRes = await axios.get('http://localhost:3000/admin/owners/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        owners = allOwnersRes.data?.data || [];
        setAllOwners(owners);
      } catch (err) {
        console.error('Failed to fetch all owners:', err.response?.data || err.message);
        // Continue with empty array if this fails
        setAllOwners([]);
      }

      // Fetch stalls - handle errors gracefully
      let stallsData = [];
      try {
        const stallsRes = await axios.get('http://localhost:3000/api/stalls');
        stallsData = stallsRes.data?.data || stallsRes.data || [];
        setStalls(stallsData);
      } catch (err) {
        console.error('Failed to fetch stalls:', err.response?.data || err.message);
        setStalls([]);
      }

      // Fetch hawker centres - handle errors gracefully
      let hawkerData = [];
      try {
        const hawkerRes = await axios.get('http://localhost:3000/api/hawker-centres');
        hawkerData = hawkerRes.data?.data || hawkerRes.data || [];
        setHawkerCentres(hawkerData);
      } catch (err) {
        console.error('Failed to fetch hawker centres:', err.response?.data || err.message);
        setHawkerCentres([]);
      }

      // Calculate stats
      setStats({
        pendingOwners: pending.length,
        approvedOwners: owners.filter(o => o.approval_status === 'approved').length,
        totalStalls: stallsData.length,
        totalHawkerCentres: hawkerData.length
      });
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <div className="brand">
            <svg className="brand-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            <h1>Hawker Hub Admin</h1>
          </div>
          <div className="header-actions">
            <span className="admin-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {user?.name || user?.email}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {error && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#92400e',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
        )}
        <div className="welcome-section">
          <h2>Welcome back, {user?.name || 'Admin'}!</h2>
          <p>Manage stall owners, hawker centres, and system settings from here.</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon orange">⏳</div>
            <div className="stat-info">
              <h3>{loading ? '...' : stats.pendingOwners}</h3>
              <p>Pending Approvals</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div className="stat-info">
              <h3>{loading ? '...' : stats.approvedOwners}</h3>
              <p>Approved Owners</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">🏪</div>
            <div className="stat-info">
              <h3>{loading ? '...' : stats.totalStalls}</h3>
              <p>Total Stalls</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">📍</div>
            <div className="stat-info">
              <h3>{loading ? '...' : stats.totalHawkerCentres}</h3>
              <p>Hawker Centres</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'owners' ? 'active' : ''}`}
            onClick={() => setActiveTab('owners')}
          >
            Stall Owners
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stalls' ? 'active' : ''}`}
            onClick={() => setActiveTab('stalls')}
          >
            All Stalls
          </button>
          <button 
            className={`tab-btn ${activeTab === 'hawkers' ? 'active' : ''}`}
            onClick={() => setActiveTab('hawkers')}
          >
            Hawker Centres
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="dashboard-grid">
              {/* Pending Approvals Card */}
              <Link to="/admin/approvals" className="dashboard-card action-card">
                <div className="card-icon pending">
                  {stats.pendingOwners > 0 ? '🔔' : '✅'}
                </div>
                <div className="card-content">
                  <h3>Stall Owner Approvals</h3>
                  <p>
                    {stats.pendingOwners > 0 
                      ? `${stats.pendingOwners} pending request${stats.pendingOwners > 1 ? 's' : ''}`
                      : 'No pending requests'}
                  </p>
                </div>
                <div className="card-arrow">→</div>
                {stats.pendingOwners > 0 && (
                  <div className="notification-badge">{stats.pendingOwners}</div>
                )}
              </Link>

              {/* All Owners Card */}
              <div className="dashboard-card action-card" onClick={() => setActiveTab('owners')}>
                <div className="card-icon users">👥</div>
                <div className="card-content">
                  <h3>Manage Stall Owners</h3>
                  <p>{stats.approvedOwners} approved owners</p>
                </div>
                <div className="card-arrow">→</div>
              </div>

              {/* Stalls Card */}
              <div className="dashboard-card action-card" onClick={() => setActiveTab('stalls')}>
                <div className="card-icon stalls">🏪</div>
                <div className="card-content">
                  <h3>View All Stalls</h3>
                  <p>{stats.totalStalls} registered stalls</p>
                </div>
                <div className="card-arrow">→</div>
              </div>

              {/* Hawker Centres Card */}
              <div className="dashboard-card action-card" onClick={() => setActiveTab('hawkers')}>
                <div className="card-icon hawkers">📍</div>
                <div className="card-content">
                  <h3>Hawker Centres</h3>
                  <p>{stats.totalHawkerCentres} locations</p>
                </div>
                <div className="card-arrow">→</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-row">
                <Link to="/admin/approvals" className="quick-action-btn primary">
                  👥 Review Pending Approvals
                </Link>
                <Link to="/admin/stalls" className="quick-action-btn primary">
                  🏪 Manage Stalls
                </Link>
                <Link to="/" className="quick-action-btn secondary">
                  🏠 View Public Site
                </Link>
                <button className="quick-action-btn secondary" onClick={fetchAdminData}>
                  🔄 Refresh Data
                </button>
              </div>
            </div>

            {/* Recent Pending Approvals Preview */}
            {pendingOwners.length > 0 && (
              <div className="data-section">
                <div className="section-header">
                  <h3>
                    Recent Pending Approvals
                    <span className="count-badge">{pendingOwners.length}</span>
                  </h3>
                  <Link to="/admin/approvals" className="refresh-btn">
                    View All →
                  </Link>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Owner</th>
                      <th>Stall Name</th>
                      <th>Applied</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOwners.slice(0, 5).map((owner) => (
                      <tr key={owner.user_id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{getInitials(owner.name)}</div>
                            <div>
                              <strong>{owner.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{owner.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{owner.stall_name || 'Not specified'}</td>
                        <td>{formatDate(owner.created_at)}</td>
                        <td><span className="status-pill pending">⏳ Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Stall Owners Tab */}
        {activeTab === 'owners' && (
          <div className="data-section">
            <div className="section-header">
              <h3>
                All Stall Owners
                <span className="count-badge">{allOwners.length + pendingOwners.length}</span>
              </h3>
              <button className="refresh-btn" onClick={fetchAdminData}>
                🔄 Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
              </div>
            ) : [...pendingOwners, ...allOwners].length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>No stall owners registered yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Stall Name</th>
                    <th>Hawker Centre</th>
                    <th>Registered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pendingOwners, ...allOwners].map((owner) => (
                    <tr key={owner.user_id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{getInitials(owner.name)}</div>
                          <div>
                            <strong>{owner.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{owner.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{owner.stall_name || 'Not specified'}</td>
                      <td>{owner.hawker_centre_name || 'Not assigned'}</td>
                      <td>{formatDate(owner.created_at)}</td>
                      <td>
                        <span className={`status-pill ${owner.approval_status}`}>
                          {owner.approval_status === 'approved' && '✓ Approved'}
                          {owner.approval_status === 'pending' && '⏳ Pending'}
                          {owner.approval_status === 'rejected' && '✗ Rejected'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* All Stalls Tab */}
        {activeTab === 'stalls' && (
          <div className="data-section">
            <div className="section-header">
              <h3>
                All Stalls
                <span className="count-badge">{stalls.length}</span>
              </h3>
              <button className="refresh-btn" onClick={fetchAdminData}>
                🔄 Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
              </div>
            ) : stalls.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏪</div>
                <p>No stalls registered yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stall Name</th>
                    <th>Hawker Centre</th>
                    <th>Cuisine</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stalls.map((stall) => (
                    <tr key={stall.id}>
                      <td>
                        <strong>{stall.stall_name || stall.name}</strong>
                        {stall.stall_number && (
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>#{stall.stall_number}</div>
                        )}
                      </td>
                      <td>{stall.hawker_centres?.name || 'Not assigned'}</td>
                      <td>{stall.cuisine_types?.name || 'Not specified'}</td>
                      <td>
                        <span className={`status-pill ${stall.status === 'Active' ? 'active' : 'closed'}`}>
                          {stall.status === 'Active' ? '● Active' : '○ ' + (stall.status || 'Closed')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Hawker Centres Tab */}
        {activeTab === 'hawkers' && (
          <div className="data-section">
            <div className="section-header">
              <h3>
                Hawker Centres
                <span className="count-badge">{hawkerCentres.length}</span>
              </h3>
              <button className="refresh-btn" onClick={fetchAdminData}>
                🔄 Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
              </div>
            ) : hawkerCentres.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📍</div>
                <p>No hawker centres registered yet.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Total Stalls</th>
                    <th>Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hawkerCentres.map((hc) => (
                    <tr key={hc.id}>
                      <td><strong>{hc.name}</strong></td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hc.address || 'No address'}
                      </td>
                      <td>{hc.total_stalls || 0}</td>
                      <td>
                        {hc.rating ? (
                          <span>⭐ {parseFloat(hc.rating).toFixed(1)}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>No rating</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${hc.status === 'Active' ? 'active' : 'closed'}`}>
                          {hc.status === 'Active' ? '● Active' : '○ ' + (hc.status || 'Closed')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
