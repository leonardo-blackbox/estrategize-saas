# Story 1.8 — Consultancy Diagnosis (IA Iris) — Verification Guide

**Status:** ✅ Implementation Complete
**Commit:** `06c7be9`
**Date:** 2026-02-19

---

## ✅ Acceptance Criteria — All Met

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Service wrapper for OpenAI | ✅ | `backend/src/services/irisAIService.ts` |
| Iris method injected into prompt | ✅ | `IRIS_METHOD_PROMPT` in irisAIService.ts |
| POST endpoint to trigger diagnosis | ✅ | `POST /api/consultancies/:id/diagnose` |
| Save to `consultancy_diagnostics` table | ✅ | Migration 003 + diagnosisService.ts |
| Frontend display of diagnosis | ✅ | DiagnosisDisplay.tsx component |
| Edit/validate capability | ✅ | DiagnosisEditor.tsx + update endpoint |
| Version control for diagnostics | ✅ | `version` column, history endpoint |

---

## Files Created/Modified

### Backend
```
backend/src/database/migrations/003_consultancy_diagnostics.sql
  → Creates consultancy_diagnostics table with RLS

backend/src/services/irisAIService.ts
  → OpenAI wrapper with Iris method framework

backend/src/services/diagnosisService.ts
  → CRUD service for diagnoses (create, get, update, history)

backend/src/routes/consultancies.ts
  → Added 4 diagnosis endpoints:
    - POST   /:id/diagnose         (generate)
    - GET    /:id/diagnose         (fetch latest)
    - PUT    /:id/diagnose         (update/new version)
    - GET    /:id/diagnose/history (version history)
```

### Frontend
```
frontend/src/api/diagnoses.ts
  → API client functions (generate, get, update, history)

frontend/src/components/diagnosis/DiagnosisDisplay.tsx
  → Read-only diagnosis view with sections & insights

frontend/src/components/diagnosis/DiagnosisEditor.tsx
  → Edit modal for executive summary

frontend/src/components/diagnosis/DiagnosisModal.tsx
  → Main modal with display, edit, & history tabs

frontend/src/pages/ConsultanciesPage.tsx
  → Integrated diagnosis modal & handlers

frontend/src/components/consultancies/ConsultancyCard.tsx
  → Added "Diagnose" button
```

### Documentation
```
docs/api.md
  → Added diagnosis endpoints with curl examples

STORY_1_8_VERIFICATION.md
  → This file
```

---

## How to Test Locally

### Prerequisites
1. **Backend running:**
   ```bash
   cd backend
   npm run dev
   # Listens on http://localhost:3001
   ```

2. **Frontend running:**
   ```bash
   cd frontend
   npm run dev
   # Listens on http://localhost:5173
   ```

3. **Supabase migration applied:**
   - Migration `003_consultancy_diagnostics.sql` must be applied to Supabase
   - See: `backend/src/database/migrations/003_consultancy_diagnostics.sql`
   - Run via SQL Editor or Supabase CLI

4. **Environment variables:**
   - Backend `.env.local` must have `OPENAI_API_KEY` set
   - Frontend `.env.local` must have `VITE_API_URL=http://localhost:3001`

---

## Testing Workflow

### Step 1: Authenticate
```bash
# Signup/Login in frontend at http://localhost:5173
# Get your JWT token from browser console:
console.log(JSON.parse(localStorage.getItem('sb-auth-token')).access_token)
# Copy the token for curl testing
```

### Step 2: Create a Consultancy
```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3001/api/consultancies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Digital Transformation Strategy", "client_name": "TechCorp Inc"}'

# Response:
# {
#   "data": {
#     "id": "12345-uuid",
#     "user_id": "your-user-id",
#     "title": "Digital Transformation Strategy",
#     "client_name": "TechCorp Inc",
#     "status": "active",
#     "created_at": "2026-02-19T22:00:00Z",
#     ...
#   }
# }
```

