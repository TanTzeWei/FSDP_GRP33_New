import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function StallDashboard() {
  const { user } = useContext(AuthContext);
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStall() {
      if (!user) return;
      const stallId = user.stallId || user.stall_id || null;
      if (!stallId) return;
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:3000/api/stalls/${stallId}`);
        setStall(res.data || res.data?.data || res.data?.stall || null);
      } catch (err) {
        setError('Failed to fetch stall data');
      } finally {
        setLoading(false);
      }
    }
    fetchStall();
  }, [user]);

  if (!user) return <div style={{padding:20}}>Please login as a stall owner to view this page.</div>;

  return (
    <div style={{padding:20}}>
      <h2>Stall Owner Dashboard</h2>
      <p>Welcome, {user.name || user.email}</p>
      {loading && <p>Loading stall...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && !stall && <p>No stall information found for your account.</p>}
      {stall && (
        <div>
          <h3>{stall.name || stall.title || `Stall #${stall.id || stall.stallId}`}</h3>
          <p>{stall.description || stall.cuisine_types?.map(c=>c.name).join(', ')}</p>
          <p>Hawker centre: {stall.hawker_centres?.name || stall.hawkerCentreName || '—'}</p>
          {/* Add management links/actions here: edit dishes, view orders, upload photos, etc. */}
        </div>
      )}
    </div>
  );
}

export default StallDashboard;
