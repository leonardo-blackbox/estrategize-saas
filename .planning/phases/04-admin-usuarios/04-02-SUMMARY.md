---
phase: 04-admin-usuárias
plan: "02"
subsystem: frontend/admin
tags: [micro-modules, entitlements, ux, admin]
dependency_graph:
  requires: []
  provides:
    - Grant entitlement modal with course dropdown
    - EntitlementRow micro-module
    - EnrollmentRow micro-module
  affects:
    - AdminUserDetailTabCourses aggregator
tech_stack:
  added: []
  patterns:
    - 3-layer componentization (page / aggregator / micro-module)
    - useMutation + useQuery delegation from aggregator
    - Course dropdown populated via adminListCourses query
key_files:
  created:
    - frontend/src/features/admin/components/AdminUserDetailTabCourses/GrantEntitlementModal.tsx
    - frontend/src/features/admin/components/AdminUserDetailTabCourses/EntitlementRow.tsx
    - frontend/src/features/admin/components/AdminUserDetailTabCourses/EnrollmentRow.tsx
  modified:
    - frontend/src/features/admin/components/AdminUserDetailTabCourses/AdminUserDetailTabCourses.tsx
    - frontend/src/features/admin/components/AdminUserDetailTabCourses/index.ts
decisions:
  - AdminUserDetailTabCourses uses adminListCourses query to populate dropdown; shares admin-courses queryKey with other admin pages for cache reuse
  - Array.isArray check on coursesData (not .courses property) — consistent with AdminFormacaoPage pattern
metrics:
  duration_minutes: 5
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_modified: 5
---

# Phase 04 Plan 02: Entitlement Management UX — Course Dropdown Summary

**One-liner:** Replaced UUID text input with course dropdown in grant entitlement modal; decomposed courses tab into 3 micro-modules (GrantEntitlementModal, EntitlementRow, EnrollmentRow) respecting 80-line limit.

## What Was Built

Admin can now grant course entitlements by selecting from a dropdown of published courses instead of pasting UUIDs. The courses tab was decomposed into properly-bounded micro-modules following the 3-layer architecture.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Extract GrantEntitlementModal with course dropdown | efca8bb | GrantEntitlementModal.tsx (72 lines), index.ts |
| 2 | Extract EntitlementRow + EnrollmentRow, refactor aggregator | 140d424 | EntitlementRow.tsx (47 lines), EnrollmentRow.tsx (42 lines), AdminUserDetailTabCourses.tsx (109 lines) |

## Architecture Decisions

- **adminListCourses for dropdown data:** Aggregator fetches courses via `useQuery(['admin-courses'], adminListCourses)`. The same queryKey is used by AdminHomeManageCoursesModal, so cached data is reused when available.
- **Array.isArray pattern:** `adminListCourses` returns an array directly (confirmed by AdminFormacaoPage usage). Used `Array.isArray(coursesData) ? coursesData : []` guard.
- **GrantEntitlementModal resets form on close:** `handleClose` resets to `defaultForm` before calling `onClose` to avoid stale values on re-open.

## Component Line Counts (All Within Limits)

| Component | Lines | Limit |
|-----------|-------|-------|
| GrantEntitlementModal | 72 | 80 |
| EntitlementRow | 47 | 80 |
| EnrollmentRow | 42 | 80 |
| AdminUserDetailTabCourses (aggregator) | 109 | 200 |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All created files confirmed present on disk. Both commits verified in git log.
