import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function DashboardStallOwner(){
  const { user } = useContext(AuthContext);
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ 
    async function load(){
      if (!user?.stall_id) return;
      setLoading(true);
      try{
        const res = await axios.get(`http://localhost:3000/api/stalls/${user.stall_id}`);
        setStall(res.data?.data || res.data);
      }catch(e){
        console.warn('Failed to fetch stall', e.message);
      }finally{setLoading(false)}
    }
    load();
  },[user]);

  return (
    <div style={{padding:20}}>
      <h2>Stall Owner Dashboard</h2>
      <p>Welcome, {user?.name || user?.email}</p>
      {loading && <p>Loading stall...</p>}
      {!loading && !stall && <p>No stall associated with your account.</p>}
      {stall && (
        <div>
          <h3>{stall.stall_name || stall.name}</h3>
          <p>{stall.description}</p>
        </div>
      )}
    </div>
  );
}
