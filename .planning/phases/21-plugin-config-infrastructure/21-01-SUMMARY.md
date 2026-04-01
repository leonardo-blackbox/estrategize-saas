---
phase: 21-plugin-config-infrastructure
plan: "01"
subsystem: backend
tags: [plugin-system, database, admin-api, rls]
dependency_graph:
  requires: [030_plugin_system.sql, pluginService.ts]
  provides: [plugin_configs table, pluginConfigService, admin-plugin-routes]
  affects: [app.ts, helena-plugin-seed]
tech_stack:
  added: []
  patterns: [admin-RLS-policy, upsert-on-conflict, zod-validation, supabaseAdmin-service-role]
key_files:
  created:
    - backend/src/database/migrations/031_plugin_configs.sql
    - backend/src/services/pluginConfigService.ts
    - backend/src/routes/admin/plugins.ts
  modified:
    - backend/src/app.ts
decisions:
  - "plugin_configs uses scope column (default 'global') as part of unique constraint — enables future per-consultancy config overrides without schema changes"
  - "listAllPlugins fetches all plugins including is_active=false — admin needs to see full catalog, unlike listPlugins which filters to active-only"
  - "PUT /:slug/config validates both params and body with separate Zod schemas — provides specific error messages per validation layer"
metrics:
  duration: "2 min"
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_changed: 4
---

# Phase 21 Plan 01: Plugin Config Infrastructure Summary

Plugin configuration infrastructure: migration 031 creates `plugin_configs` table with admin-only RLS + Helena plugin seed, `pluginConfigService` exposes typed CRUD functions, and admin REST routes expose plugin catalog management to the frontend.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migration 031 + pluginConfigService | 2fdb354 | 031_plugin_configs.sql, pluginConfigService.ts |
| 2 | Admin plugin routes + app.ts registration | ceeff7d | plugins.ts (new), app.ts (modified) |

## Artifacts Produced

### backend/src/database/migrations/031_plugin_configs.sql
- `plugin_configs` table with `(plugin_slug, config_key, scope)` unique constraint
- Admin-only RLS policy (`role = 'admin'`)
- Helena plugin seeded into `plugins` catalog
- 5 default Helena config entries: `opening_enabled`, `mid_enabled`, `closing_enabled`, `objection_enabled`, `mid_interval_minutes`

### backend/src/services/pluginConfigService.ts
Exports: `getConfig`, `setConfig`, `getAllConfig`, `listAllPlugins`

### backend/src/routes/admin/plugins.ts
- `GET /api/admin/plugins` — lists all plugins (admin sees inactive too)
- `GET /api/admin/plugins/:slug/config` — returns `{ key: value }` object
- `PUT /api/admin/plugins/:slug/config` — upserts single config entry

### backend/src/app.ts
- Added import for `adminPluginsRouter`
- Registered at `/api/admin/plugins` with `adminLimit`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `backend/src/database/migrations/031_plugin_configs.sql` — FOUND
- `backend/src/services/pluginConfigService.ts` — FOUND
- `backend/src/routes/admin/plugins.ts` — FOUND
- `adminPluginsRouter` import in `app.ts` — FOUND
- `app.use('/api/admin/plugins', ...)` in `app.ts` — FOUND
- TypeScript compilation: PASSED (no errors)
- Commits 2fdb354, ceeff7d — FOUND in git log
