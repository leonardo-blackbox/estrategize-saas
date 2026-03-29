---
phase: 06-pagina-de-planos
plan: "01"
subsystem: plans-data-layer
tags: [backend, frontend, api, react-query, stripe, public-endpoint]
dependency_graph:
  requires: []
  provides: [public-GET-api-plans, listPublicPlans, usePlans-hook]
  affects: [06-02-plans-page-ui]
tech_stack:
  added: []
  patterns: [public-rest-endpoint, react-query-usequery, api-client-pattern]
key_files:
  created:
    - backend/src/routes/public/plans.ts
    - frontend/src/api/plans.ts
    - frontend/src/features/planos/hooks/usePlans.ts
  modified:
    - backend/src/app.ts
decisions:
  - "PublicPlan interface omits stripe_product_id, stripe_price_id, status and timestamps — only client-facing fields exposed"
  - "Plans router mounted with general rate limiter only (no auth, no admin limit) — public GET is read-only and lightweight"
  - "usePlans select callback unwraps res.data to return PublicPlan[] directly — consumers get flat array without wrapper"
metrics:
  duration: "1 min"
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 4
---

# Phase 06 Plan 01: Public Plans Data Layer Summary

**One-liner:** Public GET /api/plans endpoint returning active stripe_products, typed PublicPlan API client, and React Query hook with 5-minute stale time.

## What Was Built

The data pipeline for the plans page: a backend route that returns active plans without authentication, a typed frontend API client function, and a React Query hook that makes plan data available to UI components.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Public plans backend endpoint | `ad450cc` | `backend/src/routes/public/plans.ts`, `backend/src/app.ts` |
| 2 | Frontend API client and React Query hook | `7cd51b6` | `frontend/src/api/plans.ts`, `frontend/src/features/planos/hooks/usePlans.ts` |

## Decisions Made

1. **PublicPlan omits Stripe internal IDs** — `stripe_product_id` and `stripe_price_id` are internal identifiers not needed by the public UI. The select query in the backend explicitly excludes them, and the frontend `PublicPlan` interface does not declare them.

2. **General rate limiter only** — The plans route is a lightweight public GET with no side effects. Using the existing `generalLimit` (300 req/15min) from `app.ts` is sufficient. No dedicated limiter was added.

3. **usePlans select unwraps data** — The `select` callback in `useQuery` transforms `{ data: PublicPlan[] }` to `PublicPlan[]`, so consumers of `usePlans()` receive a flat array directly from `hook.data`.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `cd backend && npx tsc --noEmit` — PASSED
- `cd frontend && npx tsc --noEmit` — PASSED
- `grep requireAuth backend/src/routes/public/plans.ts` — returns nothing (no auth)
- `grep "app.use.*api/plans" backend/src/app.ts` — returns mount line

## Self-Check: PASSED

Files exist:
- `backend/src/routes/public/plans.ts` — FOUND
- `frontend/src/api/plans.ts` — FOUND
- `frontend/src/features/planos/hooks/usePlans.ts` — FOUND
- `backend/src/app.ts` (modified) — FOUND

Commits exist:
- `ad450cc` — FOUND
- `7cd51b6` — FOUND
