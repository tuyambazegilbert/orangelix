# 🔥 OrangeFlix — Complete Firebase & Authentication Setup Guide

This guide covers setting up **Firebase Authentication (Email/Password + Google + Google One Tap)** and **Cloud Firestore** for OrangeFlix.

---

## 1. Firebase Authentication Configuration

1. In the [Firebase Console](https://console.firebase.google.com/), open your project and go to **Build** > **Authentication**.
2. Under **Sign-in method**:
   - **Email/Password**: Enable **Email/Password** and click **Save**.
   - **Google**: Enable **Google**, select your support email, and click **Save**.
3. Under **Settings** > **User account linking**:
   - Ensure **"One account per email address"** is selected (recommended).
   - This ensures a user registering with password and later using Google with the same email address links directly to the same canonical Firebase UID.
4. Under **Settings** > **Authorized domains**:
   - Verify that your domains are added:
     - `localhost`
     - `127.0.0.1`
     - `orangeflix.vercel.app`
     - `<your-custom-domain>`

---

## 2. Google One Tap Setup (Optional for Instant Login)

To enable Google One Tap across OrangeFlix:
1. In Google Cloud Console or Firebase Console (Authentication > Sign-in method > Google), expand the Google configuration.
2. Copy the **Web Client ID** (e.g. `414690937567-xxxx.apps.googleusercontent.com`).
3. Add it to your `.env` and Vercel project environment variables:
   ```env
   VITE_GOOGLE_CLIENT_ID=414690937567-xxxxxxxxxx.apps.googleusercontent.com
   ```

---

## 3. Environment Variables Overview

Add the following to your local `.env` and Vercel Environment Variables:

```env
# TMDB API
VITE_TMDB_ACCESS_TOKEN=your_tmdb_bearer_token
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3

# Firebase Web App (Client Safe)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef

# Google One Tap (Public OAuth Web Client ID)
VITE_GOOGLE_CLIENT_ID=1234567890-abcdef.apps.googleusercontent.com

# Firebase Admin SDK (Server / CLI Setup Scripts Only - Never prefix with VITE_)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-app",...}'
```

---

## 4. Deploying Firestore Security Rules

Deploy the rules in `firestore.rules` via the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // 1. Users collection - Protected by Canonical UID
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // 2. User Profiles
    match /profiles/{userId} {
      allow read: if true;
      allow write: if isOwner(userId) || isAdmin();
    }

    // 3. Global Reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if (isAuthenticated() && resource.data.userId == request.auth.uid) || isAdmin();
    }

    // 4. Custom Media & Catalog overrides
    match /customMedia/{mediaId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // 5. Watchlists, Favorites & History
    match /watchlists/{userId}/items/{itemId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }

    match /favorites/{userId}/items/{itemId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }

    match /watchHistory/{userId}/items/{itemId} {
      allow read, write: if isOwner(userId) || isAdmin();
    }

    match /ratings/{userId}/items/{itemId} {
      allow read: if true;
      allow write: if isOwner(userId) || isAdmin();
    }

    // 6. Admin Logs & Promotions
    match /activityLogs/{logId} {
      allow read, write: if isAdmin();
    }

    match /promotions/{promoId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 5. Running Setup & Account Deduplication

```bash
# Initialize Firestore tables & seeds
node scripts/setup-firestore.js

# Audit & merge any duplicate accounts
node scripts/migrate-duplicate-users.js --dry-run
```

## 6. Secure admin provisioning

The application creates every new account as a member. After the account has
signed in once, promote a trusted operator from the Firebase Console by setting
`users/<uid>.isAdmin` to `true` and `role` to `admin`, then deploy the included
`firestore.rules`. Never grant administrator access based on an email address
in browser code, and never commit an Admin SDK private key to this repository.
