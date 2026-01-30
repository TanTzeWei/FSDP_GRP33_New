import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import './PromoManagement.css';

const PromoManagement = ({ stallId }) => {
    const { user } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);
    
    const [promos, setPromos] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        promo_name: '',
        description: '',
        food_item_id: '',
        discount_type: 'percentage',
        discount_value: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        loadPromos();
        loadDishes();
    }, [stallId]);

    const loadPromos = async () => {
        try {
            const response = await axios.get(`/api/promos/stall/${stallId}`);
            if (response.data.success) {
                setPromos(response.data.data);
            }
        } catch (error) {
            console.error('Error loading promos:', error);
        }
    };

    const loadDishes = async () => {
        try {
            const response = await axios.get(`/api/stalls/${stallId}/dishes`);
            if (response.data.success) {
                setDishes(response.data.data);
            } else if (Array.isArray(response.data.data)) {
                setDishes(response.data.data);
            }
        } catch (error) {
            console.error('Error loading dishes:', error);
            showToast('Failed to load menu items', 'error');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        const today = new Date().toISOString().split('T')[0];
        setFormData({
            promo_name: '',
            description: '',
            food_item_id: '',
            discount_type: 'percentage',
            discount_value: '',
            start_date: today,
            end_date: ''
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                stall_id: stallId,
                food_item_id: parseInt(formData.food_item_id),
                discount_value: parseFloat(formData.discount_value)
            };

            if (editingId) {
                const response = await axios.put(`/api/promos/${editingId}`, payload);
                if (response.data.success) {
                    showToast('Promotion updated successfully', 'success');
                    loadPromos();
                    resetForm();
                    setShowModal(false);
                }
            } else {
                const response = await axios.post('/api/promos', payload);
                if (response.data.success) {
                    showToast('Promotion created successfully', 'success');
                    loadPromos();
                    resetForm();
                    setShowModal(false);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            const message = error.response?.data?.message || 'An error occurred';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (promo) => {
        setEditingId(promo.id);
        setFormData({
            promo_name: promo.promo_name,
            description: promo.description || '',
            food_item_id: promo.food_item_id,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            start_date: promo.start_date?.split('T')[0] || '',
            end_date: promo.end_date?.split('T')[0] || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (promoId) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;

        try {
            const response = await axios.delete(`/api/promos/${promoId}`);
            if (response.data.success) {
                showToast('Promotion deleted successfully', 'success');
                loadPromos();
            }
        } catch (error) {
            console.error('Error deleting promo:', error);
            showToast('Failed to delete promotion', 'error');
        }
    };

    const isPromoCurrentlyActive = (promo) => {
        if (!promo.is_active) return false;
        const now = new Date();
        const startDate = new Date(promo.start_date);
        const endDate = new Date(promo.end_date);
        return now >= startDate && now <= endDate;
    };

    const getActiveFoodItemIds = () => {
        return new Set(
            promos
                .filter(p => isPromoCurrentlyActive(p))
                .map(p => p.food_item_id)
        );
    };

    const getDishName = (dishId) => {
        const dish = dishes.find(d => d.id === dishId);
        return dish?.name || 'Unknown Dish';
    };

    return (
        <div className="promo-management">
            <div className="promo-header">
                <h2>🏷️ Manage Promotions</h2>
                <button 
                    className="btn-primary" 
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    + Add New Promotion
                </button>
            </div>

            {/* Promotions List */}
            <div className="promos-list">
                {promos.length === 0 ? (
                    <p className="empty-state">No promotions yet. Create one to offer discounts!</p>
                ) : (
                    promos.map(promo => (
                        <div key={promo.id} className={`promo-card ${!promo.is_active ? 'inactive' : ''}`}>
                            <div className="promo-info">
                                <h3>{promo.promo_name}</h3>
                                <p className="dish-name">📍 {getDishName(promo.food_item_id)}</p>
                                {promo.description && <p className="description">{promo.description}</p>}
                                
                                <div className="promo-details">
                                    <span className="discount-badge">
                                        {promo.discount_type === 'percentage' 
                                            ? `${promo.discount_value}% OFF` 
                                            : `$${promo.discount_value} OFF`
                                        }
                                    </span>
                                    <span className="status-badge">
                                        {isPromoCurrentlyActive(promo) ? '✓ ACTIVE' : '✗ INACTIVE'}
                                    </span>
                                </div>

                                <div className="date-range">
                                    📅 {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="promo-actions">
                                <button 
                                    className="btn-edit"
                                    onClick={() => handleEdit(promo)}
                                >
                                    ✏️ Edit
                                </button>
                                <button 
                                    className="btn-delete"
                                    onClick={() => handleDelete(promo.id)}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingId ? 'Edit Promotion' : 'Create New Promotion'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="promo-form">
                            <div className="form-group">
                                <label htmlFor="promo_name">Promotion Name *</label>
                                <input
                                    type="text"
                                    id="promo_name"
                                    name="promo_name"
                                    value={formData.promo_name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Limited Time Deal"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="food_item_id">Food Item *</label>
                                <select
                                    id="food_item_id"
                                    name="food_item_id"
                                    value={formData.food_item_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a dish</option>
                                    {dishes && dishes.length > 0 ? (
                                        dishes.map(dish => {
                                            const hasActivePromo = getActiveFoodItemIds().has(dish.id);
                                            const isCurrentlyEditing = editingId && formData.food_item_id === String(dish.id);
                                            const isDisabled = hasActivePromo && !isCurrentlyEditing;
                                            
                                            return (
                                                <option 
                                                    key={dish.id} 
                                                    value={dish.id}
                                                    disabled={isDisabled}
                                                >
                                                    {dish.name}
                                                    {isDisabled ? ' (Active promo exists)' : ''}
                                                </option>
                                            );
                                        })
                                    ) : (
                                        <option disabled>No menu items available</option>
                                    )}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="discount_type">Discount Type *</label>
                                    <select
                                        id="discount_type"
                                        name="discount_type"
                                        value={formData.discount_type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="percentage">Percentage Discount (%)</option>
                                        <option value="fixed_amount">Fixed Amount ($)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="discount_value">
                                        Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'} *
                                    </label>
                                    <input
                                        type="number"
                                        id="discount_value"
                                        name="discount_value"
                                        value={formData.discount_value}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 20"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="start_date">Start Date *</label>
                                    <input
                                        type="date"
                                        id="start_date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="end_date">End Date *</label>
                                    <input
                                        type="date"
                                        id="end_date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancel"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-save"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : editingId ? 'Update Promotion' : 'Create Promotion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromoManagement;
