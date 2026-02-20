# Iris Platform

Business strategy consulting platform with AI-powered diagnostics, credit system, and subscription management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- npm or yarn
- Git

### Local Development Setup

1. **Clone and install dependencies:**

```bash
# Frontend
cd frontend
npm install

# Backend (in new terminal)
cd backend
npm install
```

2. **Configure environment variables:**

```bash
# Frontend: Create .env.local
cd frontend
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Backend: Create .env.local
cd backend
cp .env.example .env.local
# Edit .env.local with your API keys and database URL
```

3. **Start both services:**

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
# Open http://localhost:5173

# Terminal 2 - Backend
cd backend
npm run dev
# Server runs on http://localhost:3001
```

## 📁 Project Structure

```
estrategize-saas/
├── frontend/          # React + Vite application
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/           # Express + Node.js API
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── docs/              # Documentation
│   └── prd/           # Product requirements (PRD)
└── .github/
    └── workflows/     # CI/CD pipelines
```

## 🤖 AIOS Commands & Agents

Use Claude Code with AIOS agents for development:

```bash
@dev              # Implement code (use *develop {story-id})
@qa               # QA & testing
@po               # Product owner (create stories)
@sm               # Scrum master (sprint planning)
@architect        # Architecture design
@devops           # DevOps (git push, CI/CD - EXCLUSIVE)
```

**Quick Start:**
```
@dev
*develop story-1.8
```

📖 **Full Reference:** [.claude/AIOS_COMMANDS.md](./.claude/AIOS_COMMANDS.md)

⚡ **Quick Card:** [.claude/QUICK_COMMANDS.txt](./.claude/QUICK_COMMANDS.txt)

---

## 🛠️ Available Commands

### Frontend

```bash
npm run dev           # Start dev server (Vite)
npm run build         # Production build
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking
npm run preview       # Preview production build
```

### Backend

```bash
npm run dev           # Start dev server with auto-reload
npm run build         # Compile TypeScript to dist/
npm run start         # Run compiled server (production)
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Supabase) + RLS |
| Auth | Supabase Auth (JWT) |
| AI | OpenAI GPT-4 |
| Payments | Stripe |
| State | Zustand + React Query |
| Validation | Zod |

## 📚 Documentation

- **[PRD (Product Requirements)](./docs/prd/epic-1.md)** - Complete feature specifications and story breakdown
- **[CLAUDE.md](./CLAUDE.md)** - Architecture and development guidance
- **[AIOS Commands Reference](./.claude/AIOS_COMMANDS.md)** - Agents and commands guide
- **[AIOS Quick Commands](./.claude/QUICK_COMMANDS.txt)** - Quick reference card
- **[Frontend README](./frontend/README.md)** - Frontend-specific setup
- **[Backend README](./backend/)** - Backend-specific setup (coming soon)

## 🔑 Environment Variables

### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### Backend (.env.local)
```
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@localhost:5432/iris
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

## 🚀 Deployment

### Frontend (Vercel)

```bash
# Push to main branch - Vercel auto-deploys
# Or manually deploy:
vercel deploy
```

**Configure in Vercel:**
- Build Command: `npm run build`
- Start Command: `npm run preview`
- Root Directory: `frontend`

### Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link
railway deploy
```

**Configure in Railway:**
- Build Command: `npm run build`
- Start Command: `npm start`
- Root Directory: `backend`
- Add env vars from `.env.local`

## 🧪 Testing

Tests will be configured in Story 1.1. For now:

- Frontend: Vitest (to be configured)
- Backend: Jest (to be configured)

## 📋 Epic 1: Foundation Phase

Current implementation covers:
- ✅ Project setup (frontend, backend, CI/CD)
- ⏳ Database schema & RLS (Story 1.2)
- ⏳ Authentication (Story 1.3)
- ⏳ Dashboard & UI (Stories 1.4-1.5)
- ⏳ Consultancy CRUD (Stories 1.6-1.8)
- ⏳ Credit system (Stories 1.9-1.10)
- ⏳ Payments integration (Stories 1.11-1.12)

See [PRD Epic 1](./docs/prd/epic-1.md) for full details.

## 🔐 Security Notes

- Never commit `.env` or `.env.local` files
- Use `.env.example` as a template with dummy values
- All database queries use RLS policies (users can only see their data)
- Stripe webhooks validated with signature verification

## 📞 Support

For issues or questions:
1. Check the PRD and CLAUDE.md first
2. Review the frontend/backend README files
3. Open an issue with details

## 📄 License

ISC
