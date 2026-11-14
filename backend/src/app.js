const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler.middleware');

const authRoutes = require('./modules/auth/routes/auth.route');
const masterRoutes = require('./modules/master/routes/master.route');
const checklistRoutes = require('./modules/checklist/routes/checklist.route');
const delegationRoutes = require('./modules/delegation/routes/delegation.route');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching origins
      if (!origin || config.corsOrigin.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookieSecret));

if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get(`${config.apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TaskFlow ERP API',
  });
});

// Mount Routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/master`, masterRoutes);
app.use(`${config.apiPrefix}/checklist`, checklistRoutes);
app.use(`${config.apiPrefix}/delegation`, delegationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
