import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import './PhotoUpload.css';

const PhotoUpload = ({ onUploadSuccess, onClose, embedded = false }) => {
  const { user } = useContext(AuthContext);
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

  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [stalls, setStalls] = useState([]);

  // Fetch hawker centres on mount
  useEffect(() => {
    const fetchHawkerCentres = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/hawker-centres');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setHawkerCentres(json.data || []);
        } else {
          setHawkerCentres([
            { id: 101, name: 'Maxwell Food Centre' },
            { id: 102, name: 'Lau Pa Sat' },
            { id: 103, name: 'Tiong Bahru Market' }
          ]);
        }
      } catch (e) {
        console.error('Error fetching hawker centres:', e);
        setHawkerCentres([
          { id: 101, name: 'Maxwell Food Centre' },
          { id: 102, name: 'Lau Pa Sat' },
          { id: 103, name: 'Tiong Bahru Market' }
        ]);
      }
    };

    fetchHawkerCentres();
  }, []);

  // Fetch stalls when hawker centre changes
  useEffect(() => {
    const fetchStalls = async (centreId) => {
      if (!centreId) {
        setStalls([]);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3000/api/hawker-centres/${centreId}`);
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.stalls) && json.data.stalls.length > 0) {
          setStalls(json.data.stalls);
        } else {
          const examples = {
            101: [
              { id: 1001, stall_name: "Ah Lim's Chinese Stall" },
              { id: 1002, stall_name: 'Peranakan Kitchen' }
            ],
            102: [
              { id: 2001, stall_name: 'Warung Pak Hasan' },
              { id: 2002, stall_name: 'Mumbai Spice Corner' }
            ],
            103: [
              { id: 3001, stall_name: 'Fresh Drinks Bar' },
              { id: 3002, stall_name: 'Western Grill House' }
            ]
          };
          setStalls(examples[centreId] || []);
        }
      } catch (e) {
        console.error('Error fetching stalls:', e);
        const examples = {
          101: [
            { id: 1001, stall_name: "Ah Lim's Chinese Stall" },
            { id: 1002, stall_name: 'Peranakan Kitchen' }
          ],
          102: [
            { id: 2001, stall_name: 'Warung Pak Hasan' },
            { id: 2002, stall_name: 'Mumbai Spice Corner' }
          ],
          103: [
            { id: 3001, stall_name: 'Fresh Drinks Bar' },
            { id: 3002, stall_name: 'Western Grill House' }
          ]
        };
        setStalls(examples[centreId] || []);
      }
    };

    // Reset stall selection when hawker centre changes
    setUploadState(prev => ({ ...prev, stallId: '' }));
    if (uploadState.hawkerCentreId) fetchStalls(uploadState.hawkerCentreId);
    else setStalls([]);
  }, [uploadState.hawkerCentreId]);

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

    console.log('PhotoUpload attempt - Current user:', user);

    // Check if user is guest
    if (user?.isGuest === true) {
      console.log('Guest upload blocked');
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: 'Guests cannot upload photos. Please sign up or log in to continue.'
      }));
      return;
    }

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

      // Check for auth errors or other failures
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Upload failed with status ${response.status}`);
      }

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
              <label htmlFor="stall">Stall (Optional)</label>
              <select
                id="stall"
                value={uploadState.stallId}
                onChange={(e) => handleInputChange('stallId', e.target.value)}
                disabled={uploadState.isUploading || stalls.length === 0}
              >
                <option value="">Select a stall (optional)</option>
                {stalls.map(stall => (
                  <option key={stall.id} value={stall.id}>
                    {stall.stall_name || stall.name || `Stall ${stall.id}`}
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