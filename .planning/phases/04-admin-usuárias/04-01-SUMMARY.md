---
phase: 04-admin-usuárias
plan: "01"
subsystem: admin
tags: [admin, users, filtering, ui]
dependency_graph:
  requires: []
  provides: [admin-user-filter-plan, admin-user-filter-status, admin-user-search]
  affects: [AdminUsuariosPage, GET /api/admin/users]
tech_stack:
  added: []
  patterns: [micro-module decomposition, intersect filter pattern]
key_files:
  created:
    - frontend/src/features/admin/components/AdminUsuariosPage/UserFilters.tsx
    - frontend/src/features/admin/components/AdminUsuariosPage/UserRow.tsx
  modified:
    - backend/src/routes/admin/users.ts
    - frontend/src/api/courses.ts
    - frontend/src/features/admin/services/admin.api.ts
    - frontend/src/features/admin/components/AdminUsuariosPage/AdminUsuariosPage.tsx
decisions:
  - intersect() helper function used for sequential AND-logic filter composition (avoids type narrowing issues with null union)
  - plan-badge shows plan name in emerald; no-plan badge uses bg-hover/tertiary tokens for dark-mode compatibility
  - adminGetPlansSummary dedicated endpoint rather than reusing adminListCourses — avoids shape coupling
metrics:
  duration: 10
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_modified: 6
---

# Phase 04 Plan 01: Admin User List Filters Summary

**One-liner:** Plan/status filter dropdowns with AND-logic search for admin user list, backed by new backend filter params and micro-module decomposition.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Backend — add plan_id and status filters | d9541ba | backend/src/routes/admin/users.ts |
| 2 | Frontend — filter UI + decompose AdminUsuariosPage | 608edf5 | UserFilters.tsx, UserRow.tsx, AdminUsuariosPage.tsx, courses.ts |

## What Was Built

### Backend (Task 1)
- `GET /api/admin/users` now accepts `plan_id` and `status` (`active` | `no_plan` | `suspended`) as optional query params
- Filters use AND logic via sequential intersection against subscription and user_entitlements tables
- Each user in the response now includes a `subscription` field (plan name + status) for the frontend badge
- New `GET /api/admin/users/plans-summary` endpoint returns `[{id, name}]` for dropdown population

### Frontend (Task 2)
- `UserFilters` micro-module (68 lines): search input + plan dropdown + status dropdown in a flex-wrap row
- `UserRow` micro-module (59 lines): user button with plan badge (emerald if active, muted if none) + admin badge
- `AdminUsuariosPage` aggregator rewritten (125 lines): uses both micro-modules, includes planId/status state with page reset on filter change, fetches plans summary via React Query
- `adminGetUsers` API updated with `plan_id` and `status` params
- `adminGetPlansSummary` added to `courses.ts` and re-exported from `admin.api.ts`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type narrowing on filterUserIds**
- **Found during:** Task 1 backend implementation
- **Issue:** `filterUserIds` typed as `string[] | null` caused `Array.filter` to resolve to `never` type when narrowed inline
- **Fix:** Extracted `intersect(current, incoming)` helper function with explicit `string` parameter type
- **Files modified:** backend/src/routes/admin/users.ts
- **Commit:** d9541ba

## Self-Check: PASSED

Files created:
- frontend/src/features/admin/components/AdminUsuariosPage/UserFilters.tsx — EXISTS
- frontend/src/features/admin/components/AdminUsuariosPage/UserRow.tsx — EXISTS

Commits:
- d9541ba (backend filters) — EXISTS
- 608edf5 (frontend filters) — EXISTS

TypeScript: both frontend and backend compile with zero errors.
