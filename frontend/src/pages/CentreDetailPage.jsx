import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Star, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import ShareButton from '../components/ShareButton';
import './CentreDetailPage.css';

const API_BASE = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE || 'http://localhost:3000';

const CentreDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [centre, setCentre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/hawker-centres/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((data) => {
        const d = data.data || data;
        setCentre(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="centre-detail-page">
        <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />
        <main className="centre-detail-main">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !centre) {
    return (
      <div className="centre-detail-page">
        <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />
        <main className="centre-detail-main">
          <p>Centre not found</p>
          <Link to="/">Back to home</Link>
        </main>
      </div>
    );
  }

  const name = centre.name;
  const rating = centre.rating ? parseFloat(centre.rating).toFixed(1) : null;
  const meta = { name, rating, description: centre.description, image: centre.image_url };

  return (
    <div className="centre-detail-page">
      <Helmet>
        <title>{name} | HawkerHub</title>
        <meta name="description" content={centre.description || `${name} — authentic hawker food`} />
        <meta property="og:title" content={`${name} | HawkerHub`} />
        <meta property="og:description" content={centre.description || `${name} — ${centre.total_stalls || 0} stalls`} />
        <meta property="og:image" content={centre.image_url || ''} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${name} | HawkerHub`} />
        <meta name="twitter:description" content={centre.description || name} />
        <meta name="twitter:image" content={centre.image_url || ''} />
      </Helmet>

      <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />

      <main className="centre-detail-main">
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="centre-detail-card">
          {centre.image_url && (
            <div className="centre-detail-image">
              <img src={centre.image_url} alt={name} />
            </div>
          )}
          <div className="centre-detail-header">
            <h1>{name}</h1>
            <div className="centre-detail-actions">
              <ShareButton type="centre" id={id} meta={meta} variant="button" />
            </div>
          </div>

          <div className="centre-detail-meta">
            {rating && (
              <span className="rating">
                <Star size={16} fill="currentColor" /> {rating} ({centre.total_reviews || 0} reviews)
              </span>
            )}
            {(centre.address || centre.postal_code) && (
              <span className="address">
                <MapPin size={16} /> {centre.address} {centre.postal_code ? `S${centre.postal_code}` : ''}
              </span>
            )}
          </div>

          {centre.description && <p className="centre-detail-desc">{centre.description}</p>}

          {centre.stalls && centre.stalls.length > 0 && (
            <div className="centre-detail-stalls">
              <h3>Stalls</h3>
              <ul>
                {centre.stalls.slice(0, 10).map((s) => (
                  <li key={s.id}>
                    <Link to={`/stalls/${s.id}`}>{s.stall_name || s.name}</Link>
                    {s.rating && <span className="stall-rating">⭐ {s.rating}</span>}
                  </li>
                ))}
              </ul>
              <Link to={`/menu?stall=${centre.stalls[0]?.id}`} className="view-menu-btn">
                View menu
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CentreDetailPage;
