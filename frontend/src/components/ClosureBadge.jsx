import React from 'react';
import './ClosureBadge.css';

export default function ClosureBadge({ isClosed, closureInfo, size = 'normal', showDetails = false }) {
  if (!isClosed) {
    return (
      <div className={`closure-badge open ${size}`}>
        <span className="closure-badge-icon">✅</span>
        <span className="closure-badge-text">Open Now</span>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getClosureMessage = () => {
    if (!closureInfo) return 'Closed';

    const endDate = new Date(closureInfo.end_date);
    const today = new Date();
    const isToday = endDate.toDateString() === today.toDateString();

    if (isToday) {
      return 'Closed Today';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = endDate.toDateString() === tomorrow.toDateString();

    if (isTomorrow) {
      return 'Closed Until Tomorrow';
    }

    return `Closed Until ${formatDate(closureInfo.end_date)}`;
  };

  const formatClosureType = (type) => {
    if (!type) return '';
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div>
      <div className={`closure-badge closed ${size}`}>
        <span className="closure-badge-icon">🔒</span>
        <span className="closure-badge-text">{getClosureMessage()}</span>
      </div>
      
      {showDetails && closureInfo && (
        <div className="closure-details">
          {closureInfo.closure_type && (
            <div>
              <strong>Type:</strong> {formatClosureType(closureInfo.closure_type)}
            </div>
          )}
          {closureInfo.reason && (
            <div>
              <strong>Reason:</strong> {closureInfo.reason}
            </div>
          )}
          {closureInfo.is_recurring && (
            <div>🔁 Recurring weekly closure</div>
          )}
        </div>
      )}
    </div>
  );
}
