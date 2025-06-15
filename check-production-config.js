#!/usr/bin/env node

/**
 * Production Configuration Checker for WorkLink
 * This script validates the production configuration before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 WorkLink Production Configuration Checker\n');

let hasErrors = false;
let hasWarnings = false;

// Helper functions
function error(message) {
  console.log(`❌ ERROR: ${message}`);
  hasErrors = true;
}

function warning(message) {
  console.log(`⚠️  WARNING: ${message}`);
  hasWarnings = true;
}

function success(message) {
  console.log(`✅ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

// Check if file exists
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    success(`${description} exists`);
    return true;
  } else {
    error(`${description} not found at ${filePath}`);
    return false;
  }
}

// Parse environment file
function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=');
        }
      }
    });
    return env;
  } catch (err) {
    error(`Failed to parse ${filePath}: ${err.message}`);
    return null;
  }
}

// Check environment variables
function checkEnvVar(env, key, description, required = true, defaultValue = null) {
  if (env[key]) {
    if (env[key] === defaultValue || env[key].includes('your_') || env[key].includes('YOUR_')) {
      warning(`${description} is set to default/placeholder value: ${env[key]}`);
    } else {
      success(`${description} is configured`);
    }
  } else if (required) {
    error(`${description} is missing (${key})`);
  } else {
    info(`${description} is optional and not set (${key})`);
  }
}

// Main checks
console.log('📋 Checking file structure...');

// Check essential files
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.production');
const backendEnvPath = path.join(__dirname, 'backend', '.env.production');
const backendServerPath = path.join(__dirname, 'backend', 'server.js');
const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');
const backendPackagePath = path.join(__dirname, 'backend', 'package.json');

checkFileExists(frontendEnvPath, 'Frontend .env.production');
checkFileExists(backendEnvPath, 'Backend .env.production');
checkFileExists(backendServerPath, 'Backend server.js');
checkFileExists(frontendPackagePath, 'Frontend package.json');
checkFileExists(backendPackagePath, 'Backend package.json');

console.log('\n🔧 Checking backend configuration...');

// Check backend environment
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = parseEnvFile(backendEnvPath);
  if (backendEnv) {
    checkEnvVar(backendEnv, 'NODE_ENV', 'Node environment', true);
    checkEnvVar(backendEnv, 'PORT', 'Backend port', true);
    checkEnvVar(backendEnv, 'JWT_SECRET', 'JWT secret', true, 'your_super_secure_jwt_secret_key_here_change_this_in_production');
    checkEnvVar(backendEnv, 'MONGODB_URI', 'MongoDB connection string', true);
    checkEnvVar(backendEnv, 'CORS_ORIGIN', 'CORS origins', true);
    
    // Check if production values are set
    if (backendEnv.NODE_ENV !== 'production') {
      warning('NODE_ENV is not set to "production"');
    }
    
    if (backendEnv.MONGODB_URI && backendEnv.MONGODB_URI.includes('localhost')) {
      warning('MongoDB URI points to localhost - ensure this is correct for production');
    }
    
    if (backendEnv.CORS_ORIGIN && !backendEnv.CORS_ORIGIN.includes('worklinkindia.com')) {
      warning('CORS_ORIGIN does not include worklinkindia.com domain');
    }
  }
}

console.log('\n🌐 Checking frontend configuration...');

// Check frontend environment
if (fs.existsSync(frontendEnvPath)) {
  const frontendEnv = parseEnvFile(frontendEnvPath);
  if (frontendEnv) {
    checkEnvVar(frontendEnv, 'VITE_API_BASE_URL', 'API base URL', true);
    checkEnvVar(frontendEnv, 'VITE_SOCKET_URL', 'Socket URL', true);
    checkEnvVar(frontendEnv, 'VITE_FIREBASE_API_KEY', 'Firebase API key', true);
    checkEnvVar(frontendEnv, 'VITE_FIREBASE_AUTH_DOMAIN', 'Firebase auth domain', true);
    checkEnvVar(frontendEnv, 'VITE_FIREBASE_PROJECT_ID', 'Firebase project ID', true);
    checkEnvVar(frontendEnv, 'VITE_APP_ENVIRONMENT', 'App environment', true);
    
    // Check if production URLs are set
    if (frontendEnv.VITE_API_BASE_URL && frontendEnv.VITE_API_BASE_URL.includes('localhost')) {
      warning('API base URL points to localhost - should use production domain');
    }
    
    if (frontendEnv.VITE_API_BASE_URL && !frontendEnv.VITE_API_BASE_URL.includes('worklinkindia.com')) {
      warning('API base URL does not include worklinkindia.com domain');
    }
    
    if (frontendEnv.VITE_APP_ENVIRONMENT !== 'production') {
      warning('App environment is not set to "production"');
    }
  }
}

console.log('\n📦 Checking package.json files...');

// Check package.json files
if (fs.existsSync(frontendPackagePath)) {
  try {
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    if (frontendPackage.scripts && frontendPackage.scripts.build) {
      success('Frontend build script exists');
    } else {
      error('Frontend build script is missing');
    }
  } catch (err) {
    error(`Failed to parse frontend package.json: ${err.message}`);
  }
}

if (fs.existsSync(backendPackagePath)) {
  try {
    const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    if (backendPackage.scripts && backendPackage.scripts.start) {
      success('Backend start script exists');
    } else {
      error('Backend start script is missing');
    }
    
    if (backendPackage.scripts && backendPackage.scripts['start:prod']) {
      success('Backend production start script exists');
    } else {
      warning('Backend production start script is missing');
    }
  } catch (err) {
    error(`Failed to parse backend package.json: ${err.message}`);
  }
}

console.log('\n🔒 Security checks...');

// Check for common security issues
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = parseEnvFile(backendEnvPath);
  if (backendEnv) {
    if (backendEnv.JWT_SECRET && backendEnv.JWT_SECRET.length < 32) {
      warning('JWT secret is shorter than 32 characters - consider using a longer secret');
    }
    
    if (backendEnv.JWT_SECRET && backendEnv.JWT_SECRET === 'fallback_secret') {
      error('JWT secret is set to default fallback value - this is insecure!');
    }
  }
}

console.log('\n📁 Checking directory structure...');

// Check important directories
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (fs.existsSync(uploadsDir)) {
  success('Backend uploads directory exists');
} else {
  warning('Backend uploads directory does not exist - it will be created automatically');
}

console.log('\n📊 Summary:');

if (hasErrors) {
  console.log('\n❌ Configuration has ERRORS that must be fixed before deployment!');
  console.log('\n🔧 Required actions:');
  console.log('   1. Fix all ERROR items listed above');
  console.log('   2. Review and address WARNING items');
  console.log('   3. Run this checker again to verify fixes');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Configuration has warnings but is deployable.');
  console.log('\n🔧 Recommended actions:');
  console.log('   1. Review and address WARNING items for better security');
  console.log('   2. Test the application thoroughly before production deployment');
  console.log('\n✅ You can proceed with deployment, but consider addressing warnings.');
} else {
  console.log('\n🎉 Configuration looks good! Ready for production deployment.');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run deploy:prod');
  console.log('   2. Upload files to your server');
  console.log('   3. Configure your web server (nginx/apache)');
  console.log('   4. Start the backend service');
  console.log('   5. Test the deployed application');
}

console.log('\n📋 Production deployment checklist:');
console.log('   □ DNS configured (worklinkindia.com)');
console.log('   □ SSL certificate installed');
console.log('   □ Web server configured (nginx/apache)');
console.log('   □ MongoDB accessible from server');
console.log('   □ Firewall configured (ports 80, 443, 5000)');
console.log('   □ Environment variables set on server');
console.log('   □ PM2 or systemd service configured');
console.log('   □ Monitoring and logging set up');
console.log('   □ Backup strategy implemented');

console.log('\n📖 For detailed deployment instructions, see: PRODUCTION_SETUP.md');