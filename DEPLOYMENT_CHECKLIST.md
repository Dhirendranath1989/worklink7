# WorkLink Production Deployment Checklist

## 📋 Pre-Deployment Verification

### ✅ Environment Configuration
- [ ] Frontend `.env.production` configured with `https://worklinkindia.com`
- [ ] Backend `.env.production` configured with local MongoDB
- [ ] CORS origins include both `worklinkindia.com` and `www.worklinkindia.com`
- [ ] JWT secret is secure and production-ready
- [ ] Firebase configuration is correct (if using)

### ✅ Build Process
- [ ] Run `node deploy-production.js` successfully
- [ ] Frontend `dist` folder created with all assets
- [ ] Backend dependencies installed for production
- [ ] No build errors or warnings
- [ ] `deployment-info.json` file generated

### ✅ Server Preparation
- [ ] VPS accessible via SSH at `root@168.231.121.216`
- [ ] Domain `worklinkindia.com` DNS points to `168.231.121.216`
- [ ] Server has sufficient resources (2GB+ RAM, 20GB+ storage)
- [ ] Ubuntu 20.04+ or compatible Linux distribution

## 🚀 Deployment Steps

### Step 1: Server Setup
- [ ] Upload `server-setup.sh` to server
- [ ] Run server setup script as root
- [ ] Verify Node.js 18.x installed
- [ ] Verify MongoDB 6.0 installed and running
- [ ] Verify Nginx installed and running
- [ ] Verify PM2 installed globally
- [ ] Verify firewall configured (ports 22, 80, 443, 5000)

### Step 2: Application Upload
- [ ] Upload backend folder to `/var/www/worklinkindia.com/backend/`
- [ ] Upload frontend dist to `/var/www/worklinkindia.com/frontend/dist/`
- [ ] Upload nginx config to `/etc/nginx/sites-available/worklinkindia.com`
- [ ] Set proper file permissions (`www-data:www-data`)

### Step 3: Service Configuration
- [ ] Enable nginx site with symbolic link
- [ ] Test nginx configuration (`nginx -t`)
- [ ] Reload nginx service
- [ ] Start worklink-backend systemd service
- [ ] Enable worklink-backend for auto-start
- [ ] Verify all services are running

### Step 4: SSL Certificate
- [ ] Install certbot for Let's Encrypt
- [ ] Generate SSL certificate for `worklinkindia.com` and `www.worklinkindia.com`
- [ ] Verify certificate auto-renewal setup
- [ ] Test HTTPS access

## 🔍 Post-Deployment Testing

### ✅ Service Status Checks
- [ ] `systemctl status worklink-backend` shows active
- [ ] `systemctl status mongod` shows active
- [ ] `systemctl status nginx` shows active
- [ ] No error messages in service logs

### ✅ Endpoint Testing
- [ ] `curl https://worklinkindia.com/health` returns 200
- [ ] `curl https://worklinkindia.com/api/health` returns backend response
- [ ] `curl https://worklinkindia.com/` returns frontend HTML
- [ ] HTTP redirects to HTTPS properly

### ✅ Browser Testing
- [ ] Frontend loads at `https://worklinkindia.com`
- [ ] No console errors in browser
- [ ] User registration works
- [ ] User login works
- [ ] File upload functionality works
- [ ] WebSocket connections establish
- [ ] Mobile responsiveness verified

### ✅ Database Testing
- [ ] MongoDB connection successful
- [ ] User data persists correctly
- [ ] File uploads save to database
- [ ] Database queries perform well

## 🛡️ Security Verification

### ✅ SSL/TLS
- [ ] SSL certificate valid and trusted
- [ ] HTTPS enforced (HTTP redirects)
- [ ] Strong cipher suites configured
- [ ] HSTS headers present

### ✅ Headers & CORS
- [ ] Security headers configured in nginx
- [ ] CORS working for frontend domain
- [ ] No CORS errors in browser console
- [ ] XSS protection headers present

### ✅ Firewall & Access
- [ ] Only necessary ports open (22, 80, 443)
- [ ] Backend port 5000 not directly accessible from internet
- [ ] SSH access secured
- [ ] Database not accessible from internet

## 📊 Performance & Monitoring

### ✅ Performance
- [ ] Frontend loads quickly (<3 seconds)
- [ ] API responses are fast (<500ms)
- [ ] Static assets cached properly
- [ ] Gzip compression enabled
- [ ] Images optimized

### ✅ Monitoring Setup
- [ ] Log rotation configured
- [ ] System logs accessible
- [ ] Application logs working
- [ ] Error tracking functional
- [ ] Backup strategy in place

## 🔧 Maintenance Preparation

### ✅ Documentation
- [ ] Server access credentials documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available
- [ ] Update procedure documented

### ✅ Backup & Recovery
- [ ] Database backup script created
- [ ] Application backup procedure tested
- [ ] Recovery procedure documented
- [ ] Backup storage configured

### ✅ Update Process
- [ ] Update procedure tested
- [ ] Rollback procedure documented
- [ ] Zero-downtime deployment possible
- [ ] Version control strategy in place

## 🚨 Emergency Contacts & Procedures

### ✅ Emergency Response
- [ ] Emergency contact list prepared
- [ ] Service restart procedures documented
- [ ] Emergency rollback procedure ready
- [ ] Monitoring alerts configured

## 📝 Final Verification Commands

Run these commands to verify everything is working:

```bash
# Service status
sudo systemctl status worklink-backend mongod nginx

# Port verification
sudo netstat -tlnp | grep -E ':(80|443|5000|27017)'

# Process verification
ps aux | grep -E '(node|nginx|mongod)'

# Disk space
df -h

# Memory usage
free -h

# Test endpoints
curl -I https://worklinkindia.com
curl -I https://worklinkindia.com/api/health
curl -I https://worklinkindia.com/health

# SSL certificate check
openssl s_client -connect worklinkindia.com:443 -servername worklinkindia.com < /dev/null
```

## ✅ Deployment Success Criteria

**All items below must be checked before considering deployment successful:**

- [ ] ✅ All services running and healthy
- [ ] ✅ Frontend accessible via HTTPS
- [ ] ✅ Backend API responding correctly
- [ ] ✅ Database connections working
- [ ] ✅ User authentication functional
- [ ] ✅ File uploads working
- [ ] ✅ SSL certificate valid
- [ ] ✅ No security vulnerabilities
- [ ] ✅ Performance meets requirements
- [ ] ✅ Monitoring and logging active
- [ ] ✅ Backup procedures in place
- [ ] ✅ Documentation complete

## 🎉 Deployment Complete!

**Congratulations!** Your WorkLink application is now successfully deployed in production.

**Application URL:** https://worklinkindia.com

**Next Steps:**
1. Monitor application performance for 24-48 hours
2. Set up regular backup schedules
3. Configure monitoring alerts
4. Plan for regular security updates
5. Document any custom configurations

**Support Resources:**
- Server logs: `journalctl -u worklink-backend -f`
- Nginx logs: `/var/log/nginx/`
- MongoDB logs: `journalctl -u mongod -f`
- Application monitoring: Check service status regularly

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** 1.0.0
**Environment:** Production