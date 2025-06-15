#!/usr/bin/env node

/**
 * Production Deployment Script for WorkLink
 * This script prepares the application for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting WorkLink Production Deployment...');

// Configuration
const config = {
  domain: 'www.worklinkindia.com',
  ip: '168.231.121.216',
  port: '5000'
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

console.log('✅ Environment files verified');

// Step 2: Install dependencies
console.log('\n📦 Step 2: Installing dependencies...');

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  
  console.log('Installing backend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Step 3: Build frontend
console.log('\n🏗️  Step 3: Building frontend for production...');

try {
  execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  console.log('✅ Frontend build completed successfully');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 4: Verify build output
console.log('\n🔍 Step 4: Verifying build output...');

const distPath = path.join(__dirname, 'frontend', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Frontend dist folder not found!');
  process.exit(1);
}

const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Frontend index.html not found in dist folder!');
  process.exit(1);
}

console.log('✅ Build output verified');

// Step 5: Display deployment information
console.log('\n🎉 Production build completed successfully!');
console.log('\n📋 Deployment Information:');
console.log(`   Domain: https://${config.domain}`);
console.log(`   IP Address: ${config.ip}`);
console.log(`   Backend Port: ${config.port}`);
console.log(`   Frontend Build: ${distPath}`);

console.log('\n📝 Next Steps:');
console.log('   1. Upload the backend folder to your server');
console.log('   2. Upload the frontend/dist folder to your web server');
console.log('   3. Configure your web server to serve the frontend files');
console.log('   4. Start the backend server with: NODE_ENV=production npm start');
console.log('   5. Configure SSL certificate for HTTPS');
console.log('   6. Set up domain DNS to point to your server IP');

console.log('\n🔧 Server Configuration:');
console.log('   - Ensure MongoDB is running and accessible');
console.log('   - Configure firewall to allow ports 80, 443, and 5000');
console.log('   - Set up reverse proxy (nginx/apache) if needed');
console.log('   - Configure environment variables on the server');

console.log('\n✅ Deployment preparation complete!');