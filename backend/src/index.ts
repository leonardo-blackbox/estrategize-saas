import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { ErrorRequestHandler } from "express";
import { supabaseAdmin } from './lib/supabaseAdmin.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
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
app.use('/auth', authRouter);

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

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
