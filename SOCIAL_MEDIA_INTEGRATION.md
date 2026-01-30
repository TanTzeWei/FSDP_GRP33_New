# Social Media Integration Guide

## Overview
This guide covers implementing social media features for the hawker center application.

## Features to Implement

### 1. OAuth Authentication (Login with Google/Facebook)
**Benefits:**
- Easier signup/login for users
- Verified email addresses
- Better user experience

**Required Packages:**
```bash
npm install passport passport-google-oauth20 passport-facebook express-session
```

### 2. Social Sharing
**Features:**
- Share stalls/dishes to Facebook, Twitter, Instagram
- Share reservations with friends
- Generate share links with metadata

**Required Packages:**
```bash
npm install react-share
```

### 3. Social Media Links for Stalls
**Features:**
- Stall owners can add their social media profiles
- Display social icons on stall pages
- Drive traffic to stall social accounts

**Database Changes:**
```sql
ALTER TABLE stalls ADD COLUMN facebook_url VARCHAR(255);
ALTER TABLE stalls ADD COLUMN instagram_url VARCHAR(255);
ALTER TABLE stalls ADD COLUMN twitter_url VARCHAR(255);
```

## Implementation Steps

### Phase 1: Social Sharing (Easiest - Start Here)
1. Install react-share in frontend
2. Add share buttons to stall and dish pages
3. Configure Open Graph meta tags

### Phase 2: Social Media Links for Stalls
1. Update database schema
2. Add fields to stall profile form
3. Display social icons on stall pages

### Phase 3: OAuth Login (Most Complex)
1. Set up OAuth apps on Google/Facebook Developer Console
2. Install backend OAuth packages
3. Create OAuth routes
4. Update frontend login flow
5. Modify user model to support OAuth users

## Detailed Implementation Below
