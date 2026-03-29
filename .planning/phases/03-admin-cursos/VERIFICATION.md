---
phase: 03-admin-cursos
verified: 2026-03-29T05:00:00Z
status: gaps_found
score: 6/7 must-haves verified
re_verification: false
gaps:
  - truth: "Frontend compila e faz build sem erros TypeScript"
    status: failed
    reason: "A interface Course em frontend/src/api/courses.ts nao inclui o campo stripe_product_id, causando erro TS2353 no build de producao (AdminCursosPage.tsx linha 76)"
    artifacts:
      - path: "frontend/src/api/courses.ts"
        issue: "Interface Course nao contem stripe_product_id; adminCreateCourse usa Partial<Course> que rejeita o campo"
      - path: "frontend/src/features/admin/components/AdminCursosPage/AdminCursosPage.tsx"
        issue: "Linha 76 passa stripe_product_id sem cast, causando TS2353 no build"
    missing:
      - "Adicionar stripe_product_id?: string | null a interface Course em frontend/src/api/courses.ts"
---

# Phase 03: Admin Cursos — Verification Report

**Phase Goal:** A Iris publica uma aula completa no admin sem ajuda externa
**Verified:** 2026-03-29T05:00:00Z
**Status:** GAPS FOUND
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                             | Status     | Evidence                                                                                                                    |
|----|-----------------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------------------------------------|
| 1  | Backend aceita associar curso a plano Stripe via PATCH/PUT                        | VERIFIED   | courseSchema inclui stripe_product_id (uuid optional nullable) na linha 36 de courses.ts                                   |
| 2  | GET /api/admin/courses retorna stripe_product_id e nome do plano associado        | VERIFIED   | Select inclui `stripe_product_id, stripe_products (id, name, price_cents, billing_interval)` nas linhas 43 e 66            |
| 3  | Admin filtra cursos por status (Todos, Publicados, Rascunhos, Arquivados)         | VERIFIED   | CourseStatusTabs.tsx (36L) importado e usado com statusFilter state no AdminCursosPage.tsx (166L)                           |
| 4  | Admin publica ou despublica curso com 1 clique no header do detalhe               | VERIFIED   | CoursePublishButton.tsx (34L) montado em AdminCursoDetailHeader.tsx (62L) com mutations publish/unpublish wired             |
| 5  | Admin associa curso a plano Stripe via dropdown no detalhe e no modal de criacao  | VERIFIED   | CoursePlanSelect.tsx (32L) wired em AdminCursoDetailHeader; PlanSelect via CourseCreateModal; adminListProducts via useQuery |
| 6  | Admin publica ou despublica aula individual com 1 clique                          | VERIFIED   | LessonPublishButton.tsx (29L) wired em AdminCursoDetailLessons, mutations em useAdminCursoDetail, props threaded via aggregator |
| 7  | Frontend builda sem erros TypeScript em producao                                  | FAILED     | `npm run build` falha com TS2353: stripe_product_id nao existe em Partial<Course> — interface Course desatualizada          |

**Score:** 6/7 truths verified

### Required Artifacts

| Artifact                                                                                  | Status    | Details                                       |
|-------------------------------------------------------------------------------------------|-----------|-----------------------------------------------|
| `backend/src/database/migrations/024_course_plan_link.sql`                                | VERIFIED  | Existe, contém ALTER TABLE + CREATE INDEX      |
| `backend/src/database/migrations/025_lesson_status.sql`                                   | VERIFIED  | Existe, contém ALTER TABLE com CHECK constraint |
| `backend/src/routes/admin/courses.ts`                                                     | VERIFIED  | stripe_product_id no schema, GET join, POST publish/unpublish lessons |
| `frontend/src/features/admin/components/AdminCursosPage/CourseStatusTabs.tsx`             | VERIFIED  | 36 linhas (limite 80), renderiza 4 tabs com contagens |
| `frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePlanSelect.tsx`      | VERIFIED  | 32 linhas (limite 80), dropdown de planos     |
| `frontend/src/features/admin/components/AdminCursoDetailHeader/CoursePublishButton.tsx`   | VERIFIED  | 34 linhas (limite 80), botao toggle publish   |
| `frontend/src/features/admin/components/AdminCursoDetailLessons/LessonPublishButton.tsx`  | VERIFIED  | 29 linhas (limite 40), indicador visual + toggle |
| `frontend/src/features/admin/components/AdminCursosPage/AdminCursosPage.tsx`              | VERIFIED  | 166 linhas (limite 200), aggregator           |
| `frontend/src/api/courses.ts` — interface Course com stripe_product_id                   | FAILED    | Campo ausente; build falha com TS2353         |

### Key Link Verification

