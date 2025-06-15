# WorkLink Production Deployment Guide

This guide provides step-by-step instructions for deploying WorkLink to production using the domain `www.worklinkindia.com` and IP address `168.231.121.216`.

## 🚀 Quick Start

```bash
# Run the automated deployment script
node deploy-production.js
```

## 📋 Prerequisites

- Server with IP: `168.231.121.216`
- Domain: `www.worklinkindia.com` (DNS configured to point to the server)
- Node.js 16+ installed on the server
- MongoDB database (local or cloud)
- SSL certificate for HTTPS
- Web server (nginx/apache) for serving frontend

## 🔧 Environment Configuration

### Backend Environment (`.env.production`)

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worklink?retryWrites=true&w=majority
CORS_ORIGIN=https://www.worklinkindia.com,http://168.231.121.216:5000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment (`.env.production`)

```env
VITE_API_BASE_URL=https://www.worklinkindia.com/api
VITE_SOCKET_URL=wss://www.worklinkindia.com
VITE_FIREBASE_API_KEY=AIzaSyDbV5BSPuKsMovojw5EssNl9vcqFIQAGys
VITE_FIREBASE_AUTH_DOMAIN=workrklink6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=workrklink6
VITE_FIREBASE_STORAGE_BUCKET=workrklink6.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=85255551610
VITE_FIREBASE_APP_ID=1:85255551610:web:fd0610bfbdd59365cdd9c3
VITE_APP_NAME=WorkLink
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

## 🏗️ Build Process

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

### 3. Verify Build

Ensure the `frontend/dist` folder contains:
- `index.html`
- `assets/` folder with CSS and JS files
- Other static assets

## 🌐 Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/worklinkindia.com`:

```nginx
server {
    listen 80;
    server_name www.worklinkindia.com worklinkindia.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.worklinkindia.com worklinkindia.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend static files
    location / {
        root /var/www/worklink/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/worklinkindia.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🚀 Deployment Steps

### 1. Upload Files to Server

```bash
# Upload backend
scp -r backend/ user@168.231.121.216:/var/www/worklink/

# Upload frontend build
scp -r frontend/dist/ user@168.231.121.216:/var/www/worklink/frontend/
```

### 2. Install Dependencies on Server

```bash
ssh user@168.231.121.216
cd /var/www/worklink/backend
npm install --production
```

### 3. Start Backend Service

#### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
cd /var/www/worklink/backend
NODE_ENV=production pm2 start server.js --name "worklink-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using systemd

Create `/etc/systemd/system/worklink.service`:

```ini
[Unit]
Description=WorkLink Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/worklink/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable worklink
sudo systemctl start worklink
sudo systemctl status worklink
```

## 🔒 Security Configuration

### 1. Firewall Setup

```bash
# Allow SSH, HTTP, HTTPS, and backend port
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw enable
```

### 2. SSL Certificate

Using Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d www.worklinkindia.com -d worklinkindia.com
```

### 3. Environment Variables Security

- Change default JWT secret
- Use strong MongoDB credentials
- Configure Firebase security rules
- Set up proper CORS origins

## 📊 Monitoring and Maintenance

### 1. Log Monitoring

```bash
# PM2 logs
pm2 logs worklink-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u worklink -f
```

### 2. Health Checks

```bash
# Check backend status
curl https://www.worklinkindia.com/api/test

# Check frontend
curl https://www.worklinkindia.com

# Check PM2 status
pm2 status
```

### 3. Backup Strategy

- Database backups (MongoDB)
- File uploads backup
- Configuration files backup
- SSL certificates backup

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS_ORIGIN in backend .env.production
2. **API Not Found**: Verify nginx proxy configuration
3. **File Upload Issues**: Check upload directory permissions
4. **Database Connection**: Verify MongoDB URI and network access
5. **SSL Issues**: Check certificate validity and nginx SSL configuration

### Debug Commands

```bash
# Check nginx configuration
sudo nginx -t

# Check port usage
sudo netstat -tlnp | grep :5000

# Check process status
ps aux | grep node

# Check disk space
df -h

# Check memory usage
free -h
```

## 📝 Post-Deployment Checklist

- [ ] Frontend loads at https://www.worklinkindia.com
- [ ] API endpoints respond correctly
- [ ] User registration/login works
- [ ] File uploads function properly
- [ ] Google OAuth integration works
- [ ] Mobile responsiveness verified
- [ ] SSL certificate is valid
- [ ] Database connections are stable
- [ ] Monitoring and logging are active
- [ ] Backup systems are configured

## 🆘 Support

For deployment issues:
1. Check the logs first
2. Verify environment configuration
3. Test individual components
4. Review nginx and firewall settings
5. Check DNS configuration

---

**Note**: Replace placeholder values (MongoDB URI, JWT secret, etc.) with actual production values before deployment.