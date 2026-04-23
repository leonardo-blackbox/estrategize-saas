# Story 8.7 — Frontend: Quiz Shell + Navegação

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.7
**Status:** Ready for Review
**Branch:** feat/8.7-quiz-shell
**Wave:** 4
**Depends on:** Story 8.6

---

## User Story

> **Como** criador de quiz,
> **Quero** navegar entre as seções do editor com tabs claras,
> **Para** configurar campos, resultados, integrações e ver respostas sem confusão.

---

## Contexto Técnico

**Padrão de referência:** Shell de Aplicações (verificar em `frontend/src/features/aplicacoes/`)
**Tabs do Quiz:** Editor | Resultados | Integrações | Respostas | Analytics

**Rotas a criar:**
```
/quiz/:id/editor       → QuizEditorPage (stub para Story 8.8)
/quiz/:id/resultados   → QuizOutcomesPage (stub para Story 8.9)
/quiz/:id/integracoes  → QuizIntegracoesPage (reutilizar Aplicações ou stub)
/quiz/:id/respostas    → QuizRespostasPage (reutilizar Aplicações ou stub)
/quiz/:id/analytics    → QuizAnalyticsPage (stub)
```

**Para stories 8.7:** Criar o shell com stubs para as tabs. Stories 8.8 e 8.9 preenchem o conteúdo.

---

## Acceptance Criteria

### AC1 — Rotas no App.tsx
```tsx
<Route path="/quiz/:id" element={<QuizShell />}>
  <Route index element={<Navigate to="editor" replace />} />
  <Route path="editor" element={<QuizEditorPage />} />
  <Route path="resultados" element={<QuizOutcomesPage />} />
  <Route path="integracoes" element={<QuizIntegracoesPage />} />
  <Route path="respostas" element={<QuizRespostasPage />} />
  <Route path="analytics" element={<QuizAnalyticsPage />} />
</Route>
```
- [x] `/quiz/:id` redireciona para `/quiz/:id/editor`
- [x] Todas as 5 sub-rotas acessíveis

### AC2 — `QuizShell.tsx` — estrutura
- [x] Topbar com: título do quiz (editável inline), status badge, botões de ação
- [x] 5 tabs navegáveis: Editor, Resultados, Integrações, Respostas, Analytics
- [x] Tab ativa highlighted (border-bottom ou background)
- [x] Layout que passa `<Outlet />` para o conteúdo da tab ativa
- [x] Carrega quiz via `GET /api/quizzes/:id`
- [x] Loading skeleton durante fetch do quiz
- [x] 404 se quiz não existe ou não pertence ao usuário

### AC3 — Botões no topbar
- [x] "Publicar" (quando status=draft) → chama `publishQuiz(id)`, atualiza badge
- [x] "Despublicar" (quando status=published) → chama `unpublishQuiz(id)`, atualiza badge
- [x] "Ver quiz" (quando published) → abre `/q/:slug` em nova aba
- [x] "Copiar link" (quando published) → copia `/q/:slug` para clipboard com toast "Link copiado!"

### AC4 — Status badge
- [x] `draft` → badge cinza "Rascunho"
- [x] `published` → badge verde "Publicado"
- [x] `archived` → badge laranja "Arquivado"

### AC5 — Stubs para pages (serão preenchidos nas Stories 8.8 e 8.9)
- [x] `QuizEditorPage`: renderiza texto "Editor em construção..." (placeholder)
- [x] `QuizOutcomesPage`: renderiza texto "Resultados em construção..." (placeholder)
- [x] `QuizIntegracoesPage`: **página própria** com fluxo de 4 eventos Meta (spec no AC7 abaixo)
- [x] `QuizRespostasPage`: reutilizar `AplicacoesRespostasPage` com quizId OR stub simples
- [x] `QuizAnalyticsPage`: stub simples

### AC6 — Hook `useQuiz(id)`
- [x] React Query que faz GET /api/quizzes/:id
- [x] staleTime: 30s
- [x] Expõe: quiz, isLoading, error, refetch

### AC7 — `QuizIntegracoesPage` — Fluxo de Eventos Meta

**Rota:** `/quiz/:id/integracoes`

Página informativa que exibe como o Meta Pixel está configurado para o quiz, com status do gatilho de Lead.

**Layout esperado:**
```
┌─────────────────────────────────────────────────────────┐
│ 📡 Meta Pixel + CAPI                                    │
│ Como os eventos são disparados durante o quiz           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Fluxo de eventos:                                      │
│                                                         │
│  1. ViewContent ──────── Welcome screen exibida         │
│  2. QuizStarted ──────── Usuário clica "Começar"        │
│  3. Lead ─────────────── 📡 Campo: "Qual seu telefone?" │
│     └─ [badge verde: Configurado]                       │
│  4. SubmitApplication ── Quiz finalizado                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ℹ️  Para configurar o gatilho do Lead, vá para   │   │
│  │    a aba Editor e ative "📡 Gatilho de Lead"     │   │
│  │    em um campo de captura (telefone ou email).   │   │
│  │                       [Ir para o Editor →]       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  📊 Eventos adicionais por resultado                    │
│  Configuráveis na aba Resultados, campo por outcome.    │
│  [Ver Resultados →]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**ACs do AC7:**
- [x] Seção "Fluxo de Eventos" lista os 4 eventos em ordem (ViewContent → QuizStarted → Lead → SubmitApplication)
- [x] Linha do evento Lead mostra o título do campo com `options.triggerLeadEvent = true` OR badge laranja "Não configurado"
- [x] Se Lead não configurado: exibir card com CTA "Configurar no Editor" → navega para `/quiz/:id/editor`
- [x] CTA "Ir para o Editor →" e "Ver Resultados →" navegam corretamente
- [x] Componente `QuizIntegracoesPage.tsx` (max 120 linhas)
- [x] Carrega `fields` do quiz via `GET /api/quizzes/:id/fields` para detectar o campo gatilho

---

## Definition of Done

- [x] `QuizShell.tsx` criado e funcional
- [x] 5 sub-rotas funcionando
- [x] Topbar com título, badge, botões de ação
- [x] Publish/Unpublish funcionam e atualizam badge
- [x] Redirect de `/quiz/:id` para `/quiz/:id/editor`
- [x] `QuizIntegracoesPage` com fluxo de 4 eventos e status do gatilho de Lead
- [x] TypeScript sem `any`

## File List

- `frontend/src/features/quiz/hooks/useQuiz.ts`
- `frontend/src/features/quiz/components/QuizShell/QuizShell.tsx`
- `frontend/src/features/quiz/components/QuizEditorPage/QuizEditorPage.tsx`
- `frontend/src/features/quiz/components/QuizOutcomesPage/QuizOutcomesPage.tsx`
- `frontend/src/features/quiz/components/QuizIntegracoesPage/QuizIntegracoesPage.tsx`
- `frontend/src/features/quiz/components/QuizRespostasPage/QuizRespostasPage.tsx`
- `frontend/src/features/quiz/components/QuizAnalyticsPage/QuizAnalyticsPage.tsx`
- `frontend/src/features/quiz/index.ts`
- `frontend/src/App.tsx`

## Dev Agent Record

- Criado shell `/quiz/:id` com topbar, edição inline de título, status, publicar/despublicar, ver quiz e copiar link.
- Criadas 5 tabs roteadas: Editor, Resultados, Integrações, Respostas e Analytics.
- Implementada `QuizIntegracoesPage` com fluxo ViewContent → QuizStarted → Lead → SubmitApplication e status do gatilho de Lead lido dos fields.
- Verificação executada: `cd frontend && npx tsc --noEmit`.
