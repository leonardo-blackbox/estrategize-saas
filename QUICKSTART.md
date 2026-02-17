# Quick Start Guide

Get the Iris platform running locally in 5 minutes.

## 1. Clone and Install

```bash
git clone <repository>
cd estrategize-saas

# Install dependencies
cd frontend && npm install
cd ../backend && npm install
cd ..
```

## 2. Setup Environment Variables

### Frontend (.env.local)
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local - use dummy values for now:
# VITE_SUPABASE_URL=http://localhost:3001
# VITE_SUPABASE_ANON_KEY=test-key
# VITE_API_URL=http://localhost:3001
```

### Backend (.env.local)
```bash
cd backend
cp .env.example .env.local
# Edit .env.local - use dummy values for now:
# PORT=3001
# NODE_ENV=development
# DATABASE_URL=postgresql://test:test@localhost:5432/iris (or sqlite for testing)
# SUPABASE_URL=http://localhost:3001
# SUPABASE_SERVICE_ROLE_KEY=test-key
# OPENAI_API_KEY=sk-test (add later)
# STRIPE_SECRET_KEY=sk_test_ (add later)
# STRIPE_WEBHOOK_SECRET=whsec_ (add later)
# FRONTEND_URL=http://localhost:5173
```

## 3. Start the Services

### Terminal 1: Frontend
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
# Server running on http://localhost:3001
```

## 4. Verify Everything Works

- Frontend loads at `http://localhost:5173` with "Iris Platform" heading
- Backend responds at `http://localhost:3001` with JSON response
- Check browser console for errors
- No CORS errors should appear

## 5. Next Steps

1. **Build & Test:**
   ```bash
   cd frontend && npm run build && npm run type-check
   cd ../backend && npm run build && npm run type-check
   ```

2. **Lint & Format:**
   ```bash
   cd frontend && npm run lint
   cd ../backend && npm run lint
   ```

3. **Configure External Services (later):**
   - Create Supabase project
   - Create OpenAI API key
   - Create Stripe account
   - Update .env.local with real credentials

## Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Create production build |
| `npm run lint` | Check code quality |
| `npm run type-check` | Check TypeScript types |
| `npm run preview` | Preview production build |

## Troubleshooting

**Frontend won't start:**
- Clear `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 18+)

**Backend won't start:**
- Check port 3001 is not in use: `lsof -i :3001`
- Verify .env.local exists
- Check Node.js version

**CORS errors:**
- Ensure backend CORS is configured for `http://localhost:5173`
- Check browser console for exact error

## Documentation

- [Main README](./README.md) - Full documentation
- [CLAUDE.md](./CLAUDE.md) - Architecture guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [PRD](./docs/prd/epic-1.md) - Product specifications

## Questions?

Check the docs above or open an issue on GitHub.
