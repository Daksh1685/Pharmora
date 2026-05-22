const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    });

    logger.info('✅ MongoDB Atlas connected successfully');

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB Atlas disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err.message);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('❌ Failed to connect MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
