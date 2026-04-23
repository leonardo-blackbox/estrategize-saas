# Story 8.3 — Backend: Quiz Outcomes Management

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.3
**Status:** Ready for Review
**Branch:** feat/8.3-backend-quiz-outcomes
**Wave:** 2
**Depends on:** Story 8.2

---

## User Story

> **Como** criador de quiz,
> **Quero** configurar múltiplas telas de resultado via API,
> **Para** que cada tier de score mostre conteúdo e CTA diferentes.

---

## Contexto Técnico

**Arquivos a criar/modificar:**
- Adicionar funções de outcomes em `backend/src/services/quizService.ts` (criar se não existe)
- Adicionar rotas em `backend/src/routes/quiz.ts` (já existe da Story 8.2)

**Tabela:** `quiz_outcomes` (criada na Story 8.1)

**Padrão:** Bulk replace atômico (DELETE + INSERT em transação) — mesmo padrão de `PUT /:id/fields`

---

## Acceptance Criteria

### AC1 — `quizService.ts` — funções de outcomes
- [x] `listOutcomes(userId, applicationId): Promise<QuizOutcome[]>` — verifica ownership, retorna ordenado por `order`
- [x] `upsertOutcomes(userId, applicationId, outcomes[]): Promise<QuizOutcome[]>` — transação: DELETE existing + INSERT new, verifica ownership
- [x] Interface `QuizOutcome` TypeScript definida: id, application_id, outcome_key, title, description, score_min, score_max, cta_type, cta_url, cta_label, image_url, background_color, order, created_at

### AC2 — `GET /api/quizzes/:id/outcomes`
- [x] Retorna array de outcomes ordenados por `order`
- [x] 403 se quiz não pertence ao usuário
- [x] 200 com array vazio se não há outcomes configurados

### AC3 — `PUT /api/quizzes/:id/outcomes`
- [x] Aceita array de outcomes (máximo 10)
- [x] DELETE + INSERT em transação atômica (se INSERT falhar, DELETE é revertido)
- [x] Retorna array completo de outcomes salvos
- [x] 403 se quiz não pertence ao usuário

### AC4 — Validação Zod para PUT /outcomes
- [x] `score_min` e `score_max`: inteiros entre 0 e 100
- [x] `score_min < score_max` (validação custom)
- [x] `cta_type`: enum 'url' | 'whatsapp' | 'none'
- [x] `cta_url`: obrigatório quando `cta_type` é 'url' ou 'whatsapp' (string não-vazia)
- [x] `title`: obrigatório, string 1-200 chars
- [x] Máximo 10 outcomes (validação de array length)
- [x] Retorna 400 com erros Zod formatados se inválido

### AC5 — Duplicate quiz inclui outcomes
- [x] `POST /api/quizzes/:id/duplicate` (Story 8.2) também duplica `quiz_outcomes` do quiz original
- [x] Outcomes duplicados têm novos UUIDs e apontam para o novo `application_id`

---

## Definition of Done

- [x] `backend/src/services/quizService.ts` criado com `listOutcomes` e `upsertOutcomes`
- [x] `GET /api/quizzes/:id/outcomes` e `PUT /api/quizzes/:id/outcomes` funcionam
- [x] Transação atômica confirmada: falha no INSERT reverte DELETE
- [x] Validação Zod retorna erros claros para dados inválidos
- [x] Duplicate quiz duplica outcomes
- [x] TypeScript sem `any`

## File List

- `backend/src/services/quizService.ts`
- `backend/src/routes/quiz.ts`

## Dev Agent Record

- Criado `quizService.ts` com `listOutcomes`, `upsertOutcomes` e duplicação de outcomes para cópia de quiz.
- Adicionadas rotas `GET /api/quizzes/:id/outcomes` e `PUT /api/quizzes/:id/outcomes` com validação Zod, ownership e limite de 10 outcomes.
- Atualizado `POST /api/quizzes/:id/duplicate` para copiar outcomes do quiz original.
- Verificações executadas: `npx eslint src/routes/quiz.ts src/services/quizService.ts`, `npx tsc --noEmit`, diff vazio nos arquivos proibidos de backend.
