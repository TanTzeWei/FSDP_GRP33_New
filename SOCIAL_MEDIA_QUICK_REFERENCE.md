# Social Media Integration - Quick Reference

## 🎯 What's Been Created

### 1. Social Sharing Components
**Location:** `frontend/src/components/`
- `SocialShare.jsx` - Share button component
- `SocialShare.css` - Styling

**Usage:**
```jsx
<SocialShare 
  url="https://yourapp.com/stall/123"
  title="Check this out!"
  description="Amazing stall"
  imageUrl="https://example.com/image.jpg"
/>
```

---

### 2. Social Media Links Components
**Location:** `frontend/src/components/`
- `SocialMediaLinks.jsx` - Display social icons
- `SocialMediaLinks.css` - Styling

**Database Migration:** `migrations/add_stall_social_media.sql`

**Usage:**
```jsx
<SocialMediaLinks 
  facebook="https://facebook.com/page"
  instagram="https://instagram.com/profile"
  size="medium"
  showLabels={true}
/>
```

---

### 3. OAuth Login System
**Backend Files:**
- `config/passport.js` - OAuth strategies
- `routes/authRoutes.js` - OAuth routes
- `models/userModel.js` - Updated with OAuth methods

**Frontend Files:**
- `components/OAuthButtons.jsx` - Login buttons
- `components/OAuthButtons.css` - Styling
- `pages/OAuthCallback.jsx` - Handle OAuth redirect

**Database Migration:** `migrations/add_oauth_support.sql`

**Usage:**
```jsx
// In login page
<OAuthButtons />

// Add route in App.jsx
<Route path="/auth/callback" element={<OAuthCallback />} />
```

---

## ⚡ Quick Implementation

### Option 1: Just Social Sharing (5 minutes)
```jsx
// In any component
import SocialShare from '../components/SocialShare';

<SocialShare 
  url={window.location.href}
  title={pageTitle}
  description={description}
/>
```
✅ No setup needed - works immediately!

---

### Option 2: Add Social Links to Stalls (15 minutes)
1. Run migration: `migrations/add_stall_social_media.sql`
2. Use component:
```jsx
import SocialMediaLinks from '../components/SocialMediaLinks';

<SocialMediaLinks 
  facebook={stall.facebook_url}
  instagram={stall.instagram_url}
/>
```
3. See `examples/StallSocialMediaForm.jsx` for edit form

---

### Option 3: Full OAuth Login (1 hour)
1. Install: `npm install passport passport-google-oauth20 passport-facebook express-session`
2. Setup OAuth apps (Google/Facebook developer consoles)
3. Add to `.env`:
```env
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
FACEBOOK_APP_ID=your_id
FACEBOOK_APP_SECRET=your_secret
```
4. Run migration: `migrations/add_oauth_support.sql`
5. Update `app.js`:
```javascript
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');

app.use(passport.initialize());
app.use('/api/auth', authRoutes);
```
6. Add to login page:
```jsx
import OAuthButtons from '../components/OAuthButtons';
<OAuthButtons />
```

---

## 📁 File Structure

```
FSDP_GRP33_New/
├── migrations/
│   ├── add_stall_social_media.sql      ← Social links migration
│   └── add_oauth_support.sql            ← OAuth migration
├── config/
│   └── passport.js                      ← OAuth configuration
├── routes/
│   └── authRoutes.js                    ← OAuth routes
├── models/
│   └── userModel.js                     ← Updated with OAuth
├── frontend/src/
│   ├── components/
│   │   ├── SocialShare.jsx              ← Share buttons
│   │   ├── SocialShare.css
│   │   ├── SocialMediaLinks.jsx         ← Social icons
│   │   ├── SocialMediaLinks.css
│   │   ├── OAuthButtons.jsx             ← Login buttons
│   │   └── OAuthButtons.css
│   ├── pages/
│   │   └── OAuthCallback.jsx            ← OAuth handler
│   └── examples/
│       ├── StallDetailExample.jsx       ← Usage examples
│       ├── LoginPageExample.jsx
│       └── StallSocialMediaForm.jsx
└── Documentation/
    ├── SOCIAL_MEDIA_INTEGRATION.md      ← Overview
    └── SOCIAL_MEDIA_SETUP.md            ← Full setup guide
```

---

## 🚀 Recommended Start

### Phase 1: Social Sharing ⭐ START HERE
- No dependencies
- No database changes
- Works immediately
- High user value

### Phase 2: Social Media Links
- Simple database change
- Let stalls promote their socials
- No external APIs needed

### Phase 3: OAuth Login
- Most complex
- Requires OAuth app setup
- Great for user experience
- Implement only if needed

---

## 🔗 Key URLs to Add

### Development
```env
OAUTH_CALLBACK_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Production
```env
OAUTH_CALLBACK_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### OAuth Redirects to Configure
Google/Facebook Developer Consoles:
- `http://localhost:3000/api/auth/google/callback`
- `http://localhost:3000/api/auth/facebook/callback`
- `https://yourdomain.com/api/auth/google/callback`
- `https://yourdomain.com/api/auth/facebook/callback`

---

## 🧪 Test Commands

### Test Social Sharing
```bash
cd frontend
npm run dev
# Navigate to any page with SocialShare component
# Click share buttons
```

### Test OAuth
```bash
# Terminal 1 - Backend
node app.js

# Terminal 2 - Frontend
cd frontend
npm run dev

# Visit http://localhost:5173/login
# Click "Sign in with Google"
```

---

## 📞 Support

See the full documentation:
- [SOCIAL_MEDIA_SETUP.md](./SOCIAL_MEDIA_SETUP.md) - Complete setup guide
- [SOCIAL_MEDIA_INTEGRATION.md](./SOCIAL_MEDIA_INTEGRATION.md) - Overview

Example components in:
- `frontend/src/examples/`

---

## ✨ Features Summary

| Feature | Files Created | Setup Time | Database Changes | External APIs |
|---------|---------------|------------|------------------|---------------|
| Social Sharing | 2 | 5 min | None | None |
| Social Links | 4 | 15 min | Yes (simple) | None |
| OAuth Login | 8 | 1-2 hours | Yes | Google/Facebook |

**Recommendation:** Start with Social Sharing, add Social Links, then OAuth if needed!
