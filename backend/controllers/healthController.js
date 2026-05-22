const { asyncHandler } = require('../middleware/errorHandler');
const mongoose = require('mongoose');

const getHealth = asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState;

  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: statusMap[dbStatus],
      connected: dbStatus === 1,
    },
    environment: process.env.NODE_ENV,
  });
});

const getDetailedHealth = asyncHandler(async (req, res) => {
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    server: {
      status: 'running',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    system: {
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      },
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
});

module.exports = {
  getHealth,
  getDetailedHealth,
};
