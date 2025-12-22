import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function DashboardCustomer(){
  const { user } = useContext(AuthContext);
  return (
    <div style={{padding:20}}>
      <h2>Customer Dashboard</h2>
      <p>Welcome, {user?.name || user?.email}</p>
      <p>Use the app to browse stalls and place orders.</p>
    </div>
  );
}
