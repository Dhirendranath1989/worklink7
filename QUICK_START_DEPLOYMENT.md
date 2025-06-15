# 🚀 WorkLink Quick Start Deployment Guide

**Target Environment:**
- **Domain:** worklinkindia.com
- **IP:** 168.231.121.216
- **Backend Port:** 5000
- **Database:** MongoDB (Local)

## ⚡ One-Command Deployment

### Step 1: Prepare Build (Local)
```bash
node deploy-production.js
```

### Step 2: Upload to Server
```bash
# Upload all files
scp -r backend/ root@168.231.121.216:/var/www/worklinkindia.com/
scp -r frontend/dist/ root@168.231.121.216:/var/www/worklinkindia.com/frontend/
scp nginx-worklinkindia.conf root@168.231.121.216:/etc/nginx/sites-available/worklinkindia.com
scp server-setup.sh root@168.231.121.216:/root/
```

### Step 3: Setup Server
```bash
# Run server setup
ssh root@168.231.121.216 "chmod +x /root/server-setup.sh && /root/server-setup.sh"
```

### Step 4: Configure Services
```bash
ssh root@168.231.121.216

# Enable nginx site
ln -s /etc/nginx/sites-available/worklinkindia.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Start backend
systemctl start worklink-backend
systemctl enable worklink-backend

# Setup SSL (Let's Encrypt)
certbot --nginx -d worklinkindia.com -d www.worklinkindia.com
```

## ✅ Verification

```bash
# Check services
systemctl status worklink-backend mongod nginx

# Test endpoints
curl https://worklinkindia.com/health
curl https://worklinkindia.com/api/health
```

## 📁 Project Structure

```
worklink7/
├── frontend/
│   ├── .env.production          # ✅ Configured for worklinkindia.com
│   └── dist/                    # Built frontend files
├── backend/
│   ├── .env.production          # ✅ Configured for local MongoDB
│   └── server.js                # ✅ CORS configured
├── nginx-worklinkindia.conf     # ✅ Complete nginx config
├── server-setup.sh              # ✅ Automated server setup
├── deploy-production.js         # ✅ Build automation
├── PRODUCTION_SETUP.md          # 📖 Detailed guide
└── DEPLOYMENT_CHECKLIST.md      # ✅ Verification checklist
```

## 🔧 Key Configurations

### Frontend Environment
- API Base URL: `https://worklinkindia.com/api`
- Socket URL: `wss://worklinkindia.com`
- Production optimized build

### Backend Environment
- Port: 5000
- MongoDB: `mongodb://127.0.0.1:27017/worklink`
- CORS: Configured for domain
- Production mode enabled

### Nginx Configuration
- HTTPS redirect
- API proxy to port 5000
- Static file serving
- WebSocket support
- Security headers
- Gzip compression

## 🛠️ Available Scripts

```bash
# Build for production
npm run deploy:prod

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend

# Build everything
npm run build:all

# Start production server (on VPS)
npm run start:prod
```

## 🔍 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   systemctl status worklink-backend
   journalctl -u worklink-backend -f
   ```

2. **Database Connection**
   ```bash
   systemctl status mongod
   mongo --eval "db.adminCommand('ismaster')"
   ```

3. **SSL Issues**
   ```bash
   certbot certificates
   nginx -t
   ```

4. **CORS Errors**
   - Check browser console
   - Verify CORS_ORIGIN in backend .env.production

### Emergency Commands

```bash
# Restart all services
systemctl restart worklink-backend nginx mongod

# Check logs
journalctl -u worklink-backend -f
tail -f /var/log/nginx/error.log

# Check processes
ps aux | grep -E '(node|nginx|mongod)'

# Check ports
netstat -tlnp | grep -E ':(80|443|5000|27017)'
```

## 📊 Performance Optimization

### Already Configured
- ✅ Gzip compression
- ✅ Static asset caching
- ✅ Production builds
- ✅ Optimized images
- ✅ Minified CSS/JS

### Monitoring
- Backend logs: `journalctl -u worklink-backend`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `journalctl -u mongod`

## 🔐 Security Features

### Implemented
- ✅ HTTPS enforcement
- ✅ Security headers
- ✅ CORS protection
- ✅ Firewall configuration
- ✅ JWT authentication
- ✅ Input validation

### SSL Certificate
```bash
# Auto-renewal check
certbot renew --dry-run

# Manual renewal
certbot renew
```

## 📈 Scaling Considerations

### Current Setup
- Single server deployment
- Local MongoDB
- File uploads to local storage

### Future Scaling
- Load balancer for multiple servers
- MongoDB replica set
- Cloud storage for uploads
- CDN for static assets

## 🎯 Success Criteria

- [ ] ✅ Frontend loads at https://worklinkindia.com
- [ ] ✅ API endpoints respond correctly
- [ ] ✅ User authentication works
- [ ] ✅ File uploads functional
- [ ] ✅ WebSocket connections stable
- [ ] ✅ SSL certificate valid
- [ ] ✅ All services auto-start
- [ ] ✅ Logs are accessible
- [ ] ✅ Performance is optimal

## 📞 Support

### Documentation
- **Detailed Guide:** `PRODUCTION_SETUP.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Configuration:** Environment files

### Logs Location
- **Backend:** `journalctl -u worklink-backend`
- **Nginx:** `/var/log/nginx/`
- **MongoDB:** `journalctl -u mongod`
- **System:** `journalctl -f`

---

**🎉 Your WorkLink application is production-ready!**

**Live URL:** https://worklinkindia.com

For detailed instructions, see `PRODUCTION_SETUP.md`
For verification steps, see `DEPLOYMENT_CHECKLIST.md`