import React, { useState, useEffect } from 'react';

/**
 * MenuItemModal: Reusable modal for creating/editing menu items
 * Handles validation and provides clear feedback
 */
export default function MenuItemModal({ isOpen, onClose, onSave, menuItem = null, stallId }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    spice_level: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Populate form when editing existing item
  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name || '',
        price: menuItem.price || '',
        category: menuItem.category || '',
        description: menuItem.description || '',
        spice_level: menuItem.spice_level || ''
      });
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        description: '',
        spice_level: ''
      });
    }
    setErrors({});
  }, [menuItem, isOpen]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Menu item name is required';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stall_id: stallId
      };
      
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Error saving menu item:', err);
      setErrors({ submit: err.message || 'Failed to save menu item' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000,
      padding: '20px'
    }}
    onClick={onClose}
    >
      <div 
        style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '32px', 
          maxWidth: '600px', 
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>
          {menuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>
              Menu Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: errors.name ? '2px solid #fc8181' : '2px solid #e2e8f0',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="e.g., Chicken Rice"
            />
            {errors.name && <div style={{ color: '#c53030', fontSize: '13px', marginTop: '4px' }}>{errors.name}</div>}
          </div>

          {/* Price */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>
              Price (SGD) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: errors.price ? '2px solid #fc8181' : '2px solid #e2e8f0',
                fontSize: '15px',
                outline: 'none'
              }}
              placeholder="e.g., 5.50"
            />
            {errors.price && <div style={{ color: '#c53030', fontSize: '13px', marginTop: '4px' }}>{errors.price}</div>}
          </div>

          {/* Category */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: errors.category ? '2px solid #fc8181' : '2px solid #e2e8f0',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Select a category</option>
              <option value="Rice">Rice</option>
              <option value="Noodles">Noodles</option>
              <option value="BBQ">BBQ</option>
              <option value="Drinks">Drinks</option>
              <option value="Desserts">Desserts</option>
              <option value="Snacks">Snacks</option>
              <option value="Soup">Soup</option>
              <option value="Western">Western</option>
              <option value="Indian">Indian</option>
              <option value="Malay">Malay</option>
              <option value="Chinese">Chinese</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && <div style={{ color: '#c53030', fontSize: '13px', marginTop: '4px' }}>{errors.category}</div>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '2px solid #e2e8f0',
                fontSize: '15px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Describe your dish (optional)"
            />
          </div>

          {/* Spice Level */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>
              Spice Level
            </label>
            <select
              value={formData.spice_level}
              onChange={(e) => setFormData({ ...formData, spice_level: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '2px solid #e2e8f0',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Not specified</option>
              <option value="None">🟢 None</option>
              <option value="Mild">🟡 Mild</option>
              <option value="Medium">🟠 Medium</option>
              <option value="Hot">🔴 Hot</option>
              <option value="Extra Hot">🌶️ Extra Hot</option>
            </select>
          </div>

          {errors.submit && (
            <div style={{ background: '#fff5f5', border: '2px solid #fc8181', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#c53030', fontSize: '14px' }}>
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{ 
                padding: '12px 24px', 
                borderRadius: '8px', 
                border: '2px solid #e2e8f0',
                background: 'white',
                color: '#4a5568',
                fontSize: '15px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ 
                padding: '12px 24px', 
                borderRadius: '8px', 
                border: 'none',
                background: saving ? '#cbd5e0' : '#667eea',
                color: 'white',
                fontSize: '15px',
                fontWeight: '700',
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 4px 6px rgba(102,126,234,0.3)'
              }}
            >
              {saving ? 'Saving...' : menuItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
