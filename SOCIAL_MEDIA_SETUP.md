# Social Media Integration - Complete Setup Guide

## 📋 Overview

This guide covers three types of social media integration:
1. **Social Sharing** - Share content to social platforms
2. **Social Media Links** - Display stall social media profiles
3. **OAuth Login** - Sign in with Google/Facebook

---

## 🚀 Quick Start (Recommended Order)

### Phase 1: Social Sharing (15 minutes)
✅ No database changes needed
✅ No API keys required
✅ Works immediately

### Phase 2: Social Media Links (30 minutes)
✅ Simple database migration
✅ No external APIs needed

### Phase 3: OAuth Login (1-2 hours)
⚠️ Requires OAuth app setup
⚠️ Needs database migration
⚠️ Requires environment variables

---

## 1️⃣ Social Sharing Implementation

### Files Created:
- `frontend/src/components/SocialShare.jsx`
- `frontend/src/components/SocialShare.css`

### Usage Example:

```jsx
import SocialShare from '../components/SocialShare';

// In your Stall page component
<SocialShare 
  url={`https://yourapp.com/stall/${stallId}`}
  title={`Check out ${stallName}!`}
  description={`Delicious food at ${hawkerCentreName}`}
  imageUrl={stallImageUrl}
/>

// In your Dish/Menu page
<SocialShare 
  url={`https://yourapp.com/dish/${dishId}`}
  title={`Try ${dishName}!`}
  description={`${description} - Only $${price}`}
  imageUrl={dishImageUrl}
/>
```

### Testing:
1. Add the component to any page
2. Click share buttons to test
3. No configuration needed!

---

## 2️⃣ Social Media Links Implementation

### Step 1: Run Database Migration

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f migrations/add_stall_social_media.sql
```

Or manually execute in Supabase:
```sql
ALTER TABLE stalls 
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
```

### Step 2: Update Stall Controller

Add to `controllers/stallController.js`:

```javascript
static async updateStallSocialMedia(req, res) {
    try {
        const stallId = req.params.stallId;
        const { facebook_url, instagram_url, twitter_url, tiktok_url, website_url } = req.body;

        const { data, error } = await supabase
            .from('stalls')
            .update({
                facebook_url,
                instagram_url,
                twitter_url,
                tiktok_url,
                website_url
            })
            .eq('stall_id', stallId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, stall: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
```

### Step 3: Add Route

Add to your stall routes:
```javascript
router.put('/:stallId/social-media', authMiddleware, stallController.updateStallSocialMedia);
```

### Step 4: Use the Component

```jsx
import SocialMediaLinks from '../components/SocialMediaLinks';

// On stall profile page
<SocialMediaLinks 
  facebook={stall.facebook_url}
  instagram={stall.instagram_url}
  twitter={stall.twitter_url}
  tiktok={stall.tiktok_url}
  website={stall.website_url}
  size="medium"
  showLabels={true}
/>
```

---

## 3️⃣ OAuth Login Implementation

### Step 1: Install Dependencies

```bash
cd c:\NP\Y2S2\FSDP\FSDP_GRP33_New
npm install passport passport-google-oauth20 passport-facebook express-session
```

### Step 2: Setup Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Set Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://yourdomain.com/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

### Step 3: Setup Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (select "Consumer" type)
3. Add **Facebook Login** product
4. Go to Settings → Basic
5. Copy **App ID** and **App Secret**
6. Go to Facebook Login → Settings
7. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/facebook/callback`
   - `https://yourdomain.com/api/auth/facebook/callback`

### Step 4: Run Database Migration

```sql
-- Run migrations/add_oauth_support.sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth 
ON users(oauth_provider, oauth_id) 
WHERE oauth_provider IS NOT NULL;
```

### Step 5: Update .env File

Add to your `.env`:
```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
OAUTH_CALLBACK_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Step 6: Update app.js

Add to `app.js` BEFORE other routes:

```javascript
const passport = require('./config/passport');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');

