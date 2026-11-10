import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import repositoryRoutes from './routes/repositoryRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // No Origin is common for curl and server-to-server requests.
    // A wildcard is useful when the frontend is hosted on a separate preview URL.
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('This origin is not allowed by the API CORS policy'));
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({
    name: 'OpenIssue Backend',
    description: 'Repository issue tracking and collaboration API',
    status: 'running',
    apiBase: '/api/v1',
    health: '/api/v1/health',
    documentation: 'https://github.com/ujjwal-painuly/openissue-backend#readme'
  });
});

app.get('/api/v1', (_req, res) => {
  res.json({
    name: 'OpenIssue API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/v1/health',
      register: 'POST /api/v1/auth/register',
      login: 'POST /api/v1/auth/login',
      repositories: 'GET|POST /api/v1/repositories',
      dashboard: 'GET /api/v1/dashboard/summary'
    }
  });
});

app.get('/api/v1/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  const statusCode = databaseConnected ? 200 : 503;

  return res.status(statusCode).json({
    status: databaseConnected ? 'success' : 'error',
    data: {
      service: 'OpenIssue API',
      healthy: databaseConnected,
      database: databaseConnected ? 'connected' : 'disconnected'
    }
  });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many authentication attempts. Try again later.' }
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/repositories', repositoryRoutes);
app.use('/api/v1/issues', issueRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
