---
phase: 03-admin-cursos
plan: 01
subsystem: database, api
tags: [postgres, supabase, stripe, courses, migration]

requires:
  - phase: 02-admin-planos-e-stripe
    provides: stripe_products table with id, name, price_cents, billing_interval

provides:
  - Migration 024 adds stripe_product_id FK (nullable) on courses table
  - GET /api/admin/courses returns stripe_product_id and joined plan data
  - GET /api/admin/courses/:id returns stripe_product_id and joined plan data
  - PUT /api/admin/courses/:id accepts stripe_product_id to link course to plan

affects: [03-admin-cursos, frontend-course-editor, entitlements]

tech-stack:
  added: []
  patterns:
    - "Supabase FK join in select string — use `stripe_products (id, name, ...)` syntax for automatic join on FK column"

key-files:
  created:
    - backend/src/database/migrations/024_course_plan_link.sql
  modified:
    - backend/src/routes/admin/courses.ts

key-decisions:
  - "1:N relationship (stripe_product has N courses): FK lives on courses side — no junction table needed"
  - "ON DELETE SET NULL: deleting a plan disassociates courses without cascading deletes"

patterns-established:
  - "Supabase FK join pattern: include related table fields directly in select string using table name"

requirements-completed: [ADMN-02]

duration: 1min
completed: 2026-03-29
---

# Phase 03 Plan 01: Admin Cursos — Course-Plan Link Summary

**Migration 024 adds nullable stripe_product_id FK on courses + backend GET/PUT endpoints expose Stripe plan association data**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-29T03:58:51Z
- **Completed:** 2026-03-29T03:59:32Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Migration 024 creates `stripe_product_id` column on `courses` (nullable FK referencing `stripe_products.id`, `ON DELETE SET NULL`) with index for reverse lookup
- `courseSchema` (Zod) now accepts `stripe_product_id: uuid | null | undefined` in POST and PUT operations
- GET `/api/admin/courses` list endpoint includes joined `stripe_products` data (id, name, price_cents, billing_interval) alongside each course
- GET `/api/admin/courses/:id` detail endpoint also includes the same `stripe_products` join

## Task Commits

1. **Task 1: Migration 024** - `a981a7c` (chore)
2. **Task 2: Backend courseSchema + GET join** - `56ea766` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `backend/src/database/migrations/024_course_plan_link.sql` - ALTER TABLE courses ADD COLUMN stripe_product_id + CREATE INDEX
- `backend/src/routes/admin/courses.ts` - courseSchema + stripe_product_id, GET list and detail include stripe_products join

## Decisions Made

- 1:N relationship with FK on `courses` side (no junction table) — one plan can cover N courses, each course has at most one plan
- `ON DELETE SET NULL` so deleting a Stripe product merely unlinks courses rather than cascading
- Used Supabase FK join syntax in select string (`stripe_products (...)`) instead of a manual JOIN — consistent with existing pattern in codebase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Apply migration 024 in Supabase Dashboard (SQL Editor) or via `supabase db push` before using the new column:

```sql
ALTER TABLE public.courses
  ADD COLUMN stripe_product_id uuid
    REFERENCES public.stripe_products(id)
    ON DELETE SET NULL;

CREATE INDEX idx_courses_stripe_product_id
  ON public.courses(stripe_product_id);
```

## Next Phase Readiness

- Backend is ready to receive `stripe_product_id` associations from the admin UI
- Frontend course editor (03-02) can now render a plan dropdown using `GET /api/admin/stripe/products` and save via `PUT /api/admin/courses/:id`

---
*Phase: 03-admin-cursos*
*Completed: 2026-03-29*
