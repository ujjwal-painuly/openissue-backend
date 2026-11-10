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
// Render terminates TLS at one trusted reverse proxy. Trust only that hop so
// express-rate-limit can use the real client IP without trusting arbitrary chains.
app.set('trust proxy', 1);
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
  const databaseConnected = mongoose.connection.readyState === 1;
  const statusLabel = databaseConnected ? 'Database connected' : 'Database connecting';
  const statusClass = databaseConnected ? 'online' : 'pending';

  res.status(200).type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b1020">
  <meta name="description" content="OpenIssue — repository issue tracking and collaboration API.">
  <title>OpenIssue — Developer API</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; color: #edf2ff; background: radial-gradient(ellipse at 50% -15%, #243b70 0, #111a32 38%, #090e1c 78%); }
    a { color: inherit; }
    .wrap { width: min(1060px, calc(100% - 40px)); margin: 0 auto; }
    header { height: 82px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,.09); }
    .brand { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; font-weight: 750; letter-spacing: -.03em; }
    .mark { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; color: white; background: linear-gradient(135deg,#6d8cff,#8b5cf6); box-shadow: 0 8px 24px rgba(99,102,241,.3); font-size: 14px; }
    .nav { display: flex; align-items: center; gap: 24px; color: #b8c4df; font-size: 13px; }
    .nav a { text-decoration: none; }
    .nav a:hover { color: white; }
    .hero { padding: 100px 0 76px; max-width: 780px; }
    .eyebrow { display: inline-flex; align-items: center; gap: 9px; padding: 8px 12px; border: 1px solid rgba(148,163,255,.24); border-radius: 999px; color: #c5d2ff; background: rgba(79,100,180,.13); font-size: 11px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #54dfa1; box-shadow: 0 0 12px #54dfa1; }
    h1 { margin: 25px 0 18px; font-size: clamp(46px, 8vw, 76px); line-height: .99; letter-spacing: -.065em; font-weight: 800; }
    h1 span { color: #9caeff; }
    .intro { max-width: 620px; margin: 0; color: #aab7d2; font-size: 17px; line-height: 1.75; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border: 1px solid rgba(255,255,255,.15); border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 700; transition: transform .18s ease, border-color .18s ease; }
    .btn:hover { transform: translateY(-2px); border-color: rgba(166,183,255,.6); }
    .primary { color: #0b1020; border-color: transparent; background: #c5d2ff; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 0 0 82px; }
    .card { min-height: 150px; padding: 22px; border: 1px solid rgba(255,255,255,.1); border-radius: 17px; background: linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.025)); }
    .card-label { color: #8392b1; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; font-weight: 750; }
    .card-value { margin-top: 17px; font-size: 17px; font-weight: 700; letter-spacing: -.02em; overflow-wrap: anywhere; }
    .card-note { margin-top: 8px; color: #94a3bf; font-size: 12px; line-height: 1.5; }
    .status { display: inline-flex; align-items: center; gap: 8px; }
    .status .dot { background: ${databaseConnected ? "#54dfa1" : "#f5bf60"}; box-shadow: 0 0 12px ${databaseConnected ? "#54dfa1" : "#f5bf60"}; }
    .pending .dot { background: #f5bf60; box-shadow: 0 0 12px #f5bf60; }
    footer { padding: 24px 0 34px; border-top: 1px solid rgba(255,255,255,.09); display: flex; justify-content: space-between; gap: 12px; color: #7786a5; font-size: 12px; }
    footer a { color: #aebcff; text-decoration: none; }
    @media (max-width: 700px) { .hero { padding: 76px 0 55px; } .cards { grid-template-columns: 1fr; margin-bottom: 56px; } .card { min-height: 125px; } .nav { gap: 13px; } }
    @media (max-width: 430px) { .wrap { width: min(100% - 28px, 1060px); } header { height: 70px; } .nav { font-size: 12px; } .nav a:first-child { display: none; } .intro { font-size: 15px; } footer { flex-direction: column; } }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <a class="brand" href="/" aria-label="OpenIssue home">
        <span class="mark">OI</span><span>OpenIssue</span>
      </a>
      <nav class="nav" aria-label="Main navigation">
        <a href="/api/v1">API index</a>
        <a href="https://github.com/ujjwal-painuly/openissue-backend" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <div class="eyebrow"><span class="dot"></span> Repository collaboration API</div>
        <h1>Keep issues.<br><span>Keep moving.</span></h1>
        <p class="intro">OpenIssue is a backend API for organising repository issues and team collaboration. Create repositories, track work, discuss updates, and keep project activity in one place.</p>
        <div class="actions">
          <a class="btn primary" href="/api/v1">Explore API endpoints ↗</a>
          <a class="btn" href="https://github.com/ujjwal-painuly/openissue-backend#readme" target="_blank" rel="noopener noreferrer">Read documentation ↗</a>
        </div>
      </section>
      <section class="cards" aria-label="Service information">
        <article class="card">
          <div class="card-label">Service</div>
          <div class="card-value">OpenIssue API</div>
          <div class="card-note">Version 1 · REST API</div>
        </article>
        <article class="card">
          <div class="card-label">Database status</div>
          <div class="card-value status ${statusClass}"><span class="dot"></span>${statusLabel}</div>
          <div class="card-note">MongoDB connection status</div>
        </article>
        <article class="card">
          <div class="card-label">Health endpoint</div>
          <div class="card-value"><a href="/api/v1/health" style="text-decoration:none;color:#c5d2ff">/api/v1/health ↗</a></div>
          <div class="card-note">Check service and database health</div>
        </article>
      </section>
    </main>
    <footer>
      <span>© ${new Date().getFullYear()} OpenIssue · Built for clearer collaboration</span>
      <span><a href="https://github.com/ujjwal-painuly/openissue-backend" target="_blank" rel="noopener noreferrer">View source on GitHub ↗</a></span>
    </footer>
  </div>
</body>
</html>`);
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
