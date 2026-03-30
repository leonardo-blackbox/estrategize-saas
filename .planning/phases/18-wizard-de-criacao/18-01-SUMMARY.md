---
phase: 18-wizard-de-criacao
plan: "01"
subsystem: consultancies-data-contracts
tags: [migration, zod, typescript, wizard, consultancies]
dependency_graph:
  requires: []
  provides: [migration-029, consultancy-data-contracts, wizard-state-v2]
  affects: [backend/routes/consultancies, frontend/api/consultancies, CreateConsultancyWizard]
tech_stack:
  added: []
  patterns: [migration-addcolumn, zod-schema-extension, typescript-interface-extension]
key_files:
  created:
    - backend/src/database/migrations/029_consultancies_extra_fields.sql
  modified:
    - backend/src/routes/consultancies.ts
    - frontend/src/api/consultancies.ts
    - frontend/src/features/consultorias/components/CreateConsultancyWizard/wizard.types.ts
decisions:
  - "Backend template enum aligned to frontend ConsultancyTemplate values (repositioning|launch|scaling|restructuring|none) — previous enum (none|positioning|educational_product|local_business|full_restructure) was legacy and mismatched frontend"
  - "ticket stored as string in WizardState for UX (user types freely); converted to number before API submission in plan 18-02"
  - "start_date added to CreateConsultancyPayload (field existed in DB and backend schema but was missing from frontend payload type)"
metrics:
  duration: "~2 min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 4
---

# Phase 18 Plan 01: Consultancies Extra Fields — Data Contracts Summary

Migration SQL + Zod schemas + TypeScript interfaces updated to support ticket, has_team, has_website, current_stage fields required by the creation wizard.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migration 029 — ADD COLUMN extra fields | f5c3662 | `029_consultancies_extra_fields.sql` |
| 2 | Backend Zod + Frontend types + WizardState | 07185f8 | `consultancies.ts` (backend), `consultancies.ts` (frontend), `wizard.types.ts` |

## What Was Built

### Migration 029
- Adds 4 columns to `consultancies` table: `ticket INTEGER`, `has_team BOOLEAN NOT NULL DEFAULT FALSE`, `has_website BOOLEAN NOT NULL DEFAULT FALSE`, `current_stage TEXT`
- Includes rollback comment
- Ready to execute in Supabase Dashboard SQL Editor before plan 18-02

### Backend Zod Schemas (consultancies.ts)
- `createSchema`: Added `ticket`, `has_team`, `has_website`, `current_stage`; aligned `template` enum to frontend values
- `updateSchema`: Same 4 new fields with nullable variants; same `template` enum alignment

### Frontend Consultancy Interface (api/consultancies.ts)
- `Consultancy` interface: Added `ticket: number | null`, `has_team: boolean`, `has_website: boolean`, `current_stage: string | null`
- `CreateConsultancyPayload`: Added `start_date?`, `ticket?`, `has_team?`, `has_website?`, `current_stage?`

### WizardState (wizard.types.ts)
- Rewritten with 13 fields (was 8): added `ticket`, `start_date`, `current_stage`, `has_team`, `has_website`
- `ticket` typed as `string` for free-form input (wizard converts to number on submit)
- `start_date` typed as `string` (ISO date 'YYYY-MM-DD' or empty)

## Decisions Made

1. **Template enum alignment**: Backend `createSchema`/`updateSchema` now use `['repositioning', 'launch', 'scaling', 'restructuring', 'none']` matching the frontend `ConsultancyTemplate` type. The legacy backend enum values (`positioning`, `educational_product`, `local_business`, `full_restructure`) were wrong and would have rejected valid frontend requests.

2. **ticket as string in WizardState**: Users type the ticket value as free text; the wizard aggregator converts to `number` before calling `createConsultancy()`. This avoids controlled input complexity with numeric fields.

3. **start_date added to CreateConsultancyPayload**: This field already existed in the DB column and backend `createSchema` but was missing from the frontend type. Added now to complete the contract.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `029_consultancies_extra_fields.sql` exists with 4 ADD COLUMN
- [x] `grep "ticket" backend/src/routes/consultancies.ts` returns 2 lines (createSchema + updateSchema)
- [x] `grep "has_team|has_website|current_stage" frontend/src/api/consultancies.ts` returns 6 lines (Consultancy + CreateConsultancyPayload)
- [x] WizardState has 13 fields
- [x] `npx tsc --noEmit` exits with no errors
- [x] Commits f5c3662 and 07185f8 exist

## Self-Check: PASSED
