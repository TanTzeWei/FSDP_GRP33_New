import React, { useState } from 'react';
import axios from 'axios';

/**
 * PhotoUploadModal: Upload photos for a specific menu item
 * Handles file validation and upload progress
 */
export default function PhotoUploadModal({ isOpen, onClose, onSuccess, menuItem, stallId, hawkerCentreId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('dishName', menuItem.name);
      formData.append('stallId', stallId);
      formData.append('hawkerCentreId', hawkerCentreId);
      formData.append('description', `Photo for ${menuItem.name}`);

      // Upload to backend (adjust endpoint as needed)
      const response = await axios.post('/api/uploads/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      // Success - notify parent
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Reset and close
      setSelectedFile(null);
      setPreview(null);
      setUploadProgress(0);
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setPreview(null);
      setError('');
      setUploadProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{ 
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
      onClick={handleClose}
    >
      <div 
        style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '32px', 
          maxWidth: '500px', 
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#2d3748' }}>
          Upload Photo
        </h2>
        <p style={{ margin: '0 0 24px 0', color: '#718096', fontSize: '15px' }}>
          For: <strong>{menuItem?.name}</strong>
        </p>

        {/* File Input */}
        <div style={{ marginBottom: '20px' }}>
          <label 
            style={{ 
              display: 'block',
              padding: '40px 20px',
              border: '2px dashed #cbd5e0',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: preview ? '#f7fafc' : 'white',
              transition: 'all 0.2s ease'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.background = '#eef2ff';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.background = 'white';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#cbd5e0';
              e.currentTarget.style.background = 'white';
              if (!uploading && e.dataTransfer.files[0]) {
                handleFileSelect({ target: { files: e.dataTransfer.files } });
              }
            }}
          >
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            
            {preview ? (
              <div>
                <img 
                  src={preview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }} 
                />
                <div style={{ fontSize: '14px', color: '#4a5568', fontWeight: '600' }}>
                  {selectedFile?.name}
                </div>
                <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>
                  {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                <div style={{ fontSize: '15px', color: '#4a5568', fontWeight: '600', marginBottom: '4px' }}>
                  Click to upload or drag and drop
                </div>
                <div style={{ fontSize: '13px', color: '#718096' }}>
                  PNG, JPG, JPEG (max 5MB)
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#4a5568' }}>
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${uploadProgress}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ 
            background: '#fff5f5', 
            border: '2px solid #fc8181', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '20px',
            color: '#c53030',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Info Box */}
        <div style={{ 
          background: '#eef2ff', 
          border: '1px solid #c7d2fe', 
          borderRadius: '8px', 
          padding: '12px', 
          marginBottom: '20px',
          fontSize: '13px',
          color: '#4c51bf'
        }}>
          <strong>Note:</strong> Your photo will be reviewed and can be selected as the official menu photo once approved.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: '2px solid #e2e8f0',
              background: 'white',
              color: '#4a5568',
              fontSize: '15px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none',
              background: (!selectedFile || uploading) ? '#cbd5e0' : '#667eea',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer',
              boxShadow: (!selectedFile || uploading) ? 'none' : '0 4px 6px rgba(102,126,234,0.3)'
            }}
          >
            {uploading ? `Uploading ${uploadProgress}%` : 'Upload Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
