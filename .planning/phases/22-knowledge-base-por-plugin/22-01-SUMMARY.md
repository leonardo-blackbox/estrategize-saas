---
phase: 22-knowledge-base-por-plugin
plan: 01
subsystem: backend/knowledge
tags: [migration, rag, plugin, knowledge-base, helena]
dependency_graph:
  requires: [030_plugin_system.sql, 026_knowledge_base.sql, knowledgeService.ts]
  provides: [032_knowledge_plugin_scope.sql, listPluginDocuments, deletePluginDocument, queryPluginKnowledge]
  affects: [ragService.ts (backward compat — no change), admin/knowledge routes, future 22-02 plugin routes]
tech_stack:
  added: []
  patterns: [plugin-scoped RAG isolation via filter_plugin_slug DEFAULT NULL, three-branch scope integrity constraint]
key_files:
  created:
    - backend/src/database/migrations/032_knowledge_plugin_scope.sql
  modified:
    - backend/src/services/knowledgeService.ts
decisions:
  - filter_plugin_slug DEFAULT NULL ensures plugin chunks never leak into consultancy/global RAG — ragService.ts needs zero changes
  - Three-branch chk_knowledge_scope replaces chk_consultancy_scope — enforces mutual exclusivity of consultancy_id and plugin_slug
  - queryPluginKnowledge delegates to match_knowledge_chunks with filter_scope=plugin + filter_plugin_slug for dual-filter isolation
  - deletePluginDocument verifies scope=plugin + plugin_slug ownership before delete — prevents cross-plugin deletion
metrics:
  duration: 2 min
  completed: 2026-04-01
  tasks_completed: 2
  files_changed: 2
---

# Phase 22 Plan 01: Plugin-Scoped Knowledge Base — Foundation Summary

Schema and service extension that gives each plugin (Helena) its own isolated RAG knowledge base, preventing document leakage between plugin scope and consultancy/global scope.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Migration 032 — plugin_slug column + match_knowledge_chunks update | 030e4ff |
| 2 | knowledgeService — listPluginDocuments, deletePluginDocument, queryPluginKnowledge | f06e7d4 |

## Decisions Made

**filter_plugin_slug DEFAULT NULL for backward compatibility**
ragService.ts calls `match_knowledge_chunks` without `filter_plugin_slug`. By defaulting to NULL, the WHERE clause `(filter_plugin_slug IS NULL OR kd.plugin_slug = filter_plugin_slug)` evaluates to `true` for any row — but combined with `filter_scope='global'` or `filter_scope='consultancy'`, plugin chunks (which have `scope='plugin'`) are never returned. Zero changes to ragService.ts required.

**Three-branch integrity constraint**
`chk_knowledge_scope` replaces `chk_consultancy_scope` with three mutually exclusive branches ensuring: global = no IDs, consultancy = consultancy_id only, plugin = plugin_slug only. This prevents hybrid states at the DB level.

**deletePluginDocument ownership via plugin_slug**
Plugin documents are inserted by the system (service role), not by individual users, so user_id ownership verification used in `deleteDocument` is not appropriate. Instead, `deletePluginDocument` verifies `scope='plugin' AND plugin_slug=<slug>` — the route handler (Plan 22-02) will apply admin/plugin-owner authorization.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `backend/src/database/migrations/032_knowledge_plugin_scope.sql` exists
- [x] `backend/src/services/knowledgeService.ts` exports `listPluginDocuments`, `deletePluginDocument`, `queryPluginKnowledge`
- [x] Commits 030e4ff and f06e7d4 exist
- [x] TypeScript compiles without errors
- [x] ragService.ts unmodified (git diff HEAD~2 shows no changes)

## Self-Check: PASSED