### Step 3: Generate Diagnosis
```bash
CONSULTANCY_ID="12345-uuid"

curl -X POST http://localhost:3001/api/consultancies/$CONSULTANCY_ID/diagnose \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Response (201 Created):
# {
#   "data": {
#     "id": "diagnosis-uuid",
#     "consultancy_id": "12345-uuid",
#     "version": 1,
#     "is_edited": false,
#     "content": {
#       "executiveSummary": "...",
#       "sections": [
#         {
#           "name": "Internal Assessment",
#           "insights": [...]
#         },
#         ...
#       ]
#     },
#     "tokens_used": 1200,
#     "created_at": "2026-02-19T22:05:00Z",
#     ...
#   }
# }

# Expect: Wait 30-60 seconds for OpenAI API call
```

### Step 4: Fetch Latest Diagnosis
```bash
curl http://localhost:3001/api/consultancies/$CONSULTANCY_ID/diagnose \
  -H "Authorization: Bearer $TOKEN"

# Response (200 OK):
# {
#   "data": { ... diagnosis from step 3 ... }
# }
```

### Step 5: Update Diagnosis (Create New Version)
```bash
curl -X PUT http://localhost:3001/api/consultancies/$CONSULTANCY_ID/diagnose \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "executiveSummary": "Updated executive summary based on stakeholder feedback...",
      "sections": [
        {
          "name": "Internal Assessment",
          "insights": [...]
        },
        ...
      ]
    }
  }'

# Response (200 OK):
# {
#   "data": {
#     ...
#     "version": 2,
#     "is_edited": true,
#     "edited_at": "2026-02-19T22:10:00Z",
#     "tokens_used": null,  // Manual edit, no tokens
#     ...
#   }
# }
```

### Step 6: View Version History
```bash
curl http://localhost:3001/api/consultancies/$CONSULTANCY_ID/diagnose/history \
  -H "Authorization: Bearer $TOKEN"

# Response (200 OK):
# {
#   "data": [
#     { version: 2, is_edited: true, edited_at: "...", ... },
#     { version: 1, is_edited: false, edited_at: null, ... }
#   ]
# }
```

### Step 7: Test in Frontend UI
1. Navigate to **Consultancies** page
2. Click **Diagnose** button on a consultancy card
3. Dialog opens: "No diagnosis found" → Click **Generate Diagnosis**
4. Wait for loading spinner (30-60 seconds)
5. Diagnosis modal displays with:
   - Executive Summary
   - Sections (Internal Assessment, Market Reality, Key Insights, Recommendations)
   - Each section with bullet-pointed insights
6. Click **Edit** → Update executive summary → **Save Changes** → New version created
7. Click **History** → View all versions with timestamps

---

## Security Verification

### API Security
- ✅ OpenAI API key NOT in any frontend files
- ✅ All routes require `requireAuth` middleware
- ✅ JWT validation on every request
- ✅ Zod schema validation for request payloads
- ✅ Error messages do NOT leak secrets

### Database Security
- ✅ RLS enabled on `consultancy_diagnostics` table
- ✅ `consultancies_select_own` policy: users see only their own
- ✅ `consultancies_insert_own` policy: users can only create with their user_id
- ✅ `consultancies_update_own` policy: users can only update their own
- ✅ No DELETE policy: soft delete only (via frontend logic)

### Data Isolation
- ✅ Diagnosis queries filter by `user_id`
- ✅ Cannot see other users' diagnoses (RLS enforced)
- ✅ Token counts logged (useful for cost tracking)

---

## Performance Notes

### OpenAI API
- **Model:** `gpt-4` (consistent with PRD)
- **Timeout:** Requests may take 30-60 seconds
- **Cost:** ~1-2k tokens per diagnosis (~$0.03-0.06 per diagnosis at current rates)
- **Retry Logic:** None (for now) — handle gracefully in UI

