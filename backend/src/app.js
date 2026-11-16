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
const crmRoutes = require('./modules/crm/routes/crm.route');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Check wildcard or exact match in configured corsOrigin
      if (config.corsOrigin.includes('*') || config.corsOrigin.includes(origin)) {
        return callback(null, true);
      }

      // Allow local development servers
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // Allow Vercel deployments (*.vercel.app)
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.vercel.app') || hostname.endsWith('.onrender.com')) {
          return callback(null, true);
        }
      } catch (e) {
        // invalid URL format, ignore
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
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

// Health check endpoints (supports Render default `/` or `/health` and `/api/v1/health`)
app.get(['/', '/health', `${config.apiPrefix}/health`], (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TaskFlow ERP API',
    env: config.env,
  });
});

// Mount Routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/master`, masterRoutes);
app.use(`${config.apiPrefix}/checklist`, checklistRoutes);
app.use(`${config.apiPrefix}/delegation`, delegationRoutes);
app.use(`${config.apiPrefix}/crm`, crmRoutes);

// Master shortcuts / aliases (/api/v1/users, /api/v1/departments, /api/v1/projects)
app.use(`${config.apiPrefix}/users`, (req, res, next) => {
  req.url = `/users${req.url === '/' ? '' : req.url}`;
  masterRoutes(req, res, next);
});
app.use(`${config.apiPrefix}/departments`, (req, res, next) => {
  req.url = `/departments${req.url === '/' ? '' : req.url}`;
  masterRoutes(req, res, next);
});
app.use(`${config.apiPrefix}/projects`, (req, res, next) => {
  req.url = `/projects${req.url === '/' ? '' : req.url}`;
  masterRoutes(req, res, next);
});

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
