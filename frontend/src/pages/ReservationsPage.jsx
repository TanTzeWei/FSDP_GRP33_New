import React, { useState } from 'react';
import './ReservationsPage.css';
import Header from '../components/Header';
import Reservation from '../components/Reservation';
import ReservationHistory from '../components/ReservationHistory';

const ReservationsPage = () => {
    const [activeTab, setActiveTab] = useState('make'); // 'make' or 'history'

    return (
        <div className="reservations-page">
            <Header />
            
            <div className="reservations-content">
                <div className="reservations-tabs">
                    <button
                        className={`tab-button ${activeTab === 'make' ? 'active' : ''}`}
                        onClick={() => setActiveTab('make')}
                    >
                        <span className="tab-icon">📅</span>
                        Make a Reservation
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <span className="tab-icon">📋</span>
                        My Reservations
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'make' && (
                        <div className="tab-pane active">
                            <Reservation onReservationCreated={() => setActiveTab('history')} />
                        </div>
                    )}
                    {activeTab === 'history' && (
                        <div className="tab-pane active">
                            <ReservationHistory />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationsPage;
