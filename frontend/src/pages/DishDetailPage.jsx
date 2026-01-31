import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ImageOff } from 'lucide-react';
import Header from '../components/Header';
import ShareButton from '../components/ShareButton';
import { getDishEmoji } from '../utils/shareUtils';
import './DishDetailPage.css';

const API_BASE = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE || 'http://localhost:3000';

const DishDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dish, setDish] = useState(null);
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/dishes/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((data) => {
        const d = data.data || data;
        setDish(d);
        if (d?.stall_id) {
          return fetch(`${API_BASE}/api/stalls/${d.stall_id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((sData) => {
              if (sData?.data) setStall(sData.data);
            })
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="dish-detail-page">
        <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />
        <main className="dish-detail-main">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="dish-detail-page">
        <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />
        <main className="dish-detail-main">
          <p>Dish not found</p>
          <Link to="/">Back to home</Link>
        </main>
      </div>
    );
  }

  const name = dish.name;
  const stallName = stall?.stall_name || stall?.stallName || stall?.name || 'this stall';
  const spiceEmoji = getDishEmoji(dish.spice_level);
  const meta = {
    name,
    stall_name: stallName,
    description: dish.description,
    image: dish.image_url || dish.image,
    spice_emoji: spiceEmoji,
  };

  return (
    <div className="dish-detail-page">
      <Helmet>
        <title>{name} at {stallName} | HawkerHub</title>
        <meta name="description" content={dish.description || `Try ${name} at ${stallName}`} />
        <meta property="og:title" content={`${name} at ${stallName} | HawkerHub`} />
        <meta property="og:description" content={dish.description || `Try ${name} at ${stallName}`} />
        <meta property="og:image" content={dish.image_url || dish.image || ''} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${name} at ${stallName} | HawkerHub`} />
        <meta name="twitter:description" content={dish.description || `Try ${name}`} />
        <meta name="twitter:image" content={dish.image_url || dish.image || ''} />
      </Helmet>

      <Header activeSection="menu" setActiveSection={() => {}} onCartClick={() => navigate('/cart')} />

      <main className="dish-detail-main">
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="dish-detail-card">
          <div className="dish-detail-image">
            {dish.image_url || dish.image ? (
              <img src={dish.image_url || dish.image} alt={name} />
            ) : (
              <div className="image-placeholder">
                <ImageOff size={48} />
                <span>No image</span>
              </div>
            )}
          </div>

          <div className="dish-detail-header">
            <h1>
              <span className="dish-emoji">{spiceEmoji}</span> {name}
            </h1>
            <div className="dish-detail-actions">
              <ShareButton type="dish" id={id} meta={meta} variant="button" />
            </div>
          </div>

          {stall && (
            <Link to={`/stalls/${dish.stall_id}`} className="dish-stall-link">
              At {stallName}
            </Link>
          )}

          {dish.price != null && (
            <p className="dish-price">${parseFloat(dish.price).toFixed(2)}</p>
          )}

          {dish.description && <p className="dish-detail-desc">{dish.description}</p>}

          {dish.stall_id && (
            <Link to={`/menu?stall=${dish.stall_id}`} className="view-menu-btn">
              Order from this stall
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export default DishDetailPage;
