import React, { useState, useEffect } from 'react';
import './ReservationHistory.css';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

const ReservationHistory = () => {
    const { user, token } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/reservations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch reservations');
            }

            const data = await response.json();
            setReservations(data.data || []);
        } catch (err) {
            setError(err.message);
            setToastMessage(err.message);
            setToastType('error');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReservation = async (reservationId) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/reservations/${reservationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to cancel reservation');
            }

            setReservations(prev =>
                prev.map(res =>
                    res.id === reservationId ? { ...res, status: 'Cancelled' } : res
                )
            );

            setToastMessage('Reservation cancelled successfully');
            setToastType('success');
            setShowToast(true);
        } catch (err) {
            setToastMessage(err.message);
            setToastType('error');
            setShowToast(true);
        }
    };

    const getFilteredReservations = () => {
        const now = new Date();

        return reservations.filter(res => {
            if (filter === 'all') return true;
            if (filter === 'upcoming') {
                const resDateTime = new Date(`${res.reservation_date}T${res.reservation_time}`);
                return resDateTime > now && res.status !== 'Cancelled';
            }
            if (filter === 'completed') return res.status === 'Completed';
            if (filter === 'cancelled') return res.status === 'Cancelled';
            return true;
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-SG', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    const getStatusBadgeClass = (status) => {
        return `status-badge status-${status.toLowerCase()}`;
    };

    const filteredReservations = getFilteredReservations();

    if (loading) {
        return <div className="loading-message">Loading reservations...</div>;
    }

    return (
        <div className="reservation-history-container">
            <div className="reservation-history-header">
                <h2>My Reservations</h2>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({reservations.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed
                    </button>
                    <button
                        className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setFilter('cancelled')}
                    >
                        Cancelled
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {filteredReservations.length === 0 ? (
                <div className="no-reservations">
                    <p>No reservations found</p>
                    <p className="text-muted">Make your first reservation today!</p>
                </div>
            ) : (
                <div className="reservations-list">
                    {filteredReservations.map(reservation => (
                        <div key={reservation.id} className="reservation-item">
                            <div className="reservation-header">
                                <div className="reservation-location">
                                    <h3>{reservation.hawker_centres?.name || 'Hawker Centre'}</h3>
                                    <p className="address">{reservation.hawker_centres?.address}</p>
                                </div>
                                <span className={getStatusBadgeClass(reservation.status)}>
                                    {reservation.status}
                                </span>
                            </div>

                            <div className="reservation-details">
                                <div className="detail-row">
                                    <span className="label">📅 Date & Time</span>
                                    <span className="value">
                                        {formatDate(reservation.reservation_date)} at {formatTime(reservation.reservation_time)}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span className="label">🪑 Table</span>
                                    <span className="value">
                                        Table {reservation.table_inventory?.table_number}
                                        {reservation.table_inventory?.location_description && (
                                            <span className="location-desc">
                                                ({reservation.table_inventory.location_description})
                                            </span>
                                        )}
                                    </span>
                                </div>

                                <div className="detail-row">
                                    <span className="label">👥 Party Size</span>
                                    <span className="value">{reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}</span>
                                </div>

                                {reservation.special_requests && (
                                    <div className="detail-row">
                                        <span className="label">📝 Special Requests</span>
                                        <span className="value">{reservation.special_requests}</span>
                                    </div>
                                )}

                                {reservation.contact_phone && (
                                    <div className="detail-row">
                                        <span className="label">📞 Contact</span>
                                        <span className="value">{reservation.contact_phone}</span>
                                    </div>
                                )}

                                <div className="detail-row">
                                    <span className="label">📅 Created</span>
                                    <span className="value">{formatDate(reservation.created_at)}</span>
                                </div>
                            </div>

                            <div className="reservation-actions">
                                {(reservation.status === 'Pending' || reservation.status === 'Confirmed') && (
                                    <button
                                        className="btn-cancel"
                                        onClick={() => handleCancelReservation(reservation.id)}
                                    >
                                        Cancel Reservation
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default ReservationHistory;
