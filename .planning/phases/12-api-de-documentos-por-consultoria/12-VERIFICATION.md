---
phase: 12-api-de-documentos-por-consultoria
verified: 2026-03-30T02:00:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 12: API de Documentos por Consultoria — Verification Report

**Phase Goal:** Consultora sobe PDF do cliente em uma consultoria e ele é usado no chat daquela consultoria
**Verified:** 2026-03-30T02:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | GET /api/consultancies/:id/documents retorna documentos isolados por consultoria | VERIFIED | `consultancyDocuments.ts` line 65: `getDocumentsByScope({ scope: 'consultancy', consultancyId, userId })` — filters by both consultancy_id and user_id |
| 2  | POST /api/consultancies/:id/documents faz upload e indexa com scope=consultancy | VERIFIED | Lines 112-116: insert with `scope: 'consultancy', consultancy_id: consultancyId`; background IIFE fires parse+chunk+embed pipeline |
| 3  | DELETE /api/consultancies/:id/documents/:docId remove documento sem afetar outras consultorias | VERIFIED | Line 195: `deleteDocument(docId, userId)` — service enforces user_id match; ownership verified via getConsultancy before call |
| 4  | Consultora nao consegue acessar documentos de consultoria que nao e dela | VERIFIED | All 3 route handlers call `getConsultancy(userId, consultancyId)` first; returns 404 if consultancy not owned by user |
| 5  | Aba Documentos aparece nas tabs da consultoria | VERIFIED | `consultorias.detail.types.ts` line 12: `'documentos'` in TabKey; line 31: `{ key: 'documentos', label: 'Documentos' }` in TABS array |
| 6  | Consultora pode fazer upload de PDF na aba Documentos | VERIFIED | `ConsultoriaDocumentos.tsx` line 37: `<input type="file" accept=".pdf,.txt,.md">` triggers `uploadDoc(file)` via mutation |
| 7  | Documentos aparecem em lista com status (processando/pronto/erro) | VERIFIED | `ConsultoriaDocumentos.tsx` lines 7-11: STATUS_CONFIG with labels Processando/Pronto/Erro; rendered at line 56 |
| 8  | Consultora pode remover documento da lista | VERIFIED | Line 57: `<button onClick={() => deleteDoc(doc.id)}>` with disabled state during processing |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/routes/consultancyDocuments.ts` | Member document routes (GET, POST, DELETE) | VERIFIED | 207 lines; 3 routes; mergeParams:true; requireAuth; getConsultancy ownership check on all routes |
| `backend/src/app.ts` | Route registration for consultancy documents | VERIFIED | Line 20: import; Line 113: `app.use('/api/consultancies/:consultancyId/documents', authLimit, consultancyDocumentsRouter)` |
| `frontend/src/features/consultorias/services/consultancyDocuments.api.ts` | API client with list/upload/delete | VERIFIED | 49 lines; exports KnowledgeDocument, listConsultancyDocs, uploadConsultancyDoc (FormData), deleteConsultancyDoc |
| `frontend/src/features/consultorias/hooks/useConsultancyDocuments.ts` | React Query hook for document CRUD | VERIFIED | 41 lines; useQuery + 2 useMutations; queryKey includes consultancyId; invalidateQueries on success |
| `frontend/src/features/consultorias/components/ConsultoriaDocumentos/ConsultoriaDocumentos.tsx` | Document upload + list micro-module | VERIFIED | 67 lines (under 80 limit); upload button, doc list, status badges, delete button, loading skeleton, empty state |
| `frontend/src/features/consultorias/components/ConsultoriaDocumentos/index.ts` | Barrel export | VERIFIED | Exports ConsultoriaDocumentos |
| `frontend/src/features/consultorias/consultorias.detail.types.ts` | TabKey with 'documentos'; no 'arquivos' | VERIFIED | 'documentos' in TabKey and TABS; 'arquivos' fully removed (grep returns empty) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `consultancyDocuments.ts` | `knowledgeService.ts` | getDocumentsByScope, deleteDocument, parseFile | WIRED | All 3 functions imported and called in route handlers |
| `consultancyDocuments.ts` | `middleware/auth.ts` | requireAuth | WIRED | Line 52: `router.use(requireAuth)` applied to all routes |
| `app.ts` | `consultancyDocuments.ts` | app.use route mount | WIRED | Line 113: `app.use('/api/consultancies/:consultancyId/documents', authLimit, consultancyDocumentsRouter)` |
| `useConsultancyDocuments.ts` | `consultancyDocuments.api.ts` | useQuery + useMutation wrapping API calls | WIRED | Imports listConsultancyDocs, uploadConsultancyDoc, deleteConsultancyDoc; each wrapped in React Query |
| `ConsultoriaDetailPage.tsx` | `ConsultoriaDocumentos.tsx` | activeTab switch rendering | WIRED | Line 78: `{activeTab === 'documentos' && id && <ConsultoriaDocumentos consultancyId={id} />}` |
| `consultancyDocuments.api.ts` | `/api/consultancies/:id/documents` | fetch/client HTTP calls | WIRED | Lines 22, 30, 47: all 3 endpoints hit correct backend paths |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| KNWL-03 | 12-01, 12-02 | Consultora pode fazer upload de documentos do cliente por consultoria | SATISFIED | POST endpoint (backend) + upload UI (frontend) both implemented and wired |
| KNWL-04 | 12-01, 12-02 | Consultora pode remover documentos da consultoria | SATISFIED | DELETE endpoint (backend) + trash button in ConsultoriaDocumentos (frontend) both implemented and wired |

No orphaned requirements — both KNWL-03 and KNWL-04 are fully satisfied.

---

### Anti-Patterns Found

No anti-patterns detected in phase files:
- No TODO/FIXME/PLACEHOLDER comments
- No empty implementations (return null/return {})
- No stub handlers (no console.log-only functions)
- No return types that ignore DB results

One stylistic note (not a blocker): `console.error` at line 170 of `consultancyDocuments.ts` is in a background IIFE error path — this is intentional for production error logging and not a stub.

---

### Human Verification Required

**1. Upload flow end-to-end**
- **Test:** Navigate to a consultoria detail page, click "Documentos" tab, click "Enviar arquivo", select a PDF, wait for status change
- **Expected:** Document appears in list with "Processando" status, transitions to "Pronto" after background pipeline completes
- **Why human:** Status polling/real-time update behavior cannot be verified programmatically

**2. Ownership isolation**
- **Test:** Log in as user A, upload a document to consultoria X. Log in as user B, attempt to GET /api/consultancies/X/documents
- **Expected:** User B receives 404 (does not see user A's documents)
- **Why human:** Cross-user isolation requires live Supabase RLS + getConsultancy check with real user sessions

**3. File type rejection**
- **Test:** Attempt to upload a .jpg or .docx file via the "Enviar arquivo" button
- **Expected:** Upload rejected with error message
- **Why human:** Browser file filter + backend multer validation behavior requires live interaction

---

### Gaps Summary

No gaps found. All 8 observable truths are verified. All artifacts exist, are substantive, and are fully wired. Both KNWL-03 and KNWL-04 requirements are satisfied. TypeScript compiles cleanly in both frontend and backend (0 errors). Component respects the 80-line limit (67 lines). The 'arquivos' placeholder tab has been fully replaced with the functional 'documentos' tab.

The only limitation is that KNWL-05 (chat IA uses consultancy documents as context) is explicitly deferred to Phase 13 — this is expected and not a gap for Phase 12.

---

_Verified: 2026-03-30T02:00:00Z_
_Verifier: Claude (gsd-verifier)_
