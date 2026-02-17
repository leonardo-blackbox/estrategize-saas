# Deployment Guide

## Prerequisites

- Vercel account (frontend)
- Railway account (backend)
- Git repository connected to GitHub
- Environment variables configured

## Frontend Deployment (Vercel)

### Automatic Deployment

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Select this repository
   - Select `frontend` as root directory

2. **Configure Environment Variables:**
   - Go to Settings → Environment Variables
   - Add from `frontend/.env.example`:
     ```
     VITE_SUPABASE_URL=...
     VITE_SUPABASE_ANON_KEY=...
     VITE_API_URL=https://your-backend.railway.app
     ```

3. **Deploy:**
   - Vercel auto-deploys on push to `main`
   - Monitor at Vercel dashboard

### Manual Deployment

```bash
cd frontend
vercel deploy --prod
```

## Backend Deployment (Railway)

### Automatic Deployment

1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project" → "GitHub Repo"
   - Select this repository
   - Set root directory: `backend`

2. **Configure Environment Variables:**
   - Go to project settings
   - Add variables from `backend/.env.example`:
     ```
     PORT=3001
     NODE_ENV=production
     SUPABASE_URL=...
     SUPABASE_SERVICE_ROLE_KEY=...
     DATABASE_URL=... (Railway PostgreSQL plugin)
     OPENAI_API_KEY=...
     STRIPE_SECRET_KEY=...
     STRIPE_WEBHOOK_SECRET=...
     FRONTEND_URL=https://your-frontend.vercel.app
     ```

3. **Database Setup (Optional):**
   - Click "Create" → "Database" → "PostgreSQL"
   - Railway auto-populates `DATABASE_URL`
   - Run migrations once deployed

4. **Deploy:**
   - Railway auto-deploys on push to `main`

### Manual Deployment

```bash
npm install -g @railway/cli
railway login
railway link
railway deploy
```

## Database Migrations

After first deployment, run migrations:

```bash
# Connect to production database
railway connect

# Run migration scripts (when available)
npm run db:migrate
```

## Stripe Webhook Configuration

### Development (Local)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Start local webhook forwarding
stripe listen --forward-to localhost:3001/webhooks/stripe
```

### Production

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend.railway.app/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Monitoring

### Vercel
- Check deployments: Dashboard → Deployments
- View logs: Deployment → Functions
- Analytics: Analytics tab

### Railway
- View logs: Railway dashboard
- Metrics: Resource usage tab
- Database: Database connections

## Troubleshooting

### Frontend not loading
- Check environment variables in Vercel
- Verify `VITE_API_URL` points to correct backend
- Check browser console for CORS errors

### Backend returning 500 errors
- Check Railway logs
- Verify database connection string
- Check environment variables
- Verify API keys (OpenAI, Stripe)

### Database connection errors
- Verify `DATABASE_URL` is set
- Check database is running
- Test connection locally

## Rolling Back

### Vercel
- Deployments tab → Select previous deployment → Promote

### Railway
- Deployment tab → Select previous version → Redeploy

## Security Checklist

- [ ] `.env.local` not committed
- [ ] Production environment variables set
- [ ] Stripe webhook signature verified
- [ ] CORS configured for production domain
- [ ] Database backups enabled
- [ ] Logs monitored
- [ ] Rate limiting configured (if using Vercel Pro)
