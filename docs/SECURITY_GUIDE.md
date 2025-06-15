# WorkLink Security Guide for Production

## 🔒 Security Checklist

### Environment Variables Security

#### Backend Environment Variables
- [ ] **JWT_SECRET**: Use a strong, randomly generated secret (minimum 32 characters)
- [ ] **MONGODB_URI**: Use MongoDB Atlas or secure self-hosted instance with authentication
- [ ] **CORS_ORIGIN**: Restrict to specific domains only
- [ ] **NODE_ENV**: Set to `production`

#### Frontend Environment Variables
- [ ] **VITE_API_BASE_URL**: Use HTTPS in production
- [ ] **VITE_SOCKET_URL**: Use WSS (secure WebSocket) in production
- [ ] **Firebase Keys**: Ensure Firebase security rules are properly configured

### Server Security

#### Firewall Configuration
```bash
# Allow SSH (change port if using non-standard)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (if directly exposed)
sudo ufw allow 5000/tcp

# Enable firewall
sudo ufw enable
```

#### SSL/TLS Certificate
1. **Using Let's Encrypt (Recommended)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d worklinkindia.com -d www.worklinkindia.com
   ```

2. **Auto-renewal setup**:
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

#### Nginx Security Headers
Add these to your Nginx configuration:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Hide Nginx version
server_tokens off;
```

### Database Security

#### MongoDB Security
1. **Enable Authentication**:
   ```javascript
   // Create admin user
   use admin
   db.createUser({
     user: "admin",
     pwd: "strong_password_here",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
   })
   ```

2. **Create Application User**:
   ```javascript
   use worklink
   db.createUser({
     user: "worklink_app",
     pwd: "app_password_here",
     roles: ["readWrite"]
   })
   ```

3. **MongoDB Configuration** (`/etc/mongod.conf`):
   ```yaml
   security:
     authorization: enabled
   
   net:
     bindIp: 127.0.0.1  # Only allow local connections
     port: 27017
   ```

### Application Security

#### Rate Limiting
Add to your Express app:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

#### Input Validation
Ensure all user inputs are validated:

```javascript
const { body, validationResult } = require('express-validator');

// Example validation middleware
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

#### File Upload Security
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    // Generate unique filename
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### Monitoring and Logging

#### Application Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'worklink-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### System Monitoring
1. **Install monitoring tools**:
   ```bash
   # Install htop for system monitoring
   sudo apt install htop
   
   # Install fail2ban for intrusion prevention
   sudo apt install fail2ban
   ```

2. **Configure fail2ban** (`/etc/fail2ban/jail.local`):
   ```ini
   [DEFAULT]
   bantime = 3600
   findtime = 600
   maxretry = 5
   
   [sshd]
   enabled = true
   
   [nginx-http-auth]
   enabled = true
   ```

### Backup Strategy

#### Database Backup
```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/mongodb"
DB_NAME="worklink"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/backup_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

#### Application Files Backup
```bash
#!/bin/bash
# backup-app.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/app"
APP_DIR="/var/www/worklink"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='uploads' \
    -C $(dirname $APP_DIR) $(basename $APP_DIR)

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "App backup completed: app_backup_$DATE.tar.gz"
```

#### Automated Backup Cron Jobs
```bash
# Add to crontab (crontab -e)
# Daily database backup at 2 AM
0 2 * * * /path/to/backup-mongodb.sh

# Weekly application backup on Sundays at 3 AM
0 3 * * 0 /path/to/backup-app.sh
```

### Security Incident Response

#### Log Analysis
```bash
# Check for suspicious login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Check nginx access logs for unusual patterns
sudo tail -f /var/log/nginx/access.log | grep -E "(POST|PUT|DELETE)"

# Monitor application logs
tail -f /var/www/worklink/backend/logs/error.log
```

#### Emergency Procedures
1. **Suspected breach**:
   - Immediately change all passwords and API keys
   - Review access logs
   - Temporarily block suspicious IPs
   - Notify users if data may be compromised

2. **Service disruption**:
   - Check system resources: `htop`, `df -h`
   - Review application logs
   - Restart services if necessary
   - Implement temporary rate limiting

### Regular Security Maintenance

#### Weekly Tasks
- [ ] Review access logs for suspicious activity
- [ ] Check system resource usage
- [ ] Verify backup integrity
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`

#### Monthly Tasks
- [ ] Review and rotate API keys
- [ ] Audit user accounts and permissions
- [ ] Test backup restoration process
- [ ] Review security configurations

#### Quarterly Tasks
- [ ] Security audit and penetration testing
- [ ] Review and update security policies
- [ ] Update dependencies and frameworks
- [ ] Disaster recovery testing

### Security Tools and Resources

#### Recommended Tools
- **Vulnerability Scanning**: OWASP ZAP, Nessus
- **Dependency Checking**: `npm audit`, Snyk
- **SSL Testing**: SSL Labs Test
- **Security Headers**: securityheaders.com

#### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### Emergency Contacts

- **System Administrator**: [Your contact info]
- **Database Administrator**: [Your contact info]
- **Security Team**: [Your contact info]
- **Hosting Provider Support**: [Provider contact info]

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update your security measures to protect against new threats.