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
    description: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Populate form when editing existing item
  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name || '',
        price: menuItem.price || '',
        category: menuItem.category || '',
        description: menuItem.description || ''
      });
      setImagePreview(menuItem.image_url || null);
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        description: ''
      });
      setImagePreview(null);
      setImageFile(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ image: 'Please select a valid image file (JPEG, PNG, or WebP)' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ image: 'Image size must be less than 5MB' });
      return;
    }

    setImageFile(file);
    setErrors({ ...errors, image: null });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setErrors({ ...errors, image: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stall_id: stallId,
        imageFile: imageFile // Pass image file to onSave
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
              <option value="Mains">Mains</option>
              <option value="Sides">Sides</option>
              <option value="Drinks">Drinks</option>
              <option value="Desserts">Desserts</option>
              <option value="Appetizers">Appetizers</option>
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

          {/* Image Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4a5568', fontSize: '14px' }}>
              Menu Item Image
            </label>
            {imagePreview ? (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    width: '100%', 
                    maxHeight: '200px', 
                    objectFit: 'cover', 
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0'
                  }} 
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('image-upload').click()}
                style={{
                  border: errors.image ? '2px dashed #fc8181' : '2px dashed #e2e8f0',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#f9fafb',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <div style={{ color: '#4a5568', fontWeight: '500', marginBottom: '4px' }}>
                  Click to upload image
                </div>
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                  JPEG, PNG, WebP • Max 5MB
                </div>
              </div>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {errors.image && <div style={{ color: '#c53030', fontSize: '13px', marginTop: '4px' }}>{errors.image}</div>}
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
