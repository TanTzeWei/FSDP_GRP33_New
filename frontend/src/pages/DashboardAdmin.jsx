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

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch all admin data
  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      // Fetch pending owners
      const pendingRes = await axios.get('http://localhost:3000/admin/owners/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pending = pendingRes.data?.data || [];
      setPendingOwners(pending);

      // Fetch all stall owners (approved and rejected)
      const allOwnersRes = await axios.get('http://localhost:3000/admin/owners/all', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { data: [] } }));
      const owners = allOwnersRes.data?.data || [];
      setAllOwners(owners);

      // Fetch stalls
      const stallsRes = await axios.get('http://localhost:3000/api/stalls');
      const stallsData = stallsRes.data?.data || [];
      setStalls(stallsData);

      // Fetch hawker centres
      const hawkerRes = await axios.get('http://localhost:3000/api/hawker-centres');
      const hawkerData = hawkerRes.data?.data || [];
      setHawkerCentres(hawkerData);

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
            <span className="brand-icon">🍜</span>
            <h1>Hawker Hub Admin</h1>
          </div>
          <div className="header-actions">
            <span className="admin-badge">👤 {user?.name || user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
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
