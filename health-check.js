#!/usr/bin/env node

/**
 * WorkLink Production Health Check Script
 * Monitors the health of the application and its dependencies
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const config = {
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:5000',
    healthEndpoint: '/api/health',
    timeout: 5000
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'https://www.worklinkindia.com',
    timeout: 10000
  },
  database: {
    checkConnection: true
  },
  disk: {
    warningThreshold: 80, // percentage
    criticalThreshold: 90
  },
  memory: {
    warningThreshold: 80, // percentage
    criticalThreshold: 90
  },
  logFile: path.join(__dirname, 'health-check.log')
};

// Health check results
const results = {
  timestamp: new Date().toISOString(),
  status: 'healthy',
  checks: {},
  warnings: [],
  errors: []
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  // Append to log file
  fs.appendFileSync(config.logFile, logMessage + '\n');
}

function addResult(checkName, status, message, details = null) {
  results.checks[checkName] = {
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (status === 'error') {
    results.errors.push(`${checkName}: ${message}`);
    results.status = 'unhealthy';
  } else if (status === 'warning') {
    results.warnings.push(`${checkName}: ${message}`);
    if (results.status === 'healthy') {
      results.status = 'degraded';
    }
  }
}

// HTTP request helper
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data,
          headers: res.headers
        });
      });
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
    
    req.on('error', reject);
  });
}

// System resource checks
function checkDiskSpace() {
  return new Promise((resolve) => {
    exec('df -h /', (error, stdout) => {
      if (error) {
        addResult('disk_space', 'error', 'Failed to check disk space', error.message);
        return resolve();
      }
      
      const lines = stdout.trim().split('\n');
      if (lines.length < 2) {
        addResult('disk_space', 'error', 'Invalid disk space output');
        return resolve();
      }
      
      const usage = lines[1].split(/\s+/);
      const usedPercentage = parseInt(usage[4].replace('%', ''));
      
      if (usedPercentage >= config.disk.criticalThreshold) {
        addResult('disk_space', 'error', `Disk usage critical: ${usedPercentage}%`, { usage: usedPercentage });
      } else if (usedPercentage >= config.disk.warningThreshold) {
        addResult('disk_space', 'warning', `Disk usage high: ${usedPercentage}%`, { usage: usedPercentage });
      } else {
        addResult('disk_space', 'healthy', `Disk usage normal: ${usedPercentage}%`, { usage: usedPercentage });
      }
      
      resolve();
    });
  });
}

function checkMemoryUsage() {
  return new Promise((resolve) => {
    exec('free -m', (error, stdout) => {
      if (error) {
        addResult('memory_usage', 'error', 'Failed to check memory usage', error.message);
        return resolve();
      }
      
      const lines = stdout.trim().split('\n');
      const memLine = lines.find(line => line.startsWith('Mem:'));
      
      if (!memLine) {
        addResult('memory_usage', 'error', 'Invalid memory usage output');
        return resolve();
      }
      
      const memData = memLine.split(/\s+/);
      const total = parseInt(memData[1]);
      const used = parseInt(memData[2]);
      const usedPercentage = Math.round((used / total) * 100);
      
      if (usedPercentage >= config.memory.criticalThreshold) {
        addResult('memory_usage', 'error', `Memory usage critical: ${usedPercentage}%`, { 
          used: used + 'MB', 
          total: total + 'MB', 
          percentage: usedPercentage 
        });
      } else if (usedPercentage >= config.memory.warningThreshold) {
        addResult('memory_usage', 'warning', `Memory usage high: ${usedPercentage}%`, { 
          used: used + 'MB', 
          total: total + 'MB', 
          percentage: usedPercentage 
        });
      } else {
        addResult('memory_usage', 'healthy', `Memory usage normal: ${usedPercentage}%`, { 
          used: used + 'MB', 
          total: total + 'MB', 
          percentage: usedPercentage 
        });
      }
      
      resolve();
    });
  });
}

// Service checks
function checkBackendHealth() {
  return new Promise(async (resolve) => {
    try {
      const response = await makeRequest(
        config.backend.url + config.backend.healthEndpoint,
        config.backend.timeout
      );
      
      if (response.statusCode === 200) {
        addResult('backend_health', 'healthy', `Backend responding (${response.responseTime}ms)`, {
          responseTime: response.responseTime,
          statusCode: response.statusCode
        });
      } else {
        addResult('backend_health', 'error', `Backend returned status ${response.statusCode}`, {
          responseTime: response.responseTime,
          statusCode: response.statusCode
        });
      }
    } catch (error) {
      addResult('backend_health', 'error', 'Backend health check failed', error.message);
    }
    resolve();
  });
}

function checkFrontendHealth() {
  return new Promise(async (resolve) => {
    try {
      const response = await makeRequest(config.frontend.url, config.frontend.timeout);
      
      if (response.statusCode === 200) {
        addResult('frontend_health', 'healthy', `Frontend responding (${response.responseTime}ms)`, {
          responseTime: response.responseTime,
          statusCode: response.statusCode
        });
      } else {
        addResult('frontend_health', 'error', `Frontend returned status ${response.statusCode}`, {
          responseTime: response.responseTime,
          statusCode: response.statusCode
        });
      }
    } catch (error) {
      addResult('frontend_health', 'error', 'Frontend health check failed', error.message);
    }
    resolve();
  });
}

function checkDatabaseConnection() {
  return new Promise((resolve) => {
    if (!config.database.checkConnection) {
      addResult('database_connection', 'skipped', 'Database check disabled');
      return resolve();
    }
    
    // Try to connect to MongoDB
    exec('mongosh --eval "db.adminCommand(\'ping\')" --quiet', (error, stdout) => {
      if (error) {
        addResult('database_connection', 'error', 'Database connection failed', error.message);
      } else {
        try {
          const result = JSON.parse(stdout);
          if (result.ok === 1) {
            addResult('database_connection', 'healthy', 'Database connection successful');
          } else {
            addResult('database_connection', 'error', 'Database ping failed', result);
          }
        } catch (parseError) {
          addResult('database_connection', 'error', 'Failed to parse database response', parseError.message);
        }
      }
      resolve();
    });
  });
}

function checkProcesses() {
  return new Promise((resolve) => {
    exec('pgrep -f "node.*server.js"', (error, stdout) => {
      if (error || !stdout.trim()) {
        addResult('backend_process', 'error', 'Backend process not running');
      } else {
        const pids = stdout.trim().split('\n');
        addResult('backend_process', 'healthy', `Backend process running (PIDs: ${pids.join(', ')})`, {
          pids: pids
        });
      }
      resolve();
    });
  });
}

function checkLogFiles() {
  return new Promise((resolve) => {
    const logPaths = [
      path.join(__dirname, 'backend', 'logs', 'error.log'),
      path.join(__dirname, 'backend', 'logs', 'combined.log'),
      '/var/log/nginx/error.log'
    ];
    
    let errorCount = 0;
    let warningCount = 0;
    
    logPaths.forEach(logPath => {
      if (fs.existsSync(logPath)) {
        try {
          const stats = fs.statSync(logPath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          
          if (stats.size > 100 * 1024 * 1024) { // 100MB
            warningCount++;
          }
          
          // Check for recent errors (last 1000 lines)
          exec(`tail -1000 "${logPath}" | grep -i error | wc -l`, (error, stdout) => {
            if (!error) {
              const recentErrors = parseInt(stdout.trim());
              if (recentErrors > 10) {
                errorCount++;
              }
            }
          });
        } catch (error) {
          errorCount++;
        }
      }
    });
    
    if (errorCount > 0) {
      addResult('log_files', 'error', `Found ${errorCount} log files with issues`);
    } else if (warningCount > 0) {
      addResult('log_files', 'warning', `Found ${warningCount} large log files`);
    } else {
      addResult('log_files', 'healthy', 'Log files are normal');
    }
    
    resolve();
  });
}

// SSL certificate check
function checkSSLCertificate() {
  return new Promise((resolve) => {
    if (!config.frontend.url.startsWith('https')) {
      addResult('ssl_certificate', 'skipped', 'HTTPS not configured');
      return resolve();
    }
    
    const domain = new URL(config.frontend.url).hostname;
    exec(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`, (error, stdout) => {
      if (error) {
        addResult('ssl_certificate', 'error', 'Failed to check SSL certificate', error.message);
        return resolve();
      }
      
      const lines = stdout.trim().split('\n');
      const notAfterLine = lines.find(line => line.startsWith('notAfter='));
      
      if (notAfterLine) {
        const expiryDate = new Date(notAfterLine.replace('notAfter=', ''));
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 7) {
          addResult('ssl_certificate', 'error', `SSL certificate expires in ${daysUntilExpiry} days`, {
            expiryDate: expiryDate.toISOString(),
            daysUntilExpiry
          });
        } else if (daysUntilExpiry < 30) {
          addResult('ssl_certificate', 'warning', `SSL certificate expires in ${daysUntilExpiry} days`, {
            expiryDate: expiryDate.toISOString(),
            daysUntilExpiry
          });
        } else {
          addResult('ssl_certificate', 'healthy', `SSL certificate valid for ${daysUntilExpiry} days`, {
            expiryDate: expiryDate.toISOString(),
            daysUntilExpiry
          });
        }
      } else {
        addResult('ssl_certificate', 'error', 'Could not parse SSL certificate expiry');
      }
      
      resolve();
    });
  });
}

// Main health check function
async function runHealthCheck() {
  log('Starting health check...');
  
  const checks = [
    checkDiskSpace,
    checkMemoryUsage,
    checkBackendHealth,
    checkFrontendHealth,
    checkDatabaseConnection,
    checkProcesses,
    checkLogFiles,
    checkSSLCertificate
  ];
  
  // Run all checks
  await Promise.all(checks.map(check => check()));
  
  // Generate summary
  const summary = {
    status: results.status,
    timestamp: results.timestamp,
    totalChecks: Object.keys(results.checks).length,
    healthyChecks: Object.values(results.checks).filter(c => c.status === 'healthy').length,
    warningChecks: Object.values(results.checks).filter(c => c.status === 'warning').length,
    errorChecks: Object.values(results.checks).filter(c => c.status === 'error').length,
    skippedChecks: Object.values(results.checks).filter(c => c.status === 'skipped').length
  };
  
  log(`Health check completed: ${summary.status}`);
  log(`Checks: ${summary.healthyChecks} healthy, ${summary.warningChecks} warnings, ${summary.errorChecks} errors, ${summary.skippedChecks} skipped`);
  
  if (results.errors.length > 0) {
    log('ERRORS:', 'error');
    results.errors.forEach(error => log(`  - ${error}`, 'error'));
  }
  
  if (results.warnings.length > 0) {
    log('WARNINGS:', 'warn');
    results.warnings.forEach(warning => log(`  - ${warning}`, 'warn'));
  }
  
  // Output JSON if requested
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ summary, results }, null, 2));
  }
  
  // Exit with appropriate code
  process.exit(results.status === 'healthy' ? 0 : 1);
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
WorkLink Health Check Script

Usage: node health-check.js [options]

Options:
  --json     Output results in JSON format
  --help     Show this help message

Environment Variables:
  BACKEND_URL    Backend URL (default: http://localhost:5000)
  FRONTEND_URL   Frontend URL (default: https://www.worklinkindia.com)

Exit Codes:
  0    All checks passed (healthy)
  1    Some checks failed (unhealthy or degraded)
`);
  process.exit(0);
}

// Run the health check
runHealthCheck().catch(error => {
  log(`Health check failed: ${error.message}`, 'error');
  process.exit(1);
});