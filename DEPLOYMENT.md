# Collavio - Deployment Guide

## Prerequisites
- GitHub account
- Railway account (for backend)
- Vercel account (for frontend)
- Firebase project setup

## Deployment Steps

### 1. Backend Deployment (Railway)
1. Push code to GitHub repository
2. Connect Railway to your GitHub repo
3. Select the `server` folder as root directory
4. Add environment variables in Railway dashboard:
   ```
   PORT=5000
   STORAGE_PROVIDER=firebase
   FIREBASE_API_KEY=AIzaSyAarxGKpU584x278-2LhPwqEzI098OFmvs
   FIREBASE_AUTH_DOMAIN=workspace-3181b.firebaseapp.com
   FIREBASE_PROJECT_ID=workspace-3181b
   FIREBASE_STORAGE_BUCKET=workspace-3181b.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=70257429817
   FIREBASE_APP_ID=1:70257429817:web:c832a49403ae531910ace8
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@workspace-3181b.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[your-key]\n-----END PRIVATE KEY-----\n"
   ```
5. Deploy and get your backend URL

### 2. Frontend Deployment (Vercel)
1. Update `client/.env` with your Railway backend URL:
   ```
   REACT_APP_API_URL=https://your-collavio-backend.railway.app/api
   ```
2. Push changes to GitHub
3. Connect Vercel to your GitHub repo
4. Select the `client` folder as root directory
5. Add environment variables in Vercel dashboard
6. Deploy

### 3. Update CORS Settings
Update your backend CORS configuration to include your Vercel frontend URL.

## Environment Variables Checklist

### Backend (Railway)
- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_PRIVATE_KEY
- [ ] FIREBASE_CLIENT_EMAIL
- [ ] STORAGE_PROVIDER=firebase

### Frontend (Vercel)
- [ ] REACT_APP_API_URL
- [ ] REACT_APP_FIREBASE_API_KEY
- [ ] REACT_APP_FIREBASE_AUTH_DOMAIN
- [ ] REACT_APP_FIREBASE_PROJECT_ID
- [ ] REACT_APP_FIREBASE_STORAGE_BUCKET
- [ ] REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- [ ] REACT_APP_FIREBASE_APP_ID

## Post-Deployment
1. Test all functionality
2. Update Firebase security rules if needed
3. Configure custom domain (optional)