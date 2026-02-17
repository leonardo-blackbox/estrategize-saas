# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Iris** is a B2B SaaS platform for business strategy consulting. The platform enables authenticated users to:
- Create and manage consulting engagements (consultorias)
- Receive AI-powered diagnostic insights via OpenAI GPT-4
- Manage a credit-based system for accessing AI features
- Purchase subscription plans and make payments via Stripe
- Track actions and access strategic tools

Reference the PRD in `docs/prd/epic-1.md` for full feature details and Epic breakdown.

## Tech Stack (Confirmed)

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (via Supabase) with Row Level Security (RLS)
- **Authentication:** Supabase Auth (JWT-based)
- **AI:** OpenAI GPT-4 API
- **Payments:** Stripe (webhooks + checkout)
- **State Management (FE):** Zustand
- **Data Fetching (FE):** React Query
- **Validation:** Zod
- **Hosting:** Vercel (frontend) + Railway (backend)

## Repository Structure

This is a monorepo with **frontend and backend as separate subdirectories**:

```
/estrategize-saas
├── frontend/          # React + Vite application
├── backend/           # Express + Node.js application
├── docs/
│   └── prd/          # Product requirements (stories, epics)
└── CLAUDE.md         # This file
```

Each has its own `package.json`, build configuration, and deployment setup.

## Key Architectural Decisions

### Database & Security
- **RLS is mandatory**: All database tables must have Row Level Security policies enabled. Users can only access their own data.
- **Migrations over raw SQL**: Use version-controlled migration files (preferably with Supabase migrations or similar).
- **Audit trails**: The database schema includes an audit function for tracking changes to sensitive tables.

### Authentication Flow
- Frontend uses Supabase Auth client with JWT tokens
- Backend validates JWTs via middleware on protected routes
- Token refresh is handled automatically via Supabase client
- Protected routes redirect unauthenticated users to login

### AI Integration (Iris Diagnostic Method)
- The "Iris method" is a strategic framework injected into AI prompts
- When a consultancy is created, an automatic diagnostic is generated
- Diagnostics are versioned and can be edited/validated by users
- Calls to OpenAI are wrapped in a service (`irisAIService.ts` or similar)

### Credit System
- Credits are reserved before operations, consumed on success, released on failure
- Transactions are idempotent (same request twice = one debit)
- All credit movements logged in `credit_transactions` table
- Stripe payments trigger credit allocation webhooks

### API Design
- REST endpoints follow RESTful conventions
- All POST/PUT/PATCH endpoints validate input with Zod schemas
- Errors return consistent JSON format with HTTP status codes
- Webhook endpoints validate signatures (especially Stripe)

## Development Commands

When the projects are initialized, expect these common commands:

**Frontend:**
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server (Vite)
npm run build                  # Production build
npm run lint                   # ESLint
npm run type-check            # TypeScript check
npm test                       # Run tests (Jest or Vitest)
npm test -- --watch           # Watch mode
```

**Backend:**
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server with nodemon
npm run build                  # Compile TypeScript
npm start                      # Run compiled server
npm test                       # Run tests
npm test -- --watch           # Watch mode
```

**Database:**
```bash
# Supabase migrations (to be configured)
npm run db:migrate             # Run pending migrations
npm run db:rollback            # Rollback last migration
```

## Epic 1 Implementation Phases

1. **Wave 1 (Foundation):** Setup, database schema, authentication
2. **Wave 2 (Core UI):** Dashboard layout, consultancy CRUD
3. **Wave 3 (AI + Credits):** Diagnosis, credit system, plans
4. **Wave 4 (Payments):** Stripe integration, checkout

See `docs/prd/epic-1.md` for detailed story breakdown and acceptance criteria.

## Environment Variables

Both frontend and backend require `.env.local` files (not committed). Key variables:

**Frontend:**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=...
```

**Backend:**
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
DATABASE_URL=...
```

## Testing Strategy

- Unit tests for utilities, services, and business logic
- Integration tests for API endpoints (mock database)
- E2E tests for critical user flows (authentication, payment)
- Aim for >80% coverage

## Key Services to Implement

### Backend
- `src/middleware/auth.ts` - JWT validation
- `src/services/irisAIService.ts` - OpenAI wrapper with Iris method
- `src/services/creditService.ts` - Reserve/consume/release logic
- `src/routes/api/` - API endpoints organized by resource
- `src/webhooks/stripe.ts` - Stripe webhook handler

### Frontend
- `src/stores/authStore.ts` - Zustand auth state
- `src/pages/Dashboard.tsx` - Main dashboard layout
- `src/pages/Consultancies.tsx` - Consultancy list/CRUD
- `src/pages/Plans.tsx` - Pricing/subscription page
- `src/hooks/useAuth.ts` - Custom hook for auth context
- `src/api/` - API client functions with React Query

## Important Notes

- **Stripe webhooks must be idempotent** — always check for duplicate events
- **RLS policies are security-critical** — thoroughly test that users cannot see each other's data
- **AI calls are expensive** — implement proper error handling and rate limiting
- **Database migrations should be reversible** — always write rollback logic
- **Protected routes should check token expiry** — redirect to login if expired

## Monitoring & Errors

- Backend errors should be logged with Sentry (to be configured)
- Frontend client-side errors also sent to Sentry
- Stripe events logged for debugging webhook issues
- All database transactions logged in audit table

## Performance Targets

- Frontend home page load: <1s
- API response time: <500ms
- Dashboard first paint: <2s
