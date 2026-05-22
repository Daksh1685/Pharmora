
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const corsMiddleware = require('./middleware/corsConfig');
const { errorHandler } = require('./middleware/errorHandler');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const batchRoutes = require('./routes/batchRoutes');
const saleRoutes = require('./routes/saleRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(corsMiddleware);

app.use(`${process.env.API_PREFIX}/health`, healthRoutes);

app.use(`${process.env.API_PREFIX}/auth`, authRoutes);

app.use(`${process.env.API_PREFIX}/medicines`, medicineRoutes);

app.use(`${process.env.API_PREFIX}/categories`, categoryRoutes);

app.use(`${process.env.API_PREFIX}/batches`, batchRoutes);

app.use(`${process.env.API_PREFIX}/sales`, saleRoutes);

app.use(`${process.env.API_PREFIX}/purchases`, purchaseRoutes);

app.use(`${process.env.API_PREFIX}/reports`, reportsRoutes);

app.use(`${process.env.API_PREFIX}/ai`, aiRoutes);

app.use(`${process.env.API_PREFIX}/notifications`, notificationRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pharmacy Inventory Management System API',
    version: process.env.API_VERSION,
    documentation: '/api/docs',
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pharmacy Inventory Management System API',
    version: process.env.API_VERSION || '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      medicines: '/api/medicines',
      batches: '/api/batches',
      sales: '/api/sales',
      purchases: '/api/purchases',
      reports: '/api/reports',
      ai: '/api/ai',
      notifications: '/api/notifications',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    
    await connectDB();

    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || 'localhost';

    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
      logger.info(`📝 API Base URL: http://${HOST}:${PORT}${process.env.API_PREFIX}`);
      logger.info(`🏥 Pharmacy Inventory System initialized`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = app;
