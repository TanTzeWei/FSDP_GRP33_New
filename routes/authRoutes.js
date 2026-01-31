// OAuth Authentication Routes
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * OAuth Routes for Google and Facebook Authentication
 * 
 * Flow:
 * 1. User clicks "Login with Google/Facebook" button
 * 2. Frontend redirects to /api/auth/google or /api/auth/facebook
 * 3. User authenticates with provider
 * 4. Provider redirects back to /api/auth/google/callback or /api/auth/facebook/callback
 * 5. Backend generates JWT and redirects to frontend with token
 * 6. Frontend stores token and logs user in
 */

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: req.user.user_id || req.user.userId,
          email: req.user.email,
          role: req.user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remove sensitive data
      const { password, ...userWithoutPassword } = req.user;

      // Redirect to frontend with token and user data
      const userData = encodeURIComponent(JSON.stringify(userWithoutPassword));
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userData}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
    }
  }
);

// Facebook OAuth Routes
router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email'],
    session: false 
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=facebook_auth_failed`
  }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        {
          userId: req.user.user_id || req.user.userId,
          email: req.user.email,
          role: req.user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remove sensitive data
      const { password, ...userWithoutPassword } = req.user;

      // Redirect to frontend with token and user data
      const userData = encodeURIComponent(JSON.stringify(userWithoutPassword));
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${userData}`);
    } catch (error) {
      console.error('Facebook callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
    }
  }
);

// Test endpoint to check if OAuth is configured
router.get('/providers', (req, res) => {
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET)
  };

  res.json({
    success: true,
    providers,
    message: 'Available OAuth providers'
  });
});

module.exports = router;
