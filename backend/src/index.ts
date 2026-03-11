import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { ErrorRequestHandler } from "express";
import { supabaseAdmin } from './lib/supabaseAdmin.js';
import authRouter from './routes/auth.js';
import consultanciesRouter from './routes/consultancies.js';
import creditsRouter from './routes/credits.js';
import coursesRouter from './routes/courses.js';
import webhooksRouter from './routes/webhooks.js';
import adminCoursesRouter from './routes/admin/courses.js';
import adminUsersRouter from './routes/admin/users.js';
import { requireAuth, type AuthenticatedRequest } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Rate limiters ────────────────────────────────────────────────
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' },
});

const webhookLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook rate limit exceeded.' },
});

const adminLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Admin rate limit exceeded.' },
});

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(generalLimit);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/health/db', async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({
      status: 'error',
      message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set',
    });
    return;
  }

  const expectedTables = [
    'profiles', 'plans', 'subscriptions', 'consultancies',
    'consultancy_diagnostics', 'credit_transactions', 'audit_log',
  ];

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .limit(0);

  if (error) {
    res.status(503).json({ status: 'error', message: error.message });
    return;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tables: expectedTables,
    connected: data !== null,
  });
});

// Auth routes
app.use('/auth', authLimit, authRouter);

// API routes
app.use('/api/consultancies', consultanciesRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/courses', coursesRouter);

// Admin routes (stricter rate limit)
app.use('/api/admin/courses', adminLimit, adminCoursesRouter);
app.use('/api/admin/users', adminLimit, adminUsersRouter);

// Webhooks
app.use('/api/webhooks', webhookLimit, webhooksRouter);

// Protected: returns authenticated user id
app.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user_id: req.userId });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Iris Platform API',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handling
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
};

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ─── Admin Bootstrap ─────────────────────────────────────────────
async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !supabaseAdmin) return;

  try {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = users.find((u) => u.email === adminEmail);
    if (!adminUser) {
      console.log(`ADMIN_EMAIL "${adminEmail}" not found in auth — skipping bootstrap`);
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (profile && profile.role !== 'admin') {
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', adminUser.id);
      console.log(`✓ Admin bootstrap: promoted ${adminEmail} to admin`);
    }
  } catch (err) {
    console.error('Admin bootstrap error:', err);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  await bootstrapAdmin();
});
