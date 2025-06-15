# WorkLink Production Deployment Guide

This guide provides complete instructions for deploying WorkLink to production on your VPS with domain `worklinkindia.com` and IP `168.231.121.216`.

## 🎯 Deployment Overview

- **Domain**: worklinkindia.com
- **IP Address**: 168.231.121.216
- **Backend Port**: 5000
- **MongoDB**: mongodb://127.0.0.1:27017
- **Frontend**: Served via Nginx
- **Backend**: Node.js API with reverse proxy

## 🚀 Quick Deployment

### Local Preparation

1. **Prepare the build**:
   ```bash
   node deploy-production.js
   ```

2. **Upload files to server**:
   ```bash
   # Upload backend
   scp -r backend/ root@168.231.121.216:/var/www/worklinkindia.com/
   
   # Upload frontend build
   scp -r frontend/dist/ root@168.231.121.216:/var/www/worklinkindia.com/frontend/
   
   # Upload nginx config
   scp nginx-worklinkindia.conf root@168.231.121.216:/etc/nginx/sites-available/worklinkindia.com
   ```

3. **Setup server** (run on VPS):
   ```bash
   # Upload and run server setup script
   scp server-setup.sh root@168.231.121.216:/root/
   ssh root@168.231.121.216 "chmod +x /root/server-setup.sh && /root/server-setup.sh"
   ```

4. **Configure and start services**:
   ```bash
   ssh root@168.231.121.216
   
   # Enable nginx site
   ln -s /etc/nginx/sites-available/worklinkindia.com /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   
   # Start backend service
   systemctl start worklink-backend
   systemctl enable worklink-backend
   ```

## 📋 Detailed Setup Instructions

### Phase 1: Local Build Preparation

#### 1.1 Environment Configuration

The project is already configured with production environment files:

**Frontend (.env.production)**:
```env
VITE_API_BASE_URL=https://worklinkindia.com/api
VITE_SOCKET_URL=wss://worklinkindia.com
# ... other config
```

**Backend (.env.production)**:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/worklink
CORS_ORIGIN=https://worklinkindia.com,https://www.worklinkindia.com,http://168.231.121.216
# ... other config
```

#### 1.2 Build Process

Run the automated build script:
```bash
node deploy-production.js
```

This script will:
- ✅ Verify environment configurations
- 🧹 Clean previous builds
- 📦 Install dependencies
- 🏗️ Build frontend for production
- 🔍 Verify build output
- 📦 Create deployment package

### Phase 2: Server Setup

#### 2.1 Server Requirements

- Ubuntu 20.04+ or similar Linux distribution
- Root access via SSH
- Domain DNS configured to point to server IP

#### 2.2 Automated Server Setup

Upload and run the server setup script:
```bash
# Upload script
scp server-setup.sh root@168.231.121.216:/root/

# Run setup
ssh root@168.231.121.216 "chmod +x /root/server-setup.sh && /root/server-setup.sh"
```

The script installs:
- Node.js 18.x
- MongoDB 6.0
- Nginx
- PM2 process manager
- Firewall configuration
- System services

### Phase 3: Application Deployment

#### 3.1 Upload Application Files

```bash
# Backend application
scp -r backend/ root@168.231.121.216:/var/www/worklinkindia.com/

# Frontend build
scp -r frontend/dist/ root@168.231.121.216:/var/www/worklinkindia.com/frontend/

# Nginx configuration
scp nginx-worklinkindia.conf root@168.231.121.216:/etc/nginx/sites-available/worklinkindia.com
```

#### 3.2 Configure Services

SSH into your server:
```bash
ssh root@168.231.121.216
```

Enable Nginx site:
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/worklinkindia.com /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

Start backend service:
```bash
# Start the service
systemctl start worklink-backend

# Enable auto-start on boot
systemctl enable worklink-backend

# Check status
systemctl status worklink-backend
```

### Phase 4: SSL Certificate Setup

#### 4.1 Using Let's Encrypt (Recommended)

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d worklinkindia.com -d www.worklinkindia.com

# Test auto-renewal
certbot renew --dry-run
```