### Database
- **Indexes:** `user_id`, `consultancy_id`, `created_at` for fast queries
- **Storage:** One row per version (no update mutations, append-only)
- **RLS:** Single `auth.uid() = user_id` check per operation

---

## Known Limitations & TODOs

### Deferred to Future Stories
1. **Credit System (Story 1.9):**
   - Currently no credit deduction for diagnosis generation
   - Should be integrated when credit system is built
   - Recommendation: Add `pre_check_credits()` call before OpenAI

2. **Automatic Diagnosis on Create:**
   - PRD says "diagnóstico automático via IA quando consultoria criada"
   - Current: Manual trigger via button (safer for cost control)
   - Future: Auto-trigger on consultancy creation if credits available

3. **UI Polish (Antigravity):**
   - Basic Tailwind styling applied (consistent with existing theme)
   - Future visual improvements deferred to design system work
   - Diagnosis layout: stacked sections (mobile-friendly)

### Technical Debt
1. **Error Handling:**
   - Generic OpenAI errors shown to user (could be more helpful)
   - Recommendation: Add specific error codes from OpenAI

2. **Loading States:**
   - Simple spinner text ("Generating strategic diagnosis...")
   - Future: More detailed progress feedback

3. **Versioning:**
   - New version created on ANY update (even if content identical)
   - Recommendation: Content hash comparison before version bump

---

## Database Schema

### `consultancy_diagnostics` Table

```sql
CREATE TABLE public.consultancy_diagnostics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (FK auth.users),
  consultancy_id UUID NOT NULL (FK consultancies),
  content JSONB NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_consultancy_version UNIQUE (consultancy_id, version)
);

-- Indexes
CREATE INDEX idx_consultancy_diagnostics_user_id ON consultancy_diagnostics(user_id);
CREATE INDEX idx_consultancy_diagnostics_consultancy_id ON consultancy_diagnostics(consultancy_id);
CREATE INDEX idx_consultancy_diagnostics_created_at ON consultancy_diagnostics(created_at);

-- RLS Policies
SELECT: auth.uid() = user_id
INSERT: auth.uid() = user_id
UPDATE: auth.uid() = user_id
DELETE: (no policy — soft delete only)
```

---

## Migration Application

If migration **003_consultancy_diagnostics.sql** is NOT yet applied:

### Via Supabase SQL Editor (Easy)
1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `backend/src/database/migrations/003_consultancy_diagnostics.sql`
3. Click **Execute**
4. Verify: Table appears in Schema, RLS policies visible

### Via Supabase CLI (Advanced)
```bash
cd backend
supabase link --project-ref zihtyuwqfrkzzcmhstbd
supabase db push
# Applies any new migrations
```

---

## Next Steps (Story 1.9+)

1. **Story 1.9 — Credit System:**
   - Integrate credit pre-check before OpenAI calls
   - Deduct credits on successful diagnosis

2. **Story 1.10 — Plans:**
   - Link diagnosis capability to subscription tier
   - Limit diagnoses per plan

3. **Future Enhancements:**
   - Auto-trigger diagnosis on consultancy creation
   - Support additional AI models (Claude, etc)
   - Batch diagnosis generation
   - Export diagnosis as PDF/Word

---

## Checklist — Ready for QA Review

- ✅ All 7 acceptance criteria met
- ✅ Backend type-check: PASS
- ✅ Backend build: PASS
- ✅ Frontend type-check: PASS
- ✅ Frontend build: PASS
- ✅ API documentation updated
- ✅ Security verified (no secrets exposed, RLS enforced)
- ✅ Testing guide complete
- ✅ Commit message detailed

**Status:** Ready for @qa review and testing

---

**Implemented by:** @dev (Dex)
**Story:** 1.8 — Consultancy Diagnosis (IA Iris)
**Epic:** 1 — Foundation & MVP Core
**Date:** 2026-02-19
