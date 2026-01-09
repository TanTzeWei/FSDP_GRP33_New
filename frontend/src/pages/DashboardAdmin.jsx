import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function DashboardAdmin(){
  const { user } = useContext(AuthContext);
  return (
    <div style={{padding:20}}>
      <h2>Admin Dashboard</h2>
      <p>Welcome, {user?.name || user?.email}</p>
      <p>Use admin endpoints to manage owner approvals and system data.</p>
      <p><a href="/admin/approvals">View pending owner approvals</a></p>
    </div>
  );
}