| From                          | To                                    | Via                           | Status      | Details                                                          |
|-------------------------------|---------------------------------------|-------------------------------|-------------|------------------------------------------------------------------|
| CourseCreateModal.tsx          | adminListProducts                     | useQuery                      | WIRED       | Linha 29: `useQuery({ queryKey: [...], queryFn: adminListProducts })` |
| AdminCursosPage.tsx            | CourseStatusTabs.tsx                  | statusFilter state + props    | WIRED       | Linha 112: `<CourseStatusTabs activeStatus={statusFilter} ...>` |
| AdminCursoDetailHeader.tsx     | CoursePlanSelect.tsx                  | props currentPlanId + onSelect| WIRED       | Linha 54: `<CoursePlanSelect currentPlanId={...} onSelect={...}>` |
| AdminCursoDetailHeader.tsx     | CoursePublishButton.tsx               | props status + callbacks      | WIRED       | Linha 55: `<CoursePublishButton status={...} onPublish={...}>` |
| LessonPublishButton.tsx        | /api/admin/courses/lessons/:id/publish| mutation via prop callback    | WIRED       | Props onPublish/onUnpublish threaded via aggregator → useAdminCursoDetail mutations |
| AdminCursoDetailLessons.tsx    | LessonPublishButton.tsx               | props lesson.status + callbacks| WIRED      | Linha 29: `<LessonPublishButton ... onPublish={onPublishLesson}>` |
| AdminCursosPage.tsx            | Partial<Course> com stripe_product_id | adminCreateCourse             | NOT_WIRED   | Interface Course sem stripe_product_id causa TS2353 no build     |

### Requirements Coverage

| Requirement | Source Plan      | Description                                                                                      | Status         | Evidence                                                         |
|-------------|------------------|--------------------------------------------------------------------------------------------------|----------------|------------------------------------------------------------------|
| ADMN-02     | 03-01, 03-02, 03-03 | Admin gerencia cursos e aulas com publicacao/despublicacao e associacao de plano                 | PARTIAL        | Toda logica existe e funciona; build falha por tipo ausente na interface Course |

### Anti-Patterns Found

| File                                                                                      | Line | Pattern          | Severity | Impact                                               |
|-------------------------------------------------------------------------------------------|------|------------------|----------|------------------------------------------------------|
| `frontend/src/features/admin/components/AdminCursoDetailHeader/AdminCursoDetailHeader.tsx` | 20   | `as any` cast    | Warning  | Mascara o mesmo bug de tipo que causa falha de build |
| `frontend/src/features/admin/components/AdminCursoDetailHeader/AdminCursoDetailHeader.tsx` | 22   | `as any` cast    | Warning  | Idem                                                 |
| `frontend/src/api/courses.ts`                                                             | 66   | Interface incompleta | Blocker | stripe_product_id ausente — causa TS2353 no build de producao |

### Human Verification Required

#### 1. Fluxo completo de publicacao de aula

**Test:** No admin, abrir detalhe de um curso, criar uma aula, verificar que aparece como "Draft", clicar no botao para publicar e confirmar que o indicador muda para verde "Pub" e que a API retorna sucesso.
**Expected:** Status da aula muda de draft para published visivelmente na UI e persiste apos refresh.
**Why human:** Requer banco de dados Supabase com migration 025 aplicada e sessao autenticada como admin.

#### 2. Dropdown de planos no modal de criacao

**Test:** Abrir o modal de criacao de curso, verificar que o dropdown "Plano associado" lista os produtos Stripe ativos com nome e preco, e que ao selecionar um e criar o curso ele aparece associado no card.
**Expected:** Plano selecionado aparece como badge "Plano: {nome}" no card do curso criado.
**Why human:** Requer planos Stripe cadastrados no banco (tabela stripe_products).

### Gaps Summary

**1 gap bloqueando build de producao:**

O campo `stripe_product_id` foi adicionado ao schema Zod do backend e usado em varios componentes do frontend, mas a interface `Course` em `frontend/src/api/courses.ts` nao foi atualizada para incluir o campo. Isso faz o `tsc -b` (usado no `npm run build`) falhar com erro TS2353 em `AdminCursosPage.tsx` linha 76.

A funcionalidade existe e esta corretamente conectada — a falta e apenas de uma declaracao de tipo. `AdminCursoDetailHeader` contornou o problema com `as any` nas linhas 20 e 22, mas `AdminCursosPage` nao tem o cast, expondo o erro no build.

**Fix necessario:** Adicionar `stripe_product_id?: string | null` a interface `Course` em `frontend/src/api/courses.ts`.

---

_Verified: 2026-03-29T05:00:00Z_
_Verifier: Claude (gsd-verifier)_
