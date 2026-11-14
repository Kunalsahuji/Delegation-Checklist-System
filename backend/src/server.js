const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./database/connect');
const { startCron } = require('./cron');

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();
    startCron();

    server.listen(config.port, () => {
      logger.info(`TaskFlow ERP Backend running on port ${config.port} [${config.env}]`);
      logger.info(`Health check: http://localhost:${config.port}${config.apiPrefix}/health`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

const shutdown = (signal) => {
  logger.info(`${signal} received — gracefully shutting down`);
  server.close(async () => {
    try {
      await disconnectDB();
    } catch (err) {
      logger.error('Error during DB disconnect', { error: err.message });
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown — server did not close in 10s');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
