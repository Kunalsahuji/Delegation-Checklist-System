const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 15000,
    });
    logger.info(`MongoDB connected to cluster: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection failure', { error: error.message });
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

module.exports = { connectDB, disconnectDB };
