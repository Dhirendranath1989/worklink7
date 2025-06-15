#!/usr/bin/env node

/**
 * Production Deployment Script for WorkLink
 * Domain: worklinkindia.com
 * IP: 168.231.121.216
 * Backend Port: 5000
 * MongoDB: mongodb://127.0.0.1:27017
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting WorkLink Production Deployment...');
console.log('📋 Target Configuration:');
console.log('   Domain: worklinkindia.com');
console.log('   IP: 168.231.121.216');
console.log('   Backend Port: 5000');
console.log('   MongoDB: mongodb://127.0.0.1:27017');

// Configuration
const config = {
  domain: 'worklinkindia.com',
  ip: '168.231.121.216',
  port: '5000',
  mongoUri: 'mongodb://127.0.0.1:27017/worklink'
};

// Step 1: Verify environment files
console.log('\n📋 Step 1: Verifying environment configuration...');

const frontendEnvPath = path.join(__dirname, 'frontend', '.env.production');
const backendEnvPath = path.join(__dirname, 'backend', '.env.production');

if (!fs.existsSync(frontendEnvPath)) {
  console.error('❌ Frontend .env.production file not found!');
  process.exit(1);
}

if (!fs.existsSync(backendEnvPath)) {
  console.error('❌ Backend .env.production file not found!');
  process.exit(1);
}

// Verify environment file contents
const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');

if (!frontendEnv.includes('worklinkindia.com')) {
  console.error('❌ Frontend environment not configured for worklinkindia.com!');
  process.exit(1);
}

if (!backendEnv.includes('mongodb://127.0.0.1:27017')) {
  console.error('❌ Backend environment not configured for local MongoDB!');
  process.exit(1);
}

console.log('✅ Environment files verified');

// Step 2: Clean previous builds
console.log('\n🧹 Step 2: Cleaning previous builds...');

const distPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('✅ Previous build cleaned');
}

// Step 3: Install dependencies
console.log('\n📦 Step 3: Installing dependencies...');

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install --production=false', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  
  console.log('Installing backend dependencies...');
  execSync('npm install --production', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 4: Build frontend for production
console.log('\n🏗️  Step 4: Building frontend for production...');

try {
  execSync('npm run build:prod', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  console.log('✅ Frontend build completed successfully');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 5: Verify build output
console.log('\n🔍 Step 5: Verifying build output...');

if (!fs.existsSync(distPath)) {
  console.error('❌ Frontend dist folder not found!');
  process.exit(1);
}

const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Frontend index.html not found in dist folder!');
  process.exit(1);
}

// Check if assets folder exists
const assetsPath = path.join(distPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.error('❌ Frontend assets folder not found!');
  process.exit(1);
}

console.log('✅ Build output verified');

// Step 6: Create deployment package info
console.log('\n📦 Step 6: Creating deployment package...');

const deploymentInfo = {
  timestamp: new Date().toISOString(),
  domain: config.domain,
  ip: config.ip,
  port: config.port,
  mongoUri: config.mongoUri,
  buildPath: distPath,
  backendPath: path.join(__dirname, 'backend'),
  nginxConfig: path.join(__dirname, 'nginx-worklinkindia.conf')
};

fs.writeFileSync(
  path.join(__dirname, 'deployment-info.json'),
  JSON.stringify(deploymentInfo, null, 2)
);

console.log('✅ Deployment package created');

// Step 7: Display deployment information
console.log('\n🎉 Production build completed successfully!');
console.log('\n📋 Deployment Information:');
console.log(`   Domain: https://${config.domain}`);
console.log(`   IP Address: ${config.ip}`);
console.log(`   Backend Port: ${config.port}`);
console.log(`   MongoDB URI: ${config.mongoUri}`);
console.log(`   Frontend Build: ${distPath}`);
console.log(`   Backend Path: ${path.join(__dirname, 'backend')}`);
console.log(`   Nginx Config: ${path.join(__dirname, 'nginx-worklinkindia.conf')}`);

console.log('\n📝 Server Deployment Steps:');
console.log('   1. Upload backend folder to: /var/www/worklinkindia.com/backend/');
console.log('   2. Upload frontend/dist folder to: /var/www/worklinkindia.com/frontend/dist/');
console.log('   3. Copy nginx-worklinkindia.conf to: /etc/nginx/sites-available/worklinkindia.com');
console.log('   4. Enable site: sudo ln -s /etc/nginx/sites-available/worklinkindia.com /etc/nginx/sites-enabled/');
console.log('   5. Test nginx config: sudo nginx -t');
console.log('   6. Reload nginx: sudo systemctl reload nginx');
console.log('   7. Start backend: cd /var/www/worklinkindia.com/backend && NODE_ENV=production npm start');

console.log('\n🔧 Server Requirements:');
console.log('   - Node.js 16+ installed');
console.log('   - MongoDB running on localhost:27017');
console.log('   - Nginx installed and configured');
console.log('   - SSL certificate for worklinkindia.com');
console.log('   - Domain DNS pointing to 168.231.121.216');

console.log('\n✅ Deployment preparation complete!');
console.log('\n🚀 Ready for server deployment!');