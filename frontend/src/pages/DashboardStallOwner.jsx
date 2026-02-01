import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import StallClosureSchedule from '../components/StallClosureSchedule';
import ClosureBadge from '../components/ClosureBadge';
import ReviewList from '../components/ReviewList';

export default function DashboardStallOwner(){
  const { user } = useContext(AuthContext);
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'closures', 'reviews'

  useEffect(()=>{ 
    async function load(){
      if (!user?.stall_id) return;
      setLoading(true);
      try{
        const res = await axios.get(`/api/stalls/${user.stall_id}`);
        setStall(res.data?.data || res.data);
      }catch(e){
        console.warn('Failed to fetch stall', e.message);
      }finally{setLoading(false)}
    }
    load();
  },[user]);

  return (
    <div style={{padding: 20}}>
      <h2>Stall Owner Dashboard</h2>
      <p>Welcome, {user?.name || user?.email}</p>
      
      {loading && <p>Loading stall...</p>}
      {!loading && !stall && <p>No stall associated with your account.</p>}
      
      {stall && (
        <div>
          <div style={{marginBottom: 20}}>
            <h3>{stall.stall_name || stall.name}</h3>
            <p>{stall.description}</p>
            
            {/* Closure Status Badge */}
            <div style={{marginTop: 15}}>
              <ClosureBadge 
                isClosed={stall.is_currently_closed} 
                closureInfo={stall.closure_info}
                showDetails={true}
                size="large"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '10px',
            borderBottom: '2px solid #eee',
            marginBottom: 20
          }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 15,
                color: activeTab === 'overview' ? '#ff6b6b' : '#666',
                borderBottom: activeTab === 'overview' ? '3px solid #ff6b6b' : '3px solid transparent',
                fontWeight: activeTab === 'overview' ? 600 : 400
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('closures')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 15,
                color: activeTab === 'closures' ? '#ff6b6b' : '#666',
                borderBottom: activeTab === 'closures' ? '3px solid #ff6b6b' : '3px solid transparent',
                fontWeight: activeTab === 'closures' ? 600 : 400
              }}
            >
              Closure Schedule
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 15,
                color: activeTab === 'reviews' ? '#ff6b6b' : '#666',
                borderBottom: activeTab === 'reviews' ? '3px solid #ff6b6b' : '3px solid transparent',
                fontWeight: activeTab === 'reviews' ? 600 : 400
              }}
            >
              Reviews
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
              <h4>Stall Details</h4>
              <p><strong>Opening Hours:</strong> {stall.opening_hours || 'Not set'}</p>
              <p><strong>Closing Hours:</strong> {stall.closing_hours || 'Not set'}</p>
              <p><strong>Operating Days:</strong> {stall.operating_days || 'Not set'}</p>
              <p><strong>Contact:</strong> {stall.contact_phone || 'Not set'}</p>
            </div>
          )}

          {activeTab === 'closures' && (
            <StallClosureSchedule stallId={user.stall_id} />
          )}

          {activeTab === 'reviews' && (
            <div>
              <h4>Customer Reviews & Ratings</h4>
              <p style={{ color: '#666', marginBottom: 16 }}>See what customers are saying about your stall.</p>
              <ReviewList
                entityType="stall"
                entityId={user.stall_id}
                limit={20}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
