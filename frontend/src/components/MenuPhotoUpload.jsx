import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './MenuPhotoUpload.css';

const MenuPhotoUpload = ({ onUploadSuccess, onClose, embedded = false }) => {
  const { user } = useContext(AuthContext);
  const [uploadState, setUploadState] = useState({
    file: null,
    preview: null,
    dishName: '',
    description: '',
    price: '',
    category: '',
    spiceLevel: 'mild',
    hawkerCentreId: '',
    stallId: '',
    dietaryInfo: [],
    isUploading: false,
    error: null
  });

  const [hawkerCentres, setHawkerCentres] = useState([]);
  const [stalls, setStalls] = useState([]);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'No Pork'];
  const spiceLevels = ['mild', 'medium', 'hot', 'very hot'];
  const categories = ['Rice', 'Noodles', 'Soup', 'Seafood', 'Meat', 'Vegetable', 'Dessert', 'Beverage', 'Other'];

  // Fetch hawker centres on mount
  useEffect(() => {
    fetchHawkerCentres();
  }, []);

  // Fetch stalls when hawker centre changes
  useEffect(() => {
    if (uploadState.hawkerCentreId) {
      fetchStalls(uploadState.hawkerCentreId);
    } else {
      setStalls([]);
      setUploadState(prev => ({ ...prev, stallId: '' }));
    }
  }, [uploadState.hawkerCentreId]);

  const fetchHawkerCentres = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/hawker-centres');
      const result = await response.json();
      
      console.log('Hawker centres fetch result:', result); // Debug log
      
      if (result.success && Array.isArray(result.data)) {
        setHawkerCentres(result.data);
      } else {
        console.warn('No hawker centres found in database');
        setHawkerCentres([]);
      }
    } catch (error) {
      console.error('Error fetching hawker centres:', error);
      setHawkerCentres([]);
      setUploadState(prev => ({ 
        ...prev, 
        error: 'Could not load hawker centres. Please check if the server is running.' 
      }));
    }
  };

  const fetchStalls = async (hawkerCentreId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/hawker-centres/${hawkerCentreId}`);
      const result = await response.json();
      
      console.log('Stalls fetch result:', result); // Debug log
      
      if (result.success && result.data && Array.isArray(result.data.stalls)) {
        // Use the stalls from the database
        setStalls(result.data.stalls);
      } else {
        // No stalls found for this hawker centre
        console.warn('No stalls found for hawker centre:', hawkerCentreId);
        setStalls([]);
      }
    } catch (error) {
      console.error('Error fetching stalls:', error);
      // On error, set empty array and let user know
      setStalls([]);
      setUploadState(prev => ({ 
        ...prev, 
        error: 'Could not load stalls. Please check if the server is running.' 
      }));
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a valid image file (JPEG, PNG, or WebP)'
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'File size must be less than 5MB'
      }));
      return;
    }

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

  // Handle dietary info changes
  const handleDietaryChange = (option) => {
    setUploadState(prev => ({
      ...prev,
      dietaryInfo: prev.dietaryInfo.includes(option)
        ? prev.dietaryInfo.filter(item => item !== option)
        : [...prev.dietaryInfo, option],
      error: null
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Upload attempt - Current user:', user);

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

    if (!uploadState.price || isNaN(parseFloat(uploadState.price))) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please enter a valid price'
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

    if (!uploadState.stallId) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a stall'
      }));
      return;
    }

    if (!uploadState.category) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select a category'
      }));
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('photo', uploadState.file);
      formData.append('dishName', uploadState.dishName.trim());
      formData.append('description', uploadState.description.trim());
      formData.append('price', parseFloat(uploadState.price));
      formData.append('category', uploadState.category);
      formData.append('spiceLevel', uploadState.spiceLevel);
      formData.append('hawkerCentreId', uploadState.hawkerCentreId);
      formData.append('stallId', uploadState.stallId);
      formData.append('dietaryInfo', JSON.stringify(uploadState.dietaryInfo));

      const response = await fetch('http://localhost:3000/api/menu-photos/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      // Check for auth errors or other failures
      if (!response.ok || !result.success) {
        throw new Error(result.message || `Upload failed with status ${response.status}`);
      }

      if (result.success) {
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
        
        alert('🎉 Menu item photo uploaded successfully!');
        
        setUploadState({
          file: null,
          preview: null,
          dishName: '',
          description: '',
          price: '',
          category: '',
          spiceLevel: 'mild',
          hawkerCentreId: '',
          stallId: '',
          dietaryInfo: [],
          isUploading: false,
          error: null
        });
        
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
    <div className={embedded ? "menu-upload-embedded" : "menu-upload-modal"}>
      {!embedded && (
        <div className="menu-upload-header">
          <h2>📱 Add Menu Item Photo</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="menu-upload-form">
        {/* Photo Upload Area */}
        <div className="upload-section">
          <h3>Upload Menu Photo</h3>
          
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
                <h4>Drag & drop your menu photo here</h4>
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

        {/* Menu Item Details */}
        <div className="details-section">
          <h3>Menu Item Details</h3>
          
          <div className="form-row">
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
              <label htmlFor="stall">
                Stall <span className="required">*</span>
              </label>
              <select
                id="stall"
                value={uploadState.stallId}
                onChange={(e) => handleInputChange('stallId', e.target.value)}
                disabled={uploadState.isUploading || !uploadState.hawkerCentreId}
              >
                <option value="">Select a stall</option>
                {stalls.map(stall => (
                  <option key={stall.id} value={stall.id}>
                    {stall.stall_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dishName">
                Dish Name <span className="required">*</span>
              </label>
              <input
                id="dishName"
                type="text"
                placeholder="e.g. Chicken Rice, Laksa"
                value={uploadState.dishName}
                onChange={(e) => handleInputChange('dishName', e.target.value)}
                disabled={uploadState.isUploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">
                Price (SGD) <span className="required">*</span>
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 5.50"
                value={uploadState.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                disabled={uploadState.isUploading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                value={uploadState.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={uploadState.isUploading}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="spiceLevel">Spice Level</label>
              <select
                id="spiceLevel"
                value={uploadState.spiceLevel}
                onChange={(e) => handleInputChange('spiceLevel', e.target.value)}
                disabled={uploadState.isUploading}
              >
                {spiceLevels.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Describe the dish... (e.g. ingredients, taste, preparation method)"
              value={uploadState.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={uploadState.isUploading}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Dietary Information</label>
            <div className="dietary-checkboxes">
              {dietaryOptions.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={uploadState.dietaryInfo.includes(option)}
                    onChange={() => handleDietaryChange(option)}
                    disabled={uploadState.isUploading}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
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
                Add to Menu
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return embedded ? content : (
    <div className="menu-upload-overlay">
      {content}
    </div>
  );
};

export default MenuPhotoUpload;
