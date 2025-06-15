#!/bin/bash

# WorkLink Production Server Setup Script
# Run this script on your VPS (168.231.121.216) as root
# Domain: worklinkindia.com
# Backend Port: 5000
# MongoDB: Local instance on port 27017

set -e

echo "🚀 Starting WorkLink Server Setup..."
echo "📋 Server Configuration:"
echo "   Domain: worklinkindia.com"
echo "   IP: 168.231.121.216"
echo "   Backend Port: 5000"
echo "   MongoDB: mongodb://127.0.0.1:27017"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run this script as root (use sudo)"
  exit 1
fi

# Update system
echo "\n📦 Step 1: Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "\n📦 Step 2: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
echo "✅ Node.js installed: $node_version"
echo "✅ npm installed: $npm_version"

# Install MongoDB
echo "\n📦 Step 3: Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod
echo "✅ MongoDB installed and started"

# Install Nginx
echo "\n📦 Step 4: Installing Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
echo "✅ Nginx installed and started"

# Install PM2 for process management
echo "\n📦 Step 5: Installing PM2..."
npm install -g pm2
echo "✅ PM2 installed"

# Create application directories
echo "\n📁 Step 6: Creating application directories..."
mkdir -p /var/www/worklinkindia.com/backend
mkdir -p /var/www/worklinkindia.com/frontend/dist
mkdir -p /var/log/worklink
chown -R www-data:www-data /var/www/worklinkindia.com
echo "✅ Application directories created"

# Configure firewall
echo "\n🔥 Step 7: Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp
ufw --force enable
echo "✅ Firewall configured"

# Create SSL certificate directory
echo "\n🔐 Step 8: Creating SSL certificate directory..."
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private
echo "✅ SSL directories created"

# Create systemd service for WorkLink backend
echo "\n⚙️  Step 9: Creating systemd service..."
cat > /etc/systemd/system/worklink-backend.service << EOF
[Unit]
Description=WorkLink Backend API
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/worklinkindia.com/backend
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=worklink-backend

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "✅ Systemd service created"

# Create log rotation configuration
echo "\n📝 Step 10: Setting up log rotation..."
cat > /etc/logrotate.d/worklink << EOF
/var/log/worklink/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload worklink-backend
    endscript
}
EOF
echo "✅ Log rotation configured"

# Display next steps
echo "\n🎉 Server setup completed successfully!"
echo "\n📝 Next Steps:"
echo "   1. Upload your application files:"
echo "      - Backend files to: /var/www/worklinkindia.com/backend/"
echo "      - Frontend dist to: /var/www/worklinkindia.com/frontend/dist/"
echo "      - Nginx config to: /etc/nginx/sites-available/worklinkindia.com"
echo "\n   2. Configure SSL certificate:"
echo "      - Place certificate at: /etc/ssl/certs/worklinkindia.com.crt"
echo "      - Place private key at: /etc/ssl/private/worklinkindia.com.key"
echo "\n   3. Enable Nginx site:"
echo "      sudo ln -s /etc/nginx/sites-available/worklinkindia.com /etc/nginx/sites-enabled/"
echo "      sudo nginx -t"
echo "      sudo systemctl reload nginx"
echo "\n   4. Start the backend service:"
echo "      sudo systemctl start worklink-backend"
echo "      sudo systemctl enable worklink-backend"
echo "\n   5. Check service status:"
echo "      sudo systemctl status worklink-backend"
echo "      sudo systemctl status mongod"
echo "      sudo systemctl status nginx"

echo "\n✅ Server is ready for WorkLink deployment!"
echo "\n🌐 Your application will be available at: https://worklinkindia.com"