---
plan: 01-01
phase: 01
phase_slug: admin-layout-e-navegacao
status: complete
date: 2026-03-29
subsystem: frontend/admin
tags: [admin, navigation, sidebar, vitest, testing, routing]
requires: []
provides: [admin-flat-nav, vitest-setup, admin-placeholder-routes]
affects: [frontend/src/components/layout/AdminShell.tsx, frontend/src/App.tsx]
tech-stack:
  added:
    - vitest: "^4.1.2"
    - "@testing-library/react": testing utilities
    - "@testing-library/jest-dom": custom matchers
    - jsdom: DOM environment for tests
  patterns:
    - Flat sidebar nav with activePaths for multi-route sections
    - 3-layer architecture for placeholder pages
    - vitest/config defineConfig for test type support
key-files:
  created:
    - frontend/src/components/layout/AdminShell.tsx (refactored)
    - frontend/src/features/admin/components/AdminShell/AdminShell.spec.tsx
    - frontend/src/test-setup.ts
    - frontend/vite.config.ts (updated)
    - frontend/src/features/admin/components/AdminPlanosPage/AdminPlanosPage.tsx
    - frontend/src/features/admin/components/AdminPlanosPage/index.ts
    - frontend/src/features/admin/components/AdminIAPage/AdminIAPage.tsx
    - frontend/src/features/admin/components/AdminIAPage/index.ts
    - frontend/src/features/admin/components/AdminConfigPage/AdminConfigPage.tsx
    - frontend/src/features/admin/components/AdminConfigPage/index.ts
    - frontend/src/pages/admin/AdminPlanosPage.tsx
    - frontend/src/pages/admin/AdminIAPage.tsx
    - frontend/src/pages/admin/AdminConfigPage.tsx
  modified:
    - frontend/src/App.tsx (3 new routes)
    - frontend/src/features/admin/components/AdminStripePage/AuditTab.tsx (bug fix)
key-decisions:
  - Disabled nav items rendered as div (not NavLink) — correct for accessibility; spec adjusted to match
  - activePaths array in NavItem for multi-route sections (Cursos, Planos/Stripe) instead of useMatch loops
  - AdminShell accepts optional children prop to support test renders without BrowserRouter context
  - vitest/config used instead of vite/config to get proper TypeScript types for test block
requirements:
  - ADMN-06
duration: "~12 min"
completed: "2026-03-29"
---

# Phase 1 Plan 01: AdminShell Flat Nav Summary

AdminShell accordion nav (4 grupos colapsaveis) convertido para flat nav com 6 itens diretos com icones, Vitest configurado com 4 testes passando, e 3 rotas placeholder registradas (/admin/planos, /admin/ia, /admin/config).

## Duration

- Start: 2026-03-29T02:44:00Z
- End: 2026-03-29T02:57:48Z
- Duration: ~14 min
- Tasks: 3 (Task 0, Task 1, Task 2)
- Files created/modified: 14

## What Was Done

### Task 0 — Vitest Setup
- Installed vitest, @vitest/ui, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom
- Added `test` block to vite.config.ts (globals, jsdom, setupFiles)
- Created `src/test-setup.ts` with jest-dom matchers
- Created `AdminShell.spec.tsx` with 4 failing tests (expected RED state)

### Task 1 — AdminShell Refactor
- Removed: NAV_GROUPS array, NavGroup interface, NavGroupItem, NavSubItem, IconChevron, IconPlug components
- Removed: `expanded` state, localStorage persistence, autoExpand useEffect, toggleGroup function
- Added: IconUsers, IconSparkles icon components
- Added: `activePaths` field to NavItem interface
- Added: NavItemLink component with useLocation + activePaths logic
- Replaced accordion render with `NAV_ITEMS.map((item) => <NavItemLink key={item.to} item={item} />)`
- Dashboard uses `end={true}` — active only on exact /admin
- Cursos activePaths: ['/admin/formacao', '/admin/home']
- Planos/Stripe activePaths: ['/admin/ofertas', '/admin/turmas', '/admin/stripe']
- Added optional `children` prop to AdminShell for test harness support
- All 4 tests passing after refactor

### Task 2 — Placeholder Pages + Routes
- Created AdminPlanosPage (feature + index + thin shell)
- Created AdminIAPage (feature + index + thin shell)
- Created AdminConfigPage (feature + index + thin shell)
- Registered `/admin/planos`, `/admin/ia`, `/admin/config` in App.tsx
- Fixed vite.config.ts to use `vitest/config` for proper TypeScript types

## Acceptance Criteria Met

- [x] Sidebar shows 6 flat nav items with icons (5 NavLinks + 1 disabled div)
- [x] Dashboard uses end=true (active only on exact /admin)
- [x] activePaths working for Cursos and Planos/Stripe
- [x] 3 placeholder routes registered (no 404 on /admin/planos, /admin/ia, /admin/config)
- [x] Vitest configured (4/4 tests passing)
- [x] TypeScript builds clean (tsc --noEmit: 0 errors)
- [x] npm run build: successful

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] AuditTab.tsx unknown ReactNode**
- **Found during:** Task 2 (build verification)
- **Issue:** `log.metadata` typed as `unknown` used as JSX expression: `{log.metadata && ...}` fails with TS2322
- **Fix:** Changed to `{log.metadata != null && ...}` — explicit null check avoids unknown-as-ReactNode
- **Files modified:** `frontend/src/features/admin/components/AdminStripePage/AuditTab.tsx`
- **Commit:** 62ce863

**2. [Rule 3 - Blocking] vite.config.ts test block TypeScript error**
- **Found during:** Task 2 (build verification)
- **Issue:** Vite's `defineConfig` type doesn't include `test` field — `tsc -b` fails
- **Fix:** Changed import from `vite` to `vitest/config` — Vitest re-exports defineConfig with test types
- **Files modified:** `frontend/vite.config.ts`
- **Commit:** 62ce863

**3. [Spec Adjustment] Test for 6 nav items**
- **Found during:** Task 1 (test run)
- **Issue:** Spec expected 6 `<a>` role=link elements but disabled item renders as `<div>` (correct accessibility behavior)
- **Fix:** Updated test to check 5 NavLinks + assert disabled item text exists
- **Impact:** Test correctly validates sidebar structure including disabled state

Total deviations: 2 auto-fixed + 1 spec adjustment. No architectural changes needed.

## Next

Ready for Plan 01-02 (next plan in Phase 1).

## Self-Check: PASSED
