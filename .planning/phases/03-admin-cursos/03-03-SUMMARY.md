---
phase: 03-admin-cursos
plan: 03
subsystem: database, api, frontend
tags: [postgres, lessons, publish, admin, micro-module]

requires:
  - phase: 03-admin-cursos
    plan: 01
    provides: courses table with modules/lessons structure

provides:
  - Migration 025 adds status column (draft/published) on lessons table
  - POST /api/admin/courses/lessons/:id/publish endpoint
  - POST /api/admin/courses/lessons/:id/unpublish endpoint
  - LessonPublishButton micro-module with visual draft/published indicator
  - Admin course detail renders publish toggle per lesson with 1-click action

affects: [admin-curso-detail, lesson-status, frontend-course-editor]

tech-stack:
  added: []
  patterns:
    - "Publish/unpublish as dedicated POST endpoints (not PATCH with status field) — matches existing course publish pattern"
    - "Status threaded via props through 3-layer hierarchy: aggregator -> modules -> lessons component -> micro-module"

key-files:
  created:
    - backend/src/database/migrations/025_lesson_status.sql
    - frontend/src/features/admin/components/AdminCursoDetailLessons/LessonPublishButton.tsx
  modified:
    - backend/src/routes/admin/courses.ts
    - frontend/src/api/courses.ts
    - frontend/src/features/admin/components/AdminCursoDetailLessons/AdminCursoDetailLessons.tsx
    - frontend/src/features/admin/components/AdminCursoDetailLessons/index.ts
    - frontend/src/features/admin/components/AdminCursoDetailModules/AdminCursoDetailModules.tsx
    - frontend/src/features/admin/hooks/useAdminCursoDetail.ts
    - frontend/src/features/admin/services/admin.api.ts

key-decisions:
  - "status column defaults to draft — existing lessons remain unpublished until admin explicitly publishes"
  - "Dedicated publish/unpublish POST endpoints (not PATCH) — consistent with existing course publish/archive pattern"
  - "isPublishLessonPending shared across all lesson buttons — avoids per-lesson pending state complexity"

duration: ~3min
completed: 2026-03-29
---

# Phase 03 Plan 03: Lesson Publish/Unpublish Summary

**Migration 025 adds draft/published status to lessons + backend endpoints + LessonPublishButton micro-module in admin course detail**

## Performance

- **Duration:** ~3 min
- **Completed:** 2026-03-29
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Migration 025 adds `status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'))` to `lessons` table. All existing lessons default to draft.
- `lessonSchema` (Zod) now accepts `status: z.enum(['draft', 'published']).optional()` — PUT /lessons/:id can also update status directly.
- Two new endpoints added to admin courses router: `POST /lessons/:id/publish` and `POST /lessons/:id/unpublish`. Both return the updated lesson row.
- `adminPublishLesson(id)` and `adminUnpublishLesson(id)` added to `frontend/src/api/courses.ts` and re-exported via `admin.api.ts`.
- `LessonPublishButton.tsx` created as a 29-line micro-module: green circle + "Pub" when published, grey circle + "Draft" when draft. Click toggles status. Disabled while pending.
- `AdminCursoDetailLessons.tsx` updated to render `LessonPublishButton` per lesson (between position number and title). New props: `onPublishLesson`, `onUnpublishLesson`, `isPublishLessonPending`. Still 65 lines (limit: 80).
- Props threaded through `AdminCursoDetailModules` (intermediary) to reach `AdminCursoDetailLessons`.
- Two mutations (`publishLessonMutation`, `unpublishLessonMutation`) added to `useAdminCursoDetail` hook. Both invalidate `['admin-course', id]` on success.
- `AdminCursoDetailPage` aggregator wires mutations to the props chain.

## Task Commits

1. **Task 1: Migration 025 + endpoints** - `6d649ae` (feat)
2. **Task 2: Frontend publish button** - `ee5fb41` (feat)

## Files Created/Modified

- `backend/src/database/migrations/025_lesson_status.sql` — ALTER TABLE lessons ADD COLUMN status
- `backend/src/routes/admin/courses.ts` — lessonSchema status field + POST publish/unpublish endpoints
- `frontend/src/api/courses.ts` — adminPublishLesson + adminUnpublishLesson
- `frontend/src/features/admin/services/admin.api.ts` — re-export new lesson publish functions
- `frontend/src/features/admin/components/AdminCursoDetailLessons/LessonPublishButton.tsx` — new micro-module (29 lines)
- `frontend/src/features/admin/components/AdminCursoDetailLessons/AdminCursoDetailLessons.tsx` — renders LessonPublishButton (65 lines)
- `frontend/src/features/admin/components/AdminCursoDetailLessons/index.ts` — exports LessonPublishButton
- `frontend/src/features/admin/components/AdminCursoDetailModules/AdminCursoDetailModules.tsx` — threads publish props
- `frontend/src/features/admin/hooks/useAdminCursoDetail.ts` — publish/unpublish mutations

## Decisions Made

- Default `draft` for all new and existing lessons — admin publishes manually, zero risk of accidental exposure
- Dedicated POST endpoints match existing course publish/archive pattern — no PATCH with status body needed
- `isPublishLessonPending` shared flag — either mutation's pending state disables all lesson publish buttons while a request is in flight, simpler than per-lesson state

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

**Pre-existing out-of-scope:** `useAdminCursoDetail.ts` was already 168 lines (over the 120-line hook limit) before this plan. My additions brought it to 181 lines. Logged to deferred-items — refactoring hook size is out of scope for this plan.

## User Setup Required

Apply migration 025 in Supabase Dashboard (SQL Editor) before deploying:

```sql
ALTER TABLE public.lessons
  ADD COLUMN status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'published'));
```

## Self-Check: PASSED

- `backend/src/database/migrations/025_lesson_status.sql` — FOUND
- `frontend/src/features/admin/components/AdminCursoDetailLessons/LessonPublishButton.tsx` — FOUND
- `frontend/src/features/admin/components/AdminCursoDetailLessons/AdminCursoDetailLessons.tsx` — FOUND (65 lines, within limit)
- `frontend/src/features/admin/components/AdminCursoDetailPage/AdminCursoDetailPage.tsx` — FOUND (109 lines, within limit)
- Commit `6d649ae` — FOUND
- Commit `ee5fb41` — FOUND

---
*Phase: 03-admin-cursos*
*Completed: 2026-03-29*
