import React from 'react';
import Header from '../components/Header';

const ReservationsPage = () => {
  return (
    <div className="reservations-page">
      <Header activeSection="reservation" setActiveSection={() => {}} />
      <main style={{ padding: '24px' }}>
        <h2>Reservation</h2>
        <p>Reservation feature coming soon.</p>
      </main>
    </div>
  );
};

export default ReservationsPage;
