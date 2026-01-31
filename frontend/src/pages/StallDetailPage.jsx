import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Star, ArrowLeft, ImageOff } from 'lucide-react';
import Header from '../components/Header';
import ShareButton from '../components/ShareButton';
import ClosureBadge from '../components/ClosureBadge';
import './StallDetailPage.css';

const API_BASE = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE || 'http://localhost:3000';

const StallDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/stalls/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((data) => {
        const d = data.data || data;
        setStall(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="stall-detail-page">
        <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />
        <main className="stall-detail-main">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !stall) {
    return (
      <div className="stall-detail-page">
        <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />
        <main className="stall-detail-main">
          <p>Stall not found</p>
          <Link to="/">Back to home</Link>
        </main>
      </div>
    );
  }

  const name = stall.stall_name || stall.stallName || stall.name || 'Stall';
  const rating = stall.rating ? parseFloat(stall.rating).toFixed(1) : null;
  const meta = { name, rating, description: stall.description, image: stall.image_url || stall.image };

  return (
    <div className="stall-detail-page">
      <Helmet>
        <title>{name} | HawkerHub</title>
        <meta name="description" content={stall.description || `${name} — authentic hawker food`} />
        <meta property="og:title" content={`${name} | HawkerHub`} />
        <meta property="og:description" content={stall.description || name} />
        <meta property="og:image" content={stall.image_url || stall.image || ''} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${name} | HawkerHub`} />
        <meta name="twitter:description" content={stall.description || name} />
        <meta name="twitter:image" content={stall.image_url || stall.image || ''} />
      </Helmet>

      <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />

      <main className="stall-detail-main">
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="stall-detail-card">
          <div className="stall-detail-image">
            {stall.image_url || stall.image ? (
              <img src={stall.image_url || stall.image} alt={name} />
            ) : (
              <div className="image-placeholder">
                <ImageOff size={48} />
                <span>No image</span>
              </div>
            )}
          </div>

          <div className="stall-detail-header">
            <h1>{name}</h1>
            <div className="stall-detail-actions">
              <ShareButton type="stall" id={id} meta={meta} variant="button" />
            </div>
          </div>

          {stall.is_currently_closed && (
            <div className="stall-closure-row">
              <ClosureBadge isClosed={true} closureInfo={stall.closure_info} showDetails size="large" />
            </div>
          )}

          <div className="stall-detail-meta">
            {rating && (
              <span className="rating">
                <Star size={16} fill="currentColor" /> {rating} ({stall.total_reviews || 0} reviews)
              </span>
            )}
          </div>

          {stall.description && <p className="stall-detail-desc">{stall.description}</p>}

          <Link to={`/menu?stall=${id}`} className="view-menu-btn">
            View menu & order
          </Link>
        </div>
      </main>
    </div>
  );
};

export default StallDetailPage;
