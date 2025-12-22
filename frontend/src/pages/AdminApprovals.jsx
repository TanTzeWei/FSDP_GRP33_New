import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminApprovals(){
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try{
      const res = await axios.get('http://localhost:3000/admin/owners/pending');
      setPending(res.data?.data || []);
    }catch(err){
      setError(err.response?.data?.message || 'Failed to fetch pending owners');
    }finally{setLoading(false)}
  }

  useEffect(()=>{ fetchPending(); }, []);

  const handleApprove = async (userId)=>{
    try{
      await axios.post(`http://localhost:3000/admin/owners/${userId}/approve`);
      fetchPending();
    }catch(err){
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (userId)=>{
    try{
      await axios.post(`http://localhost:3000/admin/owners/${userId}/reject`);
      fetchPending();
    }catch(err){
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <div style={{padding:20}}>
      <h2>Pending Owner Approvals</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && pending.length===0 && <p>No pending owner signups.</p>}
      <ul>
        {pending.map(p=> (
          <li key={p.user_id} style={{marginBottom:12}}>
            <strong>{p.name}</strong> — {p.email} — <em>{new Date(p.created_at).toLocaleString()}</em>
            <div style={{marginTop:6}}>
              <button onClick={()=>handleApprove(p.user_id)} style={{marginRight:8}}>Approve</button>
              <button onClick={()=>handleReject(p.user_id)}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
