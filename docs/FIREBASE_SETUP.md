# Firebase Setup Instructions

## Overview
This application has been updated to fetch user data directly from Firebase Firestore instead of relying on localStorage. This ensures that user data is always up-to-date and synchronized across all sessions.

## Changes Made

### Backend Changes
1. **Firebase Admin SDK Integration**: Added functions to fetch and save user data to/from Firestore
2. **Updated Authentication Endpoints**: Modified `/auth/login`, `/auth/google`, `/auth/me`, and `/auth/complete-profile` to use Firestore
3. **Removed localStorage Dependencies**: All user data is now fetched from the backend/Firestore

### Frontend Changes
1. **Updated authSlice**: Removed localStorage dependencies from login actions and reducers
2. **Added initializeAuth**: New thunk to fetch user data from backend on app initialization
3. **Updated App.js**: Modified UserInitializer to use initializeAuth instead of localStorage

## Firebase Configuration Setup

### Step 1: Get Firebase Service Account Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) > **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file

### Step 2: Configure Backend Environment
1. Open `backend/.env` file
2. Replace the placeholder values with your actual Firebase credentials:

```env
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-actual-service-account@your-project.iam.gserviceaccount.com
```

**Important Notes:**
- The private key must include the `\n` characters for line breaks
- Keep the quotes around the private key
- Make sure there are no extra spaces or characters

### Step 3: Firestore Database Setup
1. In Firebase Console, go to **Firestore Database**
2. Create a database (if not already created)
3. Set up security rules (for development, you can start with test mode)

### Step 4: Test the Setup
1. Start the backend server: `cd backend && node server.js`
2. Start the frontend: `cd frontend && npm start`
3. Try logging in - user data should now be fetched from Firestore

## How It Works Now

### Authentication Flow
1. User logs in through any method (email, Google, etc.)
2. Backend authenticates the user and fetches latest data from Firestore
3. Frontend receives complete user data from backend
4. On app initialization, `initializeAuth` fetches user data if token exists
5. No user data is stored in localStorage (only the JWT token)

### Data Synchronization
- **Login**: Fetches latest user data from Firestore
- **Profile Updates**: Saves to both MongoDB/memory and Firestore
- **App Initialization**: Fetches fresh user data from backend
- **Session Management**: Only JWT token is stored locally

## Benefits
1. **Always Fresh Data**: User data is always up-to-date
2. **Cross-Device Sync**: Changes reflect across all devices immediately
3. **No Stale Data**: Eliminates localStorage inconsistencies
4. **Better Security**: Sensitive data not stored in browser storage
5. **Scalability**: Centralized data management

## Troubleshooting

### "Firebase Admin SDK not configured" Error
- Check that all three Firebase environment variables are set correctly
- Verify the private key format (should include `\n` for line breaks)
- Ensure the service account has proper permissions

### User Data Not Updating
- Check browser console for API errors
- Verify Firestore security rules allow read/write
- Check backend logs for Firebase connection issues

### Authentication Issues
- Clear browser localStorage and cookies
- Check that JWT_SECRET is set in backend .env
- Verify Firebase project configuration