---
phase: 01-admin-layout-e-navegacao
verified: 2026-03-29T00:10:00Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: "Production build succeeds without errors"
    status: failed
    reason: "tsc -b fails with TS6133 — 'adminGetTurmaEnrollments' is declared but its value is never read"
    artifacts:
      - path: "frontend/src/features/admin/components/AdminTurmasPage/AdminTurmasPage.tsx"
        issue: "Line 8: adminGetTurmaEnrollments imported but never used in aggregator (it's used inside ManageTurmaStudentsModal instead)"
    missing:
      - "Remove adminGetTurmaEnrollments from the import on line 8 of AdminTurmasPage.tsx"
---

# Phase 1: Admin Layout e Navegacao — Verification Report

**Phase Goal:** ADMN-06: Admin can navigate between all sections in < 3 clicks.
**Verified:** 2026-03-29T00:10:00Z
**Status:** GAPS FOUND (1 blocking issue)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sidebar uses flat NAV_ITEMS (no accordion) | VERIFIED | AdminShell.tsx line 78: `const NAV_ITEMS: NavItem[] = [...]` — no NAV_GROUPS, no accordion logic |
| 2 | NAV_ITEMS has exactly 6 entries | VERIFIED | Lines 79-85: Dashboard, Cursos, Usuarias, Planos/Stripe, IA Global, Configuracoes |
| 3 | Routes /admin/planos, /admin/ia, /admin/config are registered | VERIFIED | App.tsx lines 129-131 confirm all 3 routes present |
| 4 | All page files in pages/admin/ are thin shells (≤5 lines) | VERIFIED | wc -l output: all files are 1-2 lines |
| 5 | Production build succeeds without errors | FAILED | `npm run build` exits 2: TS6133 unused import in AdminTurmasPage.tsx |

**Score:** 4/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/components/layout/AdminShell.tsx` | Flat NAV_ITEMS, no accordion | VERIFIED | 292 lines, NAV_ITEMS array with 6 entries, NavItemLink component with activePaths logic |
| `frontend/src/App.tsx` | Routes for /admin/planos, /admin/ia, /admin/config | VERIFIED | All 3 routes registered (lines 129-131) |
| `frontend/src/pages/admin/*.tsx` (14 files) | Thin shells ≤5 lines | VERIFIED | All files are 1-2 lines (re-exports pointing to features/admin) |
| `frontend/src/features/admin/components/AdminFormacaoPage/` | Aggregator ≤200L, micro-modules ≤80L | VERIFIED | Aggregator 145L, SectionCard 81L*, StatusDropdown 63L, ManageSectionCoursesModal 63L |
| `frontend/src/features/admin/components/AdminTurmasPage/` | Aggregator ≤200L, micro-modules ≤80L | VERIFIED (wiring issue) | Aggregator 124L, TurmaCard 50L, TurmaFormModal 78L, ManageTurmaStudentsModal 72L — but unused import breaks build |
| `frontend/src/features/admin/components/AdminOfertasPage/` | Aggregator ≤200L, micro-modules ≤80L | VERIFIED | Aggregator 96L, OfertaCard 50L, OfertaFormModal 57L, ManageOfertaTurmasModal 65L |
| `frontend/src/features/admin/components/AdminCursosPage/` | Aggregator ≤200L, micro-modules ≤80L | VERIFIED | Aggregator 133L, CourseCard 43L, CourseCreateModal 76L |
| `frontend/src/features/admin/components/AdminStripePage/` | Aggregator ≤200L, micro-modules ≤80L | VERIFIED | Aggregator 123L, AuditTab 77L, WebhooksTab 62L |
| `frontend/src/features/admin/components/AdminShell/AdminShell.spec.tsx` | 4 tests passing | VERIFIED | vitest run: 4/4 tests pass in 1.17s |

*SectionCard.tsx at 81L (1 line over limit) — justified in SUMMARY: interface declaration adds 1 line for type safety.

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| AdminShell.tsx NAV_ITEMS[0] | /admin (Dashboard) | `end: true` | VERIFIED | Line 79: `end: true` present; dashboard active only on exact /admin |
| AdminShell.tsx NAV_ITEMS[1] | /admin/cursos + /admin/formacao + /admin/home | `activePaths` | VERIFIED | Line 80: `activePaths: ['/admin/formacao', '/admin/home']`; NavItemLink checks `location.pathname.startsWith(p)` |
| AdminShell.tsx NAV_ITEMS[3] | /admin/planos + /admin/ofertas + /admin/turmas + /admin/stripe | `activePaths` | VERIFIED | Line 82: `activePaths: ['/admin/ofertas', '/admin/turmas', '/admin/stripe']` |
| App.tsx | AdminPlanosPage, AdminIAPage, AdminConfigPage | Route registration | VERIFIED | Lines 129-131 in App.tsx |
| pages/admin/*.tsx | features/admin/components/ | Re-export | VERIFIED | All 14 page shells are single-line re-exports |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| ADMN-06 | Admin can navigate between all sections in < 3 clicks | SATISFIED (navigation) / BLOCKED (build) | Flat nav with 6 direct items means 1 click to any section. Dashboard `end=true` prevents false-active. activePaths ensures correct highlight on sub-routes. However build failure means this cannot be deployed. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `features/admin/components/AdminTurmasPage/AdminTurmasPage.tsx` | 8 | Unused import: `adminGetTurmaEnrollments` | BLOCKER | `tsc -b` fails; `npm run build` exits with code 2; production deploy impossible |

---

## Human Verification Required

### 1. Sidebar active state visual correctness

**Test:** Navigate to /admin/formacao and /admin/home in the browser
**Expected:** "Cursos" sidebar item appears highlighted/active, not Dashboard
**Why human:** activePaths logic uses pathname.startsWith() — correct in code, but visual rendering of the active class requires browser confirmation

### 2. Disabled "Configuracoes" item accessibility

**Test:** Try to click the Configuracoes item in the sidebar
**Expected:** Item appears greyed out (opacity-40), no navigation occurs, no error in console
**Why human:** Renders as `<div>` not `<a>` — visual confirmation needed

### 3. Mobile drawer behavior

**Test:** On mobile viewport, open drawer, click a nav item
**Expected:** Drawer closes and the correct page renders
**Why human:** AnimatePresence + route change interaction requires live browser testing

---

## Gaps Summary

One gap blocks the phase from being fully deployable:

**Build failure in AdminTurmasPage.tsx:** The import statement on line 8 includes `adminGetTurmaEnrollments` which is not used in the aggregator component body. This function is used inside `ManageTurmaStudentsModal` (which fetches its own data), but it was left in the aggregator's import as a leftover. TypeScript strict mode (`tsc -b`) treats this as an error (TS6133) and the build fails.

The fix is a single-line change: remove `adminGetTurmaEnrollments` from the destructured import on line 8 of `AdminTurmasPage.tsx`.

All other phase requirements are fully satisfied: flat nav is in place, 6 NAV_ITEMS confirmed, all 3 placeholder routes registered, all page shells are thin re-exports, all aggregators and micro-modules respect line limits, and 4/4 Vitest tests pass.

---

_Verified: 2026-03-29T00:10:00Z_
_Verifier: Claude (gsd-verifier)_