// Session configuration (needed for Passport)
app.use(session({
    secret: process.env.JWT_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// OAuth routes
app.use('/api/auth', authRoutes);
```

### Step 7: Update Frontend Routes

Add to your frontend router (e.g., `App.jsx` or router config):

```jsx
import OAuthCallback from './pages/OAuthCallback';

// Add this route
<Route path="/auth/callback" element={<OAuthCallback />} />
```

### Step 8: Add OAuth Buttons to Login Page

Update your login page:

```jsx
import OAuthButtons from '../components/OAuthButtons';

// In your login form, add:
<OAuthButtons />

// Place it after your regular login form or between form elements
```

### Step 9: Test OAuth Flow

1. Start backend: `node app.js`
2. Start frontend: `cd frontend && npm run dev`
3. Go to login page
4. Click "Sign in with Google" or "Sign in with Facebook"
5. Complete OAuth flow
6. Check if you're redirected back and logged in

---

## 🧪 Testing Checklist

### Social Sharing
- [ ] Share buttons appear on page
- [ ] Clicking Facebook opens Facebook share dialog
- [ ] Clicking WhatsApp opens WhatsApp with message
- [ ] Copy link button copies URL to clipboard
- [ ] Native share works on mobile devices

### Social Media Links
- [ ] Database columns added successfully
- [ ] Can save social media URLs in stall profile
- [ ] Social icons display on stall page
- [ ] Clicking icons opens correct social media pages
- [ ] Icons only show for URLs that are set

### OAuth Login
- [ ] Google OAuth redirects to Google login
- [ ] Can sign in with Google account
- [ ] User is created in database with OAuth data
- [ ] JWT token is generated correctly
- [ ] User is redirected back to app after login
- [ ] Same for Facebook OAuth
- [ ] Existing users can link OAuth accounts

---

## 🐛 Troubleshooting

### OAuth Issues

**"Redirect URI mismatch"**
- Make sure redirect URIs in Google/Facebook console match exactly
- Include both localhost and production URLs

**"OAuth not configured"**
- Check `.env` file has all OAuth credentials
- Restart backend server after adding env variables
- Check console for configuration warnings

**"Passport serialize error"**
- Make sure `findUserById` method exists in UserModel
- Check database has `oauth_provider` and `oauth_id` columns

**"Session not working"**
- Express-session must be configured before Passport
- Check session secret is set in environment

### Social Sharing Issues

**"Share dialog not opening"**
- Check if popup blockers are enabled
- Try on different browsers
- Test URL encoding

**"Wrong content in share"**
- Add Open Graph meta tags to your HTML
- Verify URLs are absolute, not relative

---

## 📦 Dependencies Summary

### Backend
```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "passport-facebook": "^3.0.0",
  "express-session": "^1.18.0"
}
```

### Frontend
No additional dependencies needed! All components use vanilla React.

---

## 🔒 Security Considerations

1. **OAuth Secrets**: Never commit OAuth secrets to git
2. **HTTPS**: Use HTTPS in production for OAuth
3. **CORS**: Configure CORS properly for OAuth redirects
4. **Session**: Use secure session configuration in production
5. **JWT**: Keep JWT_SECRET secure and random

---

## 🎨 Customization

### Styling Social Share Buttons
Edit `SocialShare.css` to match your theme:
```css
.share-btn.facebook {
  background: #your-brand-color;
}
```

### Adding More OAuth Providers
1. Install provider's Passport strategy
2. Add configuration to `config/passport.js`
3. Add routes to `routes/authRoutes.js`
4. Add button to `OAuthButtons.jsx`

---

## 📚 Additional Resources

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Open Graph Protocol](https://ogp.me/)

---

## ✅ Summary

You now have THREE social media features:

1. ✅ **Social Sharing** - Let users share stalls/dishes
2. ✅ **Social Links** - Display stall social media profiles  
3. ✅ **OAuth Login** - Sign in with Google/Facebook

Start with Social Sharing (easiest), then add Social Links, and finally OAuth if needed!
