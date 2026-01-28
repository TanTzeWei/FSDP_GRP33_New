import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StallClosureSchedule.css';

const ClosureModal = ({ isOpen, onClose, onSubmit, editingClosure, stallId }) => {
  const [formData, setFormData] = useState({
    closure_type: 'off_day',
    start_date: '',
    end_date: '',
    is_recurring: false,
    recurrence_pattern: null,
    reason: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingClosure) {
      setFormData({
        closure_type: editingClosure.closure_type,
        start_date: editingClosure.start_date?.split('T')[0] || '',
        end_date: editingClosure.end_date?.split('T')[0] || '',
        is_recurring: editingClosure.is_recurring || false,
        recurrence_pattern: editingClosure.recurrence_pattern,
        reason: editingClosure.reason || ''
      });
    } else {
      // Reset form for new closure
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        closure_type: 'off_day',
        start_date: today,
        end_date: today,
        is_recurring: false,
        recurrence_pattern: null,
        reason: ''
      });
    }
  }, [editingClosure, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate dates
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError('End date must be after start date');
        setSubmitting(false);
        return;
      }

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save closure');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="closure-modal-overlay" onClick={onClose}>
      <div className="closure-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingClosure ? 'Edit Closure' : 'Add New Closure'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Closure Type *</label>
            <select
              value={formData.closure_type}
              onChange={(e) => setFormData({ ...formData, closure_type: e.target.value })}
              required
            >
              <option value="off_day">Weekly Off Day</option>
              <option value="maintenance">Maintenance</option>
              <option value="public_holiday">Public Holiday</option>
              <option value="custom">Custom</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start Date *</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date *</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => {
                  const isRecurring = e.target.checked;
                  setFormData({
                    ...formData,
                    is_recurring: isRecurring,
                    recurrence_pattern: isRecurring 
                      ? { day_of_week: new Date(formData.start_date).getDay() }
                      : null
                  });
                }}
              />
              <label htmlFor="is_recurring">Recurring (Weekly)</label>
            </div>
            {formData.is_recurring && (
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                This closure will repeat every week on the same day
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Chinese New Year, Equipment Repair..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Saving...' : editingClosure ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function StallClosureSchedule({ stallId }) {
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'all'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClosure, setEditingClosure] = useState(null);

  useEffect(() => {
    if (stallId) {
      fetchClosures();
    }
  }, [stallId, activeTab]);

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      const token = authUser.token;
      const params = activeTab === 'upcoming' ? '?upcoming_only=true' : '';
      const response = await axios.get(
        `http://localhost:3000/api/stalls/${stallId}/closures${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClosures(response.data.data || []);
    } catch (error) {
      console.error('Error fetching closures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClosure = async (closureData) => {
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const token = authUser.token;
    await axios.post(
      `http://localhost:3000/api/stalls/${stallId}/closures`,
      closureData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchClosures();
  };

  const handleEditClosure = async (closureData) => {
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const token = authUser.token;
    await axios.put(
      `http://localhost:3000/api/stalls/${stallId}/closures/${editingClosure.id}`,
      closureData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setEditingClosure(null);
    fetchClosures();
  };

  const handleDeleteClosure = async (closureId) => {
    if (!confirm('Are you sure you want to delete this closure?')) return;

    try {
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      const token = authUser.token;
      await axios.delete(
        `http://localhost:3000/api/stalls/${stallId}/closures/${closureId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchClosures();
    } catch (error) {
      console.error('Error deleting closure:', error);
      alert('Failed to delete closure');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatClosureType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="stall-closure-schedule">
      <div className="closure-header">
        <h2>Closure Schedule</h2>
        <button className="add-closure-btn" onClick={() => {
          setEditingClosure(null);
          setIsModalOpen(true);
        }}>
          ➕ Add Closure
        </button>
      </div>

      <div className="closure-tabs">
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Closures
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading closures...</div>
      ) : closures.length === 0 ? (
        <div className="no-closures">
          <div className="no-closures-icon">📅</div>
          <h3>No closures scheduled</h3>
          <p>Click "Add Closure" to schedule off days or maintenance periods</p>
        </div>
      ) : (
        <div className="closures-list">
          {closures.map((closure) => (
            <div key={closure.id} className="closure-card">
              <div className="closure-card-header">
                <div>
                  <span className={`closure-type-badge ${closure.closure_type}`}>
                    {formatClosureType(closure.closure_type)}
                  </span>
                  {closure.is_recurring && (
                    <span className="recurring-badge">🔁 Recurring</span>
                  )}
                </div>
                <div className="closure-actions">
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setEditingClosure(closure);
                      setIsModalOpen(true);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteClosure(closure.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              <div className="closure-dates">
                <div>
                  <strong>Start:</strong> {formatDate(closure.start_date)}
                </div>
                <div>
                  <strong>End:</strong> {formatDate(closure.end_date)}
                </div>
              </div>

              {closure.reason && (
                <div className="closure-reason">
                  <strong>Reason:</strong> {closure.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ClosureModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClosure(null);
        }}
        onSubmit={editingClosure ? handleEditClosure : handleAddClosure}
        editingClosure={editingClosure}
        stallId={stallId}
      />
    </div>
  );
}
