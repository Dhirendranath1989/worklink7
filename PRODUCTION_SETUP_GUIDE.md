# WorkLink Production Setup Guide

This guide explains how to configure and deploy WorkLink for production environments.

## Overview

The application now supports proper production configuration for both frontend and backend with separate environment files and optimized build processes.

## Environment Files

### Backend Environment Files
- **`.env`** - Development environment (default)
- **`.env.production`** - Production environment

### Frontend Environment Files
- **`.env.example`** - Template for development
- **`.env.production`** - Production environment (uses VITE_ prefixes)

## Production Configuration Steps

### 1. Backend Production Setup

#### Update `.env.production` file:
```bash
cd backend
# Edit .env.production with your production values:
```

**Required Changes:**
- `JWT_SECRET`: Change to a strong, unique secret
- `MONGODB_URI`: Update with your production MongoDB connection string
- `CORS_ORIGIN`: Set to your frontend domain
- Firebase credentials (if using Firebase)

#### Example production values:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worklink?retryWrites=true&w=majority
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Frontend Production Setup

#### Update `.env.production` file:
```bash
cd frontend
# Edit .env.production with your production values:
```

**Required Changes:**
- `VITE_API_BASE_URL`: Set to your backend production URL
- `VITE_SOCKET_URL`: Set to your backend production URL
- Update Firebase configuration if needed
- Configure optional services (Google Maps, Payment gateways, etc.)

#### Example production values:
```env
VITE_API_BASE_URL=https://api.yourworklink.com/api
VITE_SOCKET_URL=https://api.yourworklink.com
VITE_APP_ENVIRONMENT=production
```

## Deployment Methods

### Method 1: Using Deployment Scripts

#### Windows:
```bash
# Run the production deployment script
deploy-production.bat
```

#### Linux/Mac:
```bash
# Make script executable
chmod +x deploy-production.sh
# Run the production deployment script
./deploy-production.sh
```

### Method 2: Manual Deployment

#### Step 1: Build Frontend
```bash
cd frontend
npm run build:prod
```

#### Step 2: Start Backend in Production
```bash
cd backend
npm run start:prod
```

### Method 3: Using Environment Variables

#### Set NODE_ENV and start:
```bash
# Windows
set NODE_ENV=production
cd backend
npm start

# Linux/Mac
export NODE_ENV=production
cd backend
npm start
```

## Production Checklist

### Security
- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Update CORS_ORIGIN to your actual frontend domain
- [ ] Use HTTPS for all production URLs
- [ ] Configure rate limiting settings
- [ ] Review and update Firebase security rules

### Database
- [ ] Set up production MongoDB cluster
- [ ] Configure database backups
- [ ] Set up monitoring and alerts
- [ ] Update connection string in .env.production

### Frontend
- [ ] Update API URLs to production backend
- [ ] Configure production Firebase project
- [ ] Set up CDN for static assets (optional)
- [ ] Configure analytics and monitoring

### Backend
- [ ] Configure production MongoDB
- [ ] Set up file upload storage (production)
- [ ] Configure email service for notifications
- [ ] Set up logging and monitoring
- [ ] Configure SSL certificates

### Infrastructure
- [ ] Set up production servers/hosting
- [ ] Configure domain names and DNS
- [ ] Set up SSL certificates
- [ ] Configure load balancing (if needed)
- [ ] Set up monitoring and alerting

## Available Scripts

### Backend Scripts
- `npm start` - Start in development mode
- `npm run start:prod` - Start in production mode
- `npm run dev` - Start with nodemon (development)

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:prod` - Build for production (explicit)
- `npm run preview` - Preview production build

## Environment Detection

The application automatically detects the environment:
- Backend loads `.env.production` when `NODE_ENV=production`
- Frontend uses `.env.production` when building with `--mode production`
- Console logs show which environment and configuration is being used

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Ensure NODE_ENV is set correctly
   - Check file paths and names
   - Verify environment file syntax

2. **CORS errors in production**
   - Update CORS_ORIGIN in backend .env.production
   - Ensure frontend and backend URLs match

3. **Build failures**
   - Check for missing dependencies
   - Verify environment variable syntax
   - Ensure all required variables are set

4. **Database connection issues**
   - Verify MongoDB connection string
   - Check network connectivity
   - Ensure database user has proper permissions

## Next Steps

1. Configure your production infrastructure
2. Update environment files with actual production values
3. Test the deployment process in a staging environment
4. Set up monitoring and logging
5. Configure automated backups
6. Set up CI/CD pipeline (optional)

For additional help, refer to the main README.md or contact the development team.