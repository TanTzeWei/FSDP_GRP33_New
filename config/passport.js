// OAuth Strategy Configuration for Google and Facebook
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const UserModel = require('../models/userModel');
require('dotenv').config();

/**
 * Setup Passport OAuth Strategies
 * 
 * Environment Variables Required:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - FACEBOOK_APP_ID
 * - FACEBOOK_APP_SECRET
 * - OAUTH_CALLBACK_URL (e.g., http://localhost:3000)
 */

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.user_id || user.userId);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000'}/api/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google OAuth profile:', profile.id);

          // Check if user exists with this OAuth ID
          let user = await UserModel.findUserByOAuth('google', profile.id);

          if (!user) {
            // Check if user exists with this email
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await UserModel.findUserByEmail(email);
              
              if (user) {
                // Link OAuth account to existing user
                await UserModel.linkOAuthAccount(user.user_id || user.userId, {
                  provider: 'google',
                  oauth_id: profile.id,
                  avatar_url: profile.photos?.[0]?.value,
                  email_verified: true
                });
              }
            }

            // Create new user if doesn't exist
            if (!user) {
              const result = await UserModel.createOAuthUser({
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                oauth_provider: 'google',
                oauth_id: profile.id,
                avatar_url: profile.photos?.[0]?.value,
                email_verified: true,
                role: 'customer'
              });
              user = result.user;
            }
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000'}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'photos', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('Facebook OAuth profile:', profile.id);

          // Check if user exists with this OAuth ID
          let user = await UserModel.findUserByOAuth('facebook', profile.id);

          if (!user) {
            // Check if user exists with this email
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await UserModel.findUserByEmail(email);
              
              if (user) {
                // Link OAuth account to existing user
                await UserModel.linkOAuthAccount(user.user_id || user.userId, {
                  provider: 'facebook',
                  oauth_id: profile.id,
                  avatar_url: profile.photos?.[0]?.value,
                  email_verified: true
                });
              }
            }

            // Create new user if doesn't exist
            if (!user) {
              const result = await UserModel.createOAuthUser({
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                oauth_provider: 'facebook',
                oauth_id: profile.id,
                avatar_url: profile.photos?.[0]?.value,
                email_verified: true,
                role: 'customer'
              });
              user = result.user;
            }
          }

          return done(null, user);
        } catch (error) {
          console.error('Facebook OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('Facebook OAuth not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.');
}

module.exports = passport;
