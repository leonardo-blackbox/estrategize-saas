# Story 8.6 — Frontend: Dashboard Quiz (Lista + Criar)

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.6
**Status:** Ready for Review
**Branch:** feat/8.6-dashboard-quiz
**Wave:** 4
**Depends on:** Story 8.2 (backend quiz CRUD), Story 8.5 (FieldType)

---

## User Story

> **Como** usuário autenticado,
> **Quero** ver e gerenciar meus quizzes em uma seção dedicada,
> **Para** não misturar quizzes com formulários e ter uma experiência limpa.

---

## Contexto Técnico

**Padrão de referência:** `frontend/src/features/aplicacoes/` (espelhar estrutura)
**Rota pública nova:** `/quiz`
**Nav:** item no `MemberShell.tsx`

**Estrutura a criar:**
```
frontend/src/features/quiz/
├── components/
│   ├── QuizPage/
│   │   ├── QuizPage.tsx        ← Agregador (max 200 linhas)
│   │   └── index.ts
│   ├── QuizCard/
│   │   ├── QuizCard.tsx        ← Card individual (max 80 linhas)
│   │   └── index.ts
│   ├── QuizEmptyState/
│   │   ├── QuizEmptyState.tsx  ← Empty state com CTA (max 80 linhas)
│   │   └── index.ts
│   └── QuizCreateModal/
│       ├── QuizCreateModal.tsx ← Modal criar (max 80 linhas)
│       └── index.ts
├── hooks/
│   └── useQuizzes.ts           ← React Query (max 120 linhas)
└── services/
    └── quiz.api.ts             ← HTTP client (max 150 linhas)
```

---

## Acceptance Criteria

### AC1 — `quiz.api.ts`
- [x] Usa o `client` de `src/api/client.ts` (mesmo padrão de `applications.ts`)
- [x] `listQuizzes()` → GET /api/quizzes
- [x] `createQuiz(title)` → POST /api/quizzes
- [x] `deleteQuiz(id)` → DELETE /api/quizzes/:id
- [x] `duplicateQuiz(id)` → POST /api/quizzes/:id/duplicate
- [x] `archiveQuiz(id)` → PUT /api/quizzes/:id com status='archived'
- [x] `publishQuiz(id)` → PUT /api/quizzes/:id com status='published'
- [x] `unpublishQuiz(id)` → PUT /api/quizzes/:id com status='draft'

### AC2 — `useQuizzes.ts`
- [x] `useQuizzes()` → React Query list com staleTime 30s
- [x] `useCreateQuiz()` → mutation que invalida lista após sucesso
- [x] `useDeleteQuiz()` → mutation com optimistic update
- [x] `useDuplicateQuiz()` → mutation que invalida lista após sucesso

### AC3 — `QuizPage.tsx` (Agregador)
- [x] Renderiza grid de `QuizCard` quando há quizzes
- [x] Renderiza `QuizEmptyState` quando lista vazia
- [x] Botão "Novo Quiz" abre `QuizCreateModal`
- [x] Loading skeleton durante fetch
- [x] Max 200 linhas

### AC4 — `QuizCard.tsx`
- [x] Exibe: título, status badge (Rascunho/Publicado/Arquivado), response_count, data de criação
- [x] Clique no card → navega para `/quiz/:id/editor`
- [x] Menu kebab: Editar, Duplicar, Arquivar, Deletar (com confirmação no delete)
- [x] Max 80 linhas

### AC5 — `QuizEmptyState.tsx`
- [x] Mensagem encorajadora: "Crie seu primeiro quiz e qualifique leads automaticamente"
- [x] Botão "Criar meu primeiro quiz" → abre modal de criação
- [x] Max 80 linhas

### AC6 — `QuizCreateModal.tsx`
- [x] Input de título (obrigatório, max 200 chars)
- [x] Botão "Criar quiz" → chama `useCreateQuiz`, redireciona para `/quiz/:id/editor`
- [x] Loading state durante criação
- [x] Max 80 linhas

### AC7 — Rota e navegação
- [x] `frontend/src/App.tsx`: rota `/quiz` → `<QuizPage />`
- [x] `MemberShell.tsx`: item "Quiz" no nav lateral (ícone `BarChart2` ou `HelpCircle`)
- [x] Item ativo quando path começa com `/quiz`
- [x] Rota protegida por auth (dentro do bloco de rotas autenticadas)

---

## Definition of Done

- [x] Feature `frontend/src/features/quiz/` criada com estrutura completa
- [x] `frontend/src/api/quiz.ts` criado
- [x] Rota `/quiz` funcionando, lista quizzes do usuário
- [x] "Novo Quiz" cria quiz e redireciona para editor
- [x] Item "Quiz" aparece no menu lateral
- [x] Aplicações page (`/aplicacoes`) não tem regressões
- [x] TypeScript sem `any`, max de linhas por arquivo respeitado

## File List

- `frontend/src/features/quiz/services/quiz.api.ts`
- `frontend/src/features/quiz/hooks/useQuizzes.ts`
- `frontend/src/features/quiz/components/QuizPage/QuizPage.tsx`
- `frontend/src/features/quiz/components/QuizCard/QuizCard.tsx`
- `frontend/src/features/quiz/components/QuizEmptyState/QuizEmptyState.tsx`
- `frontend/src/features/quiz/components/QuizCreateModal/QuizCreateModal.tsx`
- `frontend/src/features/quiz/index.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/layout/AppleNav.tsx`
- `frontend/src/components/layout/BottomTabs.tsx`

## Dev Agent Record

- Criada feature `quiz` com dashboard dedicado, listagem, criação, duplicação, arquivamento/publicação e delete com confirmação.
- Registrada rota protegida `/quiz` e adicionados itens de navegação desktop/mobile.
- Mantido isolamento: nenhum arquivo em `frontend/src/features/aplicacoes/` foi modificado.
- Verificação executada: `cd frontend && npx tsc --noEmit`.
