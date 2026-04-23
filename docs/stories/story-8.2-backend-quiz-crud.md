# Story 8.2 — Backend: Quiz CRUD Routes

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.2
**Status:** Ready for Review
**Branch:** feat/8.2-backend-quiz-crud
**Wave:** 2
**Depends on:** Story 8.1 (DB migration)

---

## User Story

> **Como** usuário autenticado,
> **Quero** criar e gerenciar quizzes via API,
> **Para** ter uma lista de quizzes completamente separada dos meus formulários.

---

## Contexto Técnico

**ISOLAMENTO CRÍTICO:**
- `backend/src/routes/applications.ts` → NÃO TOCAR
- `backend/src/services/formSubmissionService.ts` → NÃO TOCAR
- `backend/src/routes/public/forms.ts` → NÃO TOCAR

**Modificação ADDITIVE em `applicationService.ts`:**
- Adicionar parâmetro opcional `toolType?: string` com default `'form'` em `listApplications` e `createApplication`
- Não alterar nenhum outro comportamento existente

**Arquivos a criar:**
- `backend/src/routes/quiz.ts`
- Registrar em `backend/src/routes/index.ts`

**Pattern de referência:** `backend/src/routes/applications.ts` (mesmo padrão, com tool_type='quiz')

---

## Acceptance Criteria

### AC1 — `applicationService.ts` — modificação additive
- [x] `listApplications(userId, toolType = 'form')` — adiciona `WHERE tool_type = toolType` ao query
- [x] `createApplication(userId, title, toolType = 'form')` — passa `tool_type` no INSERT
- [x] `GET /api/applications` continua retornando APENAS forms (tool_type='form') — não quebra
- [x] TypeScript compila sem erros

### AC2 — `quiz.ts` — rotas CRUD
- [x] `GET /api/quizzes` → lista quizzes do usuário autenticado (tool_type='quiz'), com response_count
- [x] `POST /api/quizzes` → cria quiz com tool_type='quiz', campos padrão welcome + thank_you, slug único
- [x] `GET /api/quizzes/:id` → retorna quiz + fields (403 se não é dono)
- [x] `PUT /api/quizzes/:id` → atualiza title, status, theme_config, settings, quiz_config
- [x] `DELETE /api/quizzes/:id` → soft-delete (archived) ou hard-delete se já archived
- [x] `POST /api/quizzes/:id/duplicate` → duplica quiz + fields (quiz_outcomes serão duplicados na Story 8.3)
- [x] `PUT /api/quizzes/:id/fields` → bulk replace campos (max 100, posições index*10, mesmo padrão de applications)

### AC3 — Validação Zod
- [x] POST /api/quizzes valida: `title` (string, 1-200 chars)
- [x] PUT /api/quizzes/:id valida campos opcionais com Zod
- [x] PUT /api/quizzes/:id/fields valida array de fields (max 100)

### AC4 — Segurança
- [x] Todos os endpoints requerem `requireAuth` middleware
- [x] Verificação de ownership em GET/:id, PUT/:id, DELETE/:id, POST/:id/duplicate
- [x] 403 retornado se quiz não pertence ao usuário

### AC5 — Registro de rota
- [x] `backend/src/routes/index.ts` registra `/api/quizzes` → quizRoutes
- [x] Rota disponível após restart do servidor

### AC6 — Response format (igual applications)
- [x] Lista de quizzes inclui: id, title, slug, status, response_count, created_at, updated_at
- [x] Quiz individual inclui: todos os campos acima + fields (array) + theme_config + settings + quiz_config

---

## Definition of Done

- [x] `backend/src/routes/quiz.ts` criado (max 200 linhas)
- [x] `backend/src/services/applicationService.ts` modificado (additive only)
- [x] `backend/src/routes/index.ts` registra `/api/quizzes`
- [x] `GET /api/applications` continua funcionando e NÃO retorna quizzes
- [x] `GET /api/quizzes` retorna lista vazia para novo usuário (200 OK)
- [x] `POST /api/quizzes` + `GET /api/quizzes/:id` funcionam
- [x] TypeScript compila sem `any` e sem erros

## File List

- `backend/src/routes/quiz.ts`
- `backend/src/services/applicationService.ts`
- `backend/src/app.ts`

## Dev Agent Record

- Adicionado filtro additive `toolType` em `listApplications` e `createApplication`, preservando `form` como default.
- Criada rota autenticada `/api/quizzes` com CRUD, duplicação e bulk replace de campos para `tool_type = 'quiz'`.
- Registrado `quizRouter` em `backend/src/app.ts` sem alterar rotas de Aplicações/Form Público.
- Verificações executadas: `npx eslint src/routes/quiz.ts src/services/applicationService.ts src/app.ts`, `npx tsc --noEmit`, diff vazio nos arquivos proibidos de backend.
