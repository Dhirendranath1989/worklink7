# WorkLink Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed on production server
- MongoDB database (local or Atlas)
- Domain name configured (worklinkindia.com)
- SSL certificate
- Web server (Nginx recommended)

### Production Deployment Steps

1. **Check Configuration**
   ```bash
   npm run check:prod
   ```

2. **Deploy to Production**
   ```bash
   npm run deploy:prod
   ```

3. **Monitor Health**
   ```bash
   npm run health:check
   ```

## 📋 Complete Setup Guide

### 1. Server Preparation

#### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended

#### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (if hosting locally)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### 2. Application Deployment

#### Clone and Setup
```bash
# Create application directory
sudo mkdir -p /var/www/worklink
sudo chown $USER:$USER /var/www/worklink

# Clone repository
cd /var/www
git clone <your-repository-url> worklink
cd worklink

# Install dependencies
npm run install:all

# Check production configuration
npm run check:prod

# Build frontend
npm run build:frontend
```

#### Environment Configuration

**Backend Environment** (`backend/.env.production`):
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this_in_production
MONGODB_URI=mongodb://localhost:27017/worklink
CORS_ORIGIN=https://www.worklinkindia.com,https://worklinkindia.com

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

**Frontend Environment** (`frontend/.env.production`):
```env
VITE_API_BASE_URL=https://www.worklinkindia.com/api
VITE_SOCKET_URL=wss://www.worklinkindia.com
VITE_APP_ENVIRONMENT=production

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Database Setup

#### MongoDB Configuration
```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
```

```javascript
// In MongoDB shell
use worklink

// Create application user
db.createUser({
  user: "worklink_user",
  pwd: "secure_password_here",
  roles: ["readWrite"]
})

// Exit MongoDB shell
exit
```

### 4. Web Server Configuration

#### Nginx Configuration
Create `/etc/nginx/sites-available/worklink`:

```nginx
server {
    listen 80;
    server_name worklinkindia.com www.worklinkindia.com 168.231.121.216;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name worklinkindia.com www.worklinkindia.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/worklinkindia.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/worklinkindia.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Hide Nginx version
    server_tokens off;

    # Root directory for frontend
    root /var/www/worklink/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API proxy
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO proxy
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

    # Static files
    location /uploads {
        alias /var/www/worklink/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Nginx Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/worklink /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d worklinkindia.com -d www.worklinkindia.com

# Setup auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Process Management

#### PM2 Configuration
Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'worklink-backend',
    script: './backend/server.js',
    cwd: '/var/www/worklink',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Start Application
```bash
# Start with PM2
cd /var/www/worklink
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions provided by the command
```

### 7. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp
sudo ufw enable

# Check status
sudo ufw status
```

### 8. Monitoring and Maintenance

#### Health Checks
```bash
# Manual health check
cd /var/www/worklink
npm run health:check

# JSON output for monitoring systems
npm run health:json
```

#### Setup Automated Health Checks
```bash
# Add to crontab
crontab -e

# Add these lines:
# Health check every 5 minutes
*/5 * * * * cd /var/www/worklink && npm run health:check >> /var/log/worklink-health.log 2>&1

# Daily configuration check
0 6 * * * cd /var/www/worklink && npm run check:prod >> /var/log/worklink-config.log 2>&1
```

#### Log Management
```bash
# Setup log rotation
sudo nano /etc/logrotate.d/worklink
```

Add to logrotate configuration:
```
/var/www/worklink/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload worklink-backend
    endscript
}
```

### 9. Backup Strategy

#### Database Backup Script
Create `/usr/local/bin/backup-worklink-db.sh`:

```bash
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/worklink/db"
mkdir -p $BACKUP_DIR

mongodump --db worklink --out $BACKUP_DIR/backup_$DATE
tar -czf $BACKUP_DIR/worklink_db_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "worklink_db_*.tar.gz" -mtime +7 -delete
```

#### Application Backup Script
Create `/usr/local/bin/backup-worklink-app.sh`:

```bash
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/worklink/app"
APP_DIR="/var/www/worklink"
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/worklink_app_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='backend/uploads' \
    -C /var/www worklink

# Keep only last 7 days
find $BACKUP_DIR -name "worklink_app_*.tar.gz" -mtime +7 -delete
```

#### Setup Backup Cron Jobs
```bash
# Make scripts executable
sudo chmod +x /usr/local/bin/backup-worklink-*.sh

# Add to root crontab
sudo crontab -e

# Add these lines:
# Daily database backup at 2 AM
0 2 * * * /usr/local/bin/backup-worklink-db.sh

# Weekly application backup on Sundays at 3 AM
0 3 * * 0 /usr/local/bin/backup-worklink-app.sh
```

### 10. Security Hardening

#### System Security
```bash
# Install fail2ban
sudo apt install fail2ban -y

# Configure fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Start fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

#### Application Security
- Change default passwords
- Use strong JWT secrets
- Enable HTTPS only
- Configure proper CORS origins
- Implement rate limiting
- Regular security updates

### 11. Troubleshooting

#### Common Issues

**Backend not starting:**
```bash
# Check PM2 logs
pm2 logs worklink-backend

# Check environment variables
pm2 env 0

# Restart application
pm2 restart worklink-backend
```

**Database connection issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh --eval "db.adminCommand('ping')"
```

**Nginx issues:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

#### Performance Monitoring
```bash
# System resources
htop
df -h
free -m

# Application performance
pm2 monit

# Network connections
netstat -tulpn
```

### 12. Deployment Checklist

- [ ] Server meets system requirements
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database setup and accessible
- [ ] SSL certificate installed
- [ ] Nginx configured and running
- [ ] Application built and deployed
- [ ] PM2 process manager configured
- [ ] Firewall configured
- [ ] Health checks passing
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Security hardening applied
- [ ] DNS pointing to server
- [ ] Application accessible via domain

### 13. Maintenance Schedule

#### Daily
- Monitor application health
- Check error logs
- Verify backups completed

#### Weekly
- Review system resources
- Update system packages
- Check SSL certificate status

#### Monthly
- Security audit
- Performance review
- Backup restoration test
- Update application dependencies

### 14. Support and Documentation

- **Production Setup Guide**: `PRODUCTION_SETUP.md`
- **Security Guide**: `SECURITY_GUIDE.md`
- **Health Check Script**: `health-check.js`
- **Configuration Checker**: `check-production-config.js`
- **Deployment Script**: `deploy-production.js`

### 15. Emergency Procedures

#### Application Down
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs`
3. Restart application: `pm2 restart all`
4. Check health: `npm run health:check`

#### Database Issues
1. Check MongoDB status: `sudo systemctl status mongod`
2. Check logs: `sudo tail -f /var/log/mongodb/mongod.log`
3. Restart MongoDB: `sudo systemctl restart mongod`

#### High Traffic
1. Monitor resources: `htop`
2. Scale PM2 instances: `pm2 scale worklink-backend +2`
3. Enable Nginx caching
4. Consider load balancer

---

**For additional help, refer to the detailed guides in the project documentation or contact the development team.**