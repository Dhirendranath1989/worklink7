const express = require('express');
const router = express.Router();
const mongoService = require('../services/mongoService');
const os = require('os');

router.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: mongoService.isConnected ? 'connected' : 'disconnected',
        details: mongoService.getStatus()
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        system: Math.round(os.totalmem() / 1024 / 1024)
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: os.loadavg()
      }
    }
  };

  const statusCode = mongoService.isConnected ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

module.exports = router;