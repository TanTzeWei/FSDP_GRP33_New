import React, { useState, useEffect } from 'react';
import './Reservation.css';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

const Reservation = ({ hawkerCentreId, onReservationCreated }) => {
    const { user, token } = useAuth();
    const [formData, setFormData] = useState({
        hawkerCentreId: hawkerCentreId || '',
        tableNumber: '',
        reservationDate: '',
        reservationTime: '',
        partySize: '2',
        specialRequests: '',
        contactPhone: ''
    });

    const [tables, setTables] = useState([]);
    const [availableTables, setAvailableTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // Fetch available tables when date/time changes
    useEffect(() => {
        if (formData.hawkerCentreId && formData.reservationDate && formData.reservationTime) {
            fetchAvailableTables();
        }
    }, [formData.hawkerCentreId, formData.reservationDate, formData.reservationTime]);

    // Fetch all tables for the hawker centre
    useEffect(() => {
        if (formData.hawkerCentreId) {
            fetchHawkerCentreTables();
        }
    }, [formData.hawkerCentreId]);

    const fetchHawkerCentreTables = async () => {
        try {
            const response = await fetch(
                `http://localhost:3000/api/hawker-centres/${formData.hawkerCentreId}/tables`
            );
            if (response.ok) {
                const data = await response.json();
                setTables(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
        }
    };

    const fetchAvailableTables = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                hawkerCentreId: formData.hawkerCentreId,
                reservationDate: formData.reservationDate,
                reservationTime: formData.reservationTime,
                duration: 120
            });

            const response = await fetch(
                `http://localhost:3000/api/reservations/available-tables?${params}`
            );

            if (response.ok) {
                const data = await response.json();
                setAvailableTables(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching available tables:', err);
            setError('Failed to load available tables');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validation
        if (!formData.hawkerCentreId || !formData.tableNumber || !formData.reservationDate || 
            !formData.reservationTime || !formData.partySize) {
            setError('Please fill in all required fields');
            return;
        }

        if (!user) {
            setError('You must be logged in to make a reservation');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    hawkerCentreId: parseInt(formData.hawkerCentreId),
                    tableId: parseInt(formData.tableNumber), // This should be the table ID
                    tableNumber: formData.tableNumber,
                    reservationDate: formData.reservationDate,
                    reservationTime: formData.reservationTime,
                    partySize: parseInt(formData.partySize),
                    specialRequests: formData.specialRequests || null,
                    contactPhone: formData.contactPhone || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create reservation');
            }

            const result = await response.json();
            setSuccess('Reservation created successfully!');
            setToastMessage('Reservation created successfully!');
            setToastType('success');
            setShowToast(true);

            // Reset form
            setFormData({
                hawkerCentreId: formData.hawkerCentreId,
                tableNumber: '',
                reservationDate: '',
                reservationTime: '',
                partySize: '2',
                specialRequests: '',
                contactPhone: ''
            });

            if (onReservationCreated) {
                onReservationCreated(result.data);
            }
        } catch (err) {
            setError(err.message);
            setToastMessage(err.message);
            setToastType('error');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const getSelectedTable = () => {
        return tables.find(t => t.id === parseInt(formData.tableNumber));
    };

    const selectedTable = getSelectedTable();

    return (
        <div className="reservation-container">
            <div className="reservation-card">
                <h2>Make a Reservation</h2>
                
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} className="reservation-form">
                    <div className="form-group">
                        <label>Hawker Centre *</label>
                        <input
                            type="number"
                            name="hawkerCentreId"
                            value={formData.hawkerCentreId}
                            onChange={handleInputChange}
                            placeholder="Enter hawker centre ID"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Reservation Date *</label>
                        <input
                            type="date"
                            name="reservationDate"
                            value={formData.reservationDate}
                            onChange={handleInputChange}
                            min={getMinDate()}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Reservation Time *</label>
                        <input
                            type="time"
                            name="reservationTime"
                            value={formData.reservationTime}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Table Number *</label>
                        {loading && formData.reservationDate && formData.reservationTime ? (
                            <div className="loading">Loading available tables...</div>
                        ) : availableTables.length > 0 ? (
                            <select
                                name="tableNumber"
                                value={formData.tableNumber}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select a table</option>
                                {availableTables.map(table => (
                                    <option key={table.id} value={table.id}>
                                        Table {table.table_number} (Seats: {table.seating_capacity})
                                        {table.location_description ? ` - ${table.location_description}` : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="no-tables">No tables available for this time</div>
                        )}
                    </div>

                    {selectedTable && (
                        <div className="table-info">
                            <p><strong>Table {selectedTable.table_number}</strong></p>
                            <p>Seating Capacity: {selectedTable.seating_capacity}</p>
                            {selectedTable.location_description && (
                                <p>Location: {selectedTable.location_description}</p>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Party Size *</label>
                        <select
                            name="partySize"
                            value={formData.partySize}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="1">1 Person</option>
                            <option value="2">2 People</option>
                            <option value="3">3 People</option>
                            <option value="4">4 People</option>
                            <option value="5">5 People</option>
                            <option value="6">6 People</option>
                            <option value="7">7 People</option>
                            <option value="8">8+ People</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Contact Phone</label>
                        <input
                            type="tel"
                            name="contactPhone"
                            value={formData.contactPhone}
                            onChange={handleInputChange}
                            placeholder="(Optional) Your contact number"
                        />
                    </div>

                    <div className="form-group">
                        <label>Special Requests</label>
                        <textarea
                            name="specialRequests"
                            value={formData.specialRequests}
                            onChange={handleInputChange}
                            placeholder="e.g., Near window, quiet corner, high chair needed..."
                            rows="3"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating Reservation...' : 'Create Reservation'}
                    </button>
                </form>
            </div>

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

export default Reservation;
