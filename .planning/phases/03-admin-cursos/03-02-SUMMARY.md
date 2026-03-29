---
phase: 03-admin-cursos
plan: 02
subsystem: ui
tags: [react, typescript, tailwind, react-query, stripe, courses, admin]

requires:
  - phase: 03-admin-cursos
    plan: 01
    provides: stripe_product_id FK on courses + backend GET/PUT exposing plan data

provides:
  - CourseStatusTabs micro-module with 4-tab filter (Todos, Publicados, Rascunhos, Arquivados) and per-status counts
  - CourseCard shows Stripe plan badge when course has associated plan
  - CourseCreateModal has plan dropdown loading active Stripe products via useQuery
  - PlanSelect micro-module (reusable plan dropdown extracted from CourseCreateModal)
  - CoursePlanSelect micro-module for AdminCursoDetailHeader — saves via adminUpdateCourse
  - CoursePublishButton micro-module — publish (green) or unpublish (ghost) based on course.status
  - AdminCursoDetailHeader refactored as orchestrator importing CoursePlanSelect + CoursePublishButton

affects: [03-admin-cursos, frontend-course-editor, admin-ux]

tech-stack:
  added: []
  patterns:
    - "Status filter pattern: statusFilter state + computed counts object + filter before render — no server-side filtering needed for small lists"
    - "Micro-module extraction when modal exceeds 80 lines: extract select/input block to dedicated PlanSelect.tsx"
    - "Orchestrator compacts mutation declarations to single-line format when staying under 80-line limit"

key-files:
  created:
    - frontend/src/features/admin/components/AdminCursosPage/CourseStatusTabs.tsx
    - frontend/src/features/admin/components/AdminCursosPage/PlanSelect.tsx
    - frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePlanSelect.tsx
    - frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePublishButton.tsx
  modified:
    - frontend/src/features/admin/components/AdminCursosPage/AdminCursosPage.tsx
    - frontend/src/features/admin/components/AdminCursosPage/CourseCard.tsx
    - frontend/src/features/admin/components/AdminCursosPage/CourseCreateModal.tsx
    - frontend/src/features/admin/components/AdminCursosPage/index.ts
    - frontend/src/features/admin/components/AdminCursoDetailHeader/AdminCursoDetailHeader.tsx
    - frontend/src/features/admin/components/AdminCursoDetailHeader/index.ts

key-decisions:
  - "PlanSelect extracted as micro-module from CourseCreateModal (would have been 94 lines inline — over 80-line limit)"
  - "Unpublish uses adminUpdateCourse({status: draft}) not adminArchiveCourse — archive is a distinct semantic from unpublish"
  - "isMutating combines all 3 mutation pending flags in AdminCursoDetailHeader to disable controls during any in-flight request"

patterns-established:
  - "Status filter: local state + counts object + client-side filter on loaded data — avoids extra API calls for small datasets"
  - "Orchestrator micro-module extraction trigger: when file would exceed 80 lines"

requirements-completed: [ADMN-02]

duration: 7min
completed: 2026-03-29
---

# Phase 03 Plan 02: Admin Cursos — UX Improvements Summary

**CourseStatusTabs filter, plan badge in CourseCard, and CoursePlanSelect + CoursePublishButton micro-modules in AdminCursoDetailHeader**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-29T04:03:00Z
- **Completed:** 2026-03-29T04:05:35Z
- **Tasks:** 2
- **Files modified:** 10 (6 created, 4 modified)

## Accomplishments

- CourseStatusTabs micro-module with 4 tabs (Todos, Publicados, Rascunhos, Arquivados) + live counts — renders above the course list
- CourseCard shows a "Plano: {name}" badge when course has an associated Stripe product
- CourseCreateModal loads active Stripe products via useQuery and renders a plan dropdown (PlanSelect micro-module)
- AdminCursoDetailHeader refactored into orchestrator: mounts CoursePlanSelect + CoursePublishButton, handles mutations to link plan and toggle publish state

## Task Commits

1. **Task 1: CourseStatusTabs + status filter + plan badge** - `dcd6257` (feat)
2. **Task 2: plan dropdown in CourseCreateModal + CoursePlanSelect + CoursePublishButton** - `764a845` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `frontend/src/features/admin/components/AdminCursosPage/CourseStatusTabs.tsx` - 4-tab status filter with counts (36 lines)
- `frontend/src/features/admin/components/AdminCursosPage/PlanSelect.tsx` - Reusable plan dropdown micro-module (32 lines)
- `frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePlanSelect.tsx` - Plan dropdown for course detail header (32 lines)
- `frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePublishButton.tsx` - Publish/unpublish toggle button (34 lines)
- `frontend/src/features/admin/components/AdminCursosPage/AdminCursosPage.tsx` - Added statusFilter state + CourseStatusTabs (166 lines)
- `frontend/src/features/admin/components/AdminCursosPage/CourseCard.tsx` - Added stripe_products badge + improved action buttons (54 lines)
- `frontend/src/features/admin/components/AdminCursosPage/CourseCreateModal.tsx` - Added PlanSelect + useQuery for products (76 lines)
- `frontend/src/features/admin/components/AdminCursoDetailHeader/AdminCursoDetailHeader.tsx` - Orchestrator with CoursePlanSelect + CoursePublishButton (62 lines)
- `frontend/src/features/admin/components/AdminCursosPage/index.ts` - Added CourseStatusTabs export
- `frontend/src/features/admin/components/AdminCursoDetailHeader/index.ts` - Added CoursePlanSelect + CoursePublishButton exports

## Decisions Made

- **PlanSelect extracted as micro-module** from CourseCreateModal — inline version was 94 lines (over 80 limit). Extraction keeps modal at 76 lines.
- **Unpublish = set draft, not archive** — `adminUpdateCourse({ status: 'draft' })` is semantically correct. `adminArchiveCourse` means "archive" (a distinct permanent action). CoursePublishButton's `onUnpublish` sets draft.
- **isMutating combines all 3 mutation flags** in AdminCursoDetailHeader so all controls (CoursePlanSelect + CoursePublishButton) are disabled during any in-flight mutation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Line limit] Extracted PlanSelect micro-module from CourseCreateModal**
- **Found during:** Task 2 (CourseCreateModal update)
- **Issue:** Inline plan dropdown caused CourseCreateModal to reach 94 lines (over 80-line limit). Plan explicitly states to extract if over 80.
- **Fix:** Created `PlanSelect.tsx` micro-module (32 lines), CourseCreateModal imports and renders it — now 76 lines.
- **Files modified:** `CourseCreateModal.tsx`, `PlanSelect.tsx` (created)
- **Committed in:** `764a845` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 line-limit extraction, per plan instructions)
**Impact on plan:** Fully aligned — plan explicitly anticipated this extraction.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin course list now has full status filtering and plan association visible at a glance
- AdminCursoDetailHeader supports plan linking and publish toggling — ready for end-to-end testing
- Phase 03-03 (if planned) can build on these components

## Self-Check: PASSED

- `frontend/src/features/admin/components/AdminCursosPage/CourseStatusTabs.tsx` — FOUND
- `frontend/src/features/admin/components/AdminCursosPage/PlanSelect.tsx` — FOUND
- `frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePlanSelect.tsx` — FOUND
- `frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePublishButton.tsx` — FOUND
- Commit `dcd6257` — FOUND
- Commit `764a845` — FOUND

---
*Phase: 03-admin-cursos*
*Completed: 2026-03-29*
