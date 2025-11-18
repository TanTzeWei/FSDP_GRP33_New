import React, { useState, useRef } from 'react';
import './PhotoUpload.css';

const PhotoUpload = ({ onUploadSuccess, onClose, embedded = false }) => {
  const [uploadState, setUploadState] = useState({
    file: null,
    preview: null,
    dishName: '',
    description: '',
    hawkerCentreId: '',
    stallId: '',
    isUploading: false,
    error: null
  });

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Mock hawker centres data (replace with real data from API)
  const hawkerCentres = [
    { id: 1, name: 'Maxwell Food Centre' },
    { id: 2, name: 'Lau Pa Sat' },
    { id: 3, name: 'Newton Food Centre' },
    { id: 4, name: 'Chinatown Complex' },
    { id: 5, name: 'Tekka Centre' },
    { id: 6, name: 'Tiong Bahru Market' }
  ];

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a valid image file (JPEG, PNG, or WebP)'
      }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size must be less than 5MB'
      }));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadState(prev => ({
        ...prev,
        file,
        preview: e.target.result,
        error: null
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setUploadState(prev => ({
      ...prev,
      [field]: value,
      error: null
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!uploadState.file) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a photo to upload'
      }));
      return;
    }

    if (!uploadState.dishName.trim()) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please enter a dish name'
      }));
      return;
    }

    if (!uploadState.hawkerCentreId) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a hawker centre'
      }));
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('photo', uploadState.file);
      formData.append('dishName', uploadState.dishName.trim());
      formData.append('description', uploadState.description.trim());
      formData.append('hawkerCentreId', uploadState.hawkerCentreId);
      
      if (uploadState.stallId) {
        formData.append('stallId', uploadState.stallId);
      }

      // Upload to backend
      const response = await fetch('http://localhost:3000/api/photos/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Success callback
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
        
        // Show success message
        alert('🎉 Photo uploaded successfully!');
        
        // Reset form
        setUploadState({
          file: null,
          preview: null,
          dishName: '',
          description: '',
          hawkerCentreId: '',
          stallId: '',
          isUploading: false,
          error: null
        });
        
        // Close modal
        if (onClose) {
          onClose();
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error.message || 'Failed to upload photo. Please try again.'
      }));
    }
  };

  // Remove selected file
  const removeFile = () => {
    setUploadState(prev => ({
      ...prev,
      file: null,
      preview: null,
      error: null
    }));
  };

  const content = (
    <div className={embedded ? "photo-upload-embedded" : "photo-upload-modal"}>
      {!embedded && (
        <div className="upload-header">
          <h2>📸 Share Your Food Experience</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Photo Upload Area */}
          <div className="upload-section">
            <h3>Upload Photo</h3>
            
            {!uploadState.preview ? (
              <div
                ref={dropZoneRef}
                className="drop-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-zone-content">
                  <div className="upload-icon">📷</div>
                  <h4>Drag & drop your photo here</h4>
                  <p>or click to browse files</p>
                  <div className="file-requirements">
                    <span>JPEG, PNG, WebP • Max 5MB</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="preview-container">
                <div className="image-preview">
                  <img src={uploadState.preview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-btn"
                    onClick={removeFile}
                  >
                    ×
                  </button>
                </div>
                <div className="file-info">
                  <span className="file-name">{uploadState.file?.name}</span>
                  <span className="file-size">
                    {(uploadState.file?.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </div>

          {/* Photo Details */}
          <div className="details-section">
            <h3>Photo Details</h3>
            
            <div className="form-group">
              <label htmlFor="dishName">
                Dish Name <span className="required">*</span>
              </label>
              <input
                id="dishName"
                type="text"
                placeholder="e.g. Chicken Rice, Laksa, Char Kway Teow"
                value={uploadState.dishName}
                onChange={(e) => handleInputChange('dishName', e.target.value)}
                disabled={uploadState.isUploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="hawkerCentre">
                Hawker Centre <span className="required">*</span>
              </label>
              <select
                id="hawkerCentre"
                value={uploadState.hawkerCentreId}
                onChange={(e) => handleInputChange('hawkerCentreId', e.target.value)}
                disabled={uploadState.isUploading}
              >
                <option value="">Select a hawker centre</option>
                {hawkerCentres.map(centre => (
                  <option key={centre.id} value={centre.id}>
                    {centre.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                placeholder="Tell us about this dish... What makes it special?"
                value={uploadState.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={uploadState.isUploading}
                rows={3}
              />
            </div>
          </div>

          {/* Error Message */}
          {uploadState.error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {uploadState.error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="upload-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={uploadState.isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="upload-btn"
              disabled={uploadState.isUploading || !uploadState.file}
            >
              {uploadState.isUploading ? (
                <>
                  <div className="loading-spinner"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <span className="upload-icon">📤</span>
                  Share Photo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
  );

  return embedded ? content : (
    <div className="photo-upload-overlay">
      {content}
    </div>
  );
};

export default PhotoUpload;