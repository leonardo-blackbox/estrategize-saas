import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { ErrorRequestHandler } from 'express';
import { supabaseAdmin } from './lib/supabaseAdmin.js';
import authRouter from './routes/auth.js';
import consultanciesRouter from './routes/consultancies.js';
import creditsRouter from './routes/credits.js';
import coursesRouter from './routes/courses.js';
import webhooksRouter from './routes/webhooks.js';
import adminCoursesRouter from './routes/admin/courses.js';
import adminUsersRouter from './routes/admin/users.js';
import formacaoRouter from './routes/admin/formacao.js';
import adminTurmasRouter from './routes/admin/turmas.js';
import adminOfertasRouter from './routes/admin/ofertas.js';
import adminHomeRouter from './routes/admin/home.js';
import adminStripeRouter from './routes/admin/stripe.js';
import applicationsRouter from './routes/applications.js';
import publicFormsRouter from './routes/public/forms.js';
import assetsRouter from './routes/assets.js';
import analyticsRouter from './routes/analytics.js';
import templatesRouter from './routes/templates.js';
import { requireAuth, type AuthenticatedRequest } from './middleware/auth.js';

export const app = express();

// Trust Railway/Vercel proxy so rate-limiter reads real client IP from X-Forwarded-For
app.set('trust proxy', 1);

// ─── Rate limiters ────────────────────────────────────────────────
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
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
  windowMs: 1 * 60 * 1000,
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

// ─── CORS ────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL?.trim(),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    // Allow exact matches
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow all Vercel preview/production deployments
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(generalLimit);
app.use(express.json());

// ─── Health ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/db', async (_req, res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ status: 'error', message: 'Supabase not configured' });
    return;
  }
  const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(0);
  if (error) {
    res.status(503).json({ status: 'error', message: error.message });
    return;
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString(), connected: data !== null });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use('/auth', authLimit, authRouter);
app.use('/api/consultancies', consultanciesRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/admin/courses', adminLimit, adminCoursesRouter);
app.use('/api/admin/users', adminLimit, adminUsersRouter);
app.use('/api/admin/formacao', adminLimit, formacaoRouter);
app.use('/api/admin/turmas', adminLimit, adminTurmasRouter);
app.use('/api/admin/ofertas', adminLimit, adminOfertasRouter);
app.use('/api/admin/home', adminLimit, adminHomeRouter);
app.use('/api/admin/stripe/products', adminLimit, adminStripeRouter);
app.use('/api/webhooks', webhookLimit, webhooksRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/applications', assetsRouter);
app.use('/api/applications', analyticsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/forms', publicFormsRouter);

app.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user_id: req.userId });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Iris Platform API', version: '1.0.0', status: 'running' });
});

// ─── Error handlers ──────────────────────────────────────────────
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
};

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ─── Admin Bootstrap ─────────────────────────────────────────────
export async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !supabaseAdmin) return;

  try {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = users.find((u) => u.email === adminEmail);
    if (!adminUser) {
      console.log(`ADMIN_EMAIL "${adminEmail}" not found — skipping bootstrap`);
      return;
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', adminUser.id)
      .maybeSingle();

    if (!existingProfile) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert({ id: adminUser.id, role: 'admin' });
      if (error) console.error('Admin bootstrap: failed to create profile', error.message);
      else console.log(`✓ Admin bootstrap: criou profile para ${adminEmail} como admin`);
    } else if (existingProfile.role !== 'admin') {
      await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', adminUser.id);
      console.log(`✓ Admin bootstrap: promoveu ${adminEmail} para admin`);
    } else {
      console.log(`✓ Admin bootstrap: ${adminEmail} já é admin`);
    }
  } catch (err) {
    console.error('Admin bootstrap error:', err);
  }
}
