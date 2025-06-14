# WorkLink Setup Instructions

## Overview
This guide will help you configure Firebase Authentication and MongoDB for the WorkLink application.

## Prerequisites
- Node.js installed
- MongoDB installed (optional - app can run with in-memory storage)
- Firebase project created

## Firebase Configuration

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `workrklink6`
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** sign-in provider
5. Add your domain to **Authorized domains**:
   - `localhost`
   - `127.0.0.1`

### 2. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `workrklink6`
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 client ID
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3001`
   - `https://workrklink6.firebaseapp.com`
6. Add **Authorized redirect URIs**:
   - `http://localhost:3001/__/auth/handler`
   - `https://workrklink6.firebaseapp.com/__/auth/handler`

### 3. Firebase Admin SDK (Optional)
For production use, configure Firebase Admin SDK:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Update `backend/.env`:
```env
FIREBASE_PROJECT_ID=workrklink6
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@workrklink6.iam.gserviceaccount.com
```

## MongoDB Setup (Optional)

### Option 1: Local MongoDB
1. Install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. The app will automatically connect using: `mongodb://localhost:27017/worklink`

### Option 2: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster
3. Get connection string
4. Update `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worklink
```

### Option 3: In-Memory Storage (Default)
If no MongoDB is configured, the app uses in-memory storage (data is lost on restart).

## Running the Application

### Backend
```bash
cd backend
npm install
npm start
```
Server runs on: http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm start
```
App runs on: http://localhost:3001

## Testing Authentication

1. Open http://localhost:3001
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Check browser dev tools for any errors
5. Verify user creation in:
   - Backend logs
   - MongoDB (if configured)
   - Firebase Console > Authentication (if Admin SDK configured)

## Troubleshooting

### Common Issues

1. **"Unauthorized domain" error**
   - Add `localhost` and `127.0.0.1` to Firebase authorized domains
   - Add full URLs to Google Cloud Console authorized origins

2. **"Invalid redirect URI" error**
   - Add `http://localhost:3001/__/auth/handler` to Google Cloud Console

3. **Users not appearing in Firebase Console**
   - This is normal without Firebase Admin SDK
   - Users are stored in backend database only
   - Configure Admin SDK for Firebase Console integration

4. **MongoDB connection errors**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - App will fallback to in-memory storage

5. **Firebase configuration errors**
   - Verify all environment variables in `frontend/.env`
   - Ensure Firebase project ID matches across all configs
   - Clear browser cache and restart servers

## Current Configuration Status

✅ Frontend Firebase config updated to use environment variables
✅ Backend Firebase Admin SDK integration added
✅ MongoDB connection configured
✅ Google OAuth endpoints updated with proper token verification

⚠️ **Action Required:**
- Configure Firebase Admin SDK credentials for production
- Set up MongoDB (local or cloud) for persistent storage
- Verify Firebase Console and Google Cloud Console settings

## Support

If you encounter issues:
1. Check browser dev tools console
2. Check backend server logs
3. Verify Firebase and Google Cloud Console configurations
4. Ensure all environment variables are set correctly