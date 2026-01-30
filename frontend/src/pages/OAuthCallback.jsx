import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * OAuth Callback Handler
 * Handles the redirect from OAuth providers (Google, Facebook)
 * Extracts token and user data from URL params and logs user in
 */

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userData = params.get('user');
    const error = params.get('error');

    if (error) {
      // Handle OAuth error
      console.error('OAuth error:', error);
      alert('Authentication failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token && userData) {
      try {
        // Parse user data
        const user = JSON.parse(decodeURIComponent(userData));

        // Log user in
        login({ user, token });

        // Redirect to home or intended page
        const intendedPath = localStorage.getItem('intendedPath') || '/';
        localStorage.removeItem('intendedPath');
        navigate(intendedPath);
      } catch (err) {
        console.error('Error parsing OAuth data:', err);
        alert('Authentication failed. Please try again.');
        navigate('/login');
      }
    } else {
      // Missing token or user data
      navigate('/login');
    }
  }, [location, login, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Completing sign in...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback;