#### 4.2 Using Custom Certificate

If you have your own SSL certificate:
```bash
# Copy certificate files
cp your-certificate.crt /etc/ssl/certs/worklinkindia.com.crt
cp your-private-key.key /etc/ssl/private/worklinkindia.com.key

# Set proper permissions
chmod 644 /etc/ssl/certs/worklinkindia.com.crt
chmod 600 /etc/ssl/private/worklinkindia.com.key
```

## 🔧 Configuration Details

### Nginx Configuration

The nginx configuration (`nginx-worklinkindia.conf`) provides:
- HTTP to HTTPS redirect
- Frontend static file serving
- API proxy to backend (port 5000)
- WebSocket support for Socket.IO
- File upload handling
- Security headers
- Gzip compression
- Static asset caching

### Backend Configuration

The backend is configured to:
- Run on port 5000
- Connect to local MongoDB
- Handle CORS for the domain
- Serve file uploads
- Provide WebSocket support

### Database Setup

MongoDB is configured to:
- Run locally on port 27017
- Use database name: `worklink`
- Auto-start on system boot

## 🔍 Verification & Testing

### Check Services Status

```bash
# Check all services
systemctl status worklink-backend
systemctl status mongod
systemctl status nginx

# Check logs
journalctl -u worklink-backend -f
journalctl -u mongod -f
journalctl -u nginx -f
```

### Test Endpoints

```bash
# Test backend health
curl https://worklinkindia.com/health

# Test API endpoint
curl https://worklinkindia.com/api/health

# Test frontend
curl https://worklinkindia.com/
```

### Browser Testing

1. Visit `https://worklinkindia.com`
2. Test user registration/login
3. Test file uploads
4. Check browser console for errors
5. Verify WebSocket connections

## 🛠️ Maintenance & Monitoring

### Log Files

- Backend logs: `journalctl -u worklink-backend`
- Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- MongoDB logs: `journalctl -u mongod`

### Backup Strategy

```bash
# Database backup
mongodump --db worklink --out /backup/mongodb/$(date +%Y%m%d)

# Application backup
tar -czf /backup/worklink-$(date +%Y%m%d).tar.gz /var/www/worklinkindia.com
```

### Updates

To update the application:
1. Build new version locally
2. Stop backend service: `systemctl stop worklink-backend`
3. Upload new files
4. Start backend service: `systemctl start worklink-backend`
5. Reload nginx if needed: `systemctl reload nginx`

## 🚨 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if backend service is running
   - Verify port 5000 is accessible
   - Check backend logs

2. **Database Connection Error**
   - Ensure MongoDB is running
   - Check MongoDB logs
   - Verify connection string

3. **SSL Certificate Issues**
   - Verify certificate files exist
   - Check certificate expiration
   - Test with `openssl s_client -connect worklinkindia.com:443`

4. **CORS Errors**
   - Verify CORS_ORIGIN in backend .env.production
   - Check browser network tab
   - Ensure domain matches exactly

### Emergency Commands

```bash
# Restart all services
systemctl restart worklink-backend
systemctl restart nginx
systemctl restart mongod

# Check disk space
df -h

# Check memory usage
free -h

# Check process status
ps aux | grep node
ps aux | grep nginx
ps aux | grep mongod
```

## ✅ Success Checklist

- [ ] Domain resolves to correct IP
- [ ] SSL certificate is valid
- [ ] Frontend loads at https://worklinkindia.com
- [ ] API endpoints respond correctly
- [ ] User registration/login works
- [ ] File uploads function properly
- [ ] WebSocket connections establish
- [ ] All services auto-start on reboot
- [ ] Logs are being written correctly
- [ ] Backup strategy is in place

## 🎉 Deployment Complete!

Your WorkLink application is now running in production at:
**https://worklinkindia.com**

The system is configured for:
- ✅ High availability
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Easy maintenance
- ✅ Monitoring and logging

For support or questions, refer to the troubleshooting section or check the application logs.