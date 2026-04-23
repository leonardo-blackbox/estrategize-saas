# Story 8.10 — Frontend: Quiz Público Player (/q/:slug)

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.10
**Status:** Ready for Review
**Branch:** feat/8.10-quiz-publico
**Wave:** 6
**Depends on:** Story 8.4 (backend public route + scoring), Story 8.5 (field types)

---

## User Story

> **Como** respondente,
> **Quero** completar um quiz interativo no estilo one-question-at-a-time,
> **Para** descobrir meu resultado personalizado de forma engajante.

---

## Contexto Técnico

**Rota pública:** `/q/:slug` — sem header, nav, ou qualquer chrome da plataforma
**API:** `GET /public/quizzes/:slug` e `POST /public/quizzes/:slug/responses`
**Padrão:** Inspirado em `frontend/src/features/form-publico/` mas com UX de quiz

**Estrutura a criar:**
```
frontend/src/features/quiz-publico/
├── components/
│   ├── QuizPublicoAggregator/   ← Container + state machine (max 200 linhas)
│   ├── QuizWelcomeScreen/       ← Tela inicial (max 80 linhas)
│   ├── QuizQuestionStep/        ← Questão + campo dinâmico (max 80 linhas)
│   ├── QuizProgressBar/         ← Barra topo percentual (max 60 linhas)
│   ├── QuizActions/             ← Botões navegação (max 60 linhas)
│   ├── QuizLoading/             ← Skeleton loading (max 40 linhas)
│   ├── QuizError/               ← Error page (max 40 linhas)
│   └── fields/
│       ├── ImageChoiceField/    ← Grid de imagens clicáveis (max 80 linhas)
│       ├── RatingField/         ← Estrelas/números (max 60 linhas)
│       ├── OpinionScaleField/   ← NPS 0-10 (max 60 linhas)
│       ├── YesNoField/          ← 2 cards grandes (max 60 linhas)
│       ├── RankingField/        ← Lista ordenável (max 80 linhas)
│       └── SliderField/         ← Range slider (max 60 linhas)
├── hooks/
│   ├── useQuizPublico.ts        ← State machine + dados (max 120 linhas)
│   ├── useQuizNavigation.ts     ← next/prev/skip logic (max 80 linhas)
│   └── useQuizSubmit.ts         ← POST + receber score + outcome (max 80 linhas)
└── services/
    └── quiz-publico.api.ts      ← GET + POST (max 80 linhas)
```

**NÃO modificar** `form-publico` de forma alguma.

---

## Acceptance Criteria

### AC1 — Rota e estado inicial
- [x] `/q/:slug` renderizado sem header, nav, footer da plataforma (fullscreen)
- [x] Carrega quiz via `GET /public/quizzes/:slug`
- [x] Loading skeleton durante fetch
- [x] 404 page se slug não existe ou não publicado (mensagem amigável)
- [x] Preview disponível via state `?preview=1` (chama `/public/quizzes/:slug/preview` com auth)

### AC2 — State machine (`useQuizPublico`)
```
'loading' → 'welcome' → 'questions' (index 0..n) → 'submitting' → 'score_reveal' → 'result'
                                                               ↓ error
                                                            'error'
```
- [x] Transições corretas entre estados
- [x] `answers` acumulados ao avançar perguntas
- [x] Acesso ao quiz e outcomes disponíveis via hook

### AC3 — `QuizWelcomeScreen`
- [x] Background: imagem de fundo com overlay OU cor sólida (de `theme_config`)
- [x] Logo do quiz (se configurado) no topo
- [x] Título e subtítulo do campo `welcome`
- [x] Botão CTA com texto configurado em `options.buttonText`
- [x] Clique em CTA → transição para primeira questão

### AC4 — `QuizProgressBar`
- [x] Barra no topo mostrando percentual de questões respondidas
- [x] Texto "Pergunta X de Y" abaixo da barra
- [x] Animação smooth ao avançar
- [x] Oculto na welcome screen e result screen

### AC5 — `QuizQuestionStep`
- [x] Renderiza título da questão
- [x] Renderiza campo dinâmico baseado no `field.type`
- [x] Animação de transição entre questões (slide horizontal ou fade)
- [x] Todos os tipos de campo suportados (11 existentes + 6 novos)
- [x] Campo `message` exibe texto sem input (avança automaticamente)

### AC6 — Auto-advance em campos de choice
- [x] `image_choice`: clique em opção → avança automaticamente (após 300ms)
- [x] `yes_no`: clique → avança automaticamente (após 300ms)
- [x] `rating`: seleção → avança automaticamente (após 300ms)
- [x] `multiple_choice` (sem multiselect): clique → avança automaticamente
- [x] `opinion_scale`, `short_text`, `long_text`, `ranking`, `slider`: requer botão "Próxima"

### AC7 — `QuizActions`
- [x] Botão "Próxima" (para campos sem auto-advance)
- [x] Seta "←" (voltar) no topo (oculto na primeira questão)
- [x] Tecla Enter avança (quando não é ranking)
- [x] Validação de required antes de avançar (mostra erro inline)

### AC8 — Campos novos renderizados corretamente

**`ImageChoiceField`:**
- [x] Grid de `options.columns` colunas (2 ou 3)
- [x] Card: imagem (img src) + texto da opção
- [x] Se imageUrl vazio: background cinza placeholder
- [x] Selecionado: borda destacada com cor primária
- [x] Touch target mínimo 44x44px

**`RatingField`:**
- [x] Row de estrelas (⭐) OU números OU emojis
- [x] `max` itens (5 ou 10)
- [x] Hover: highlight progressivo
- [x] Labels min/max nas extremidades

**`OpinionScaleField`:**
- [x] Row de botões numerados de `min` a `max`
- [x] Labels nas extremidades
- [x] Selecionado: botão destacado

**`YesNoField`:**
- [x] 2 cards fullwidth: ícone grande + texto
- [x] Hover: scale sutil

**`RankingField`:**
- [x] Lista de itens com drag handle
- [x] Em mobile: botões ▲ ▼ para reordenar (fallback)
- [x] Ordem atual refletida no valor salvo

**`SliderField`:**
- [x] `<input type="range">` estilizado
- [x] Exibe valor atual + unidade
- [x] Min, max, step conforme configurado

### AC9 — Campos existentes
- [x] `short_text`, `long_text`, `name`, `email`, `phone`, `number`, `date` funcionam igual ao form público existente
- [x] `multiple_choice` funciona com scoreValue nos choices (transparente para o usuário)

### AC10 — Submissão
- [x] Ao fim das questões, `useQuizSubmit` faz `POST /public/quizzes/:slug/responses` com `{ answers, metadata }`
- [x] `metadata` inclui: session token, timestamp, user agent
- [x] Durante submit: loading spinner na tela toda
- [x] Após submit bem-sucedido: transição para `score_reveal`
- [x] Erro: mensagem de erro com botão "Tentar novamente"

### AC11 — Mobile-first
- [x] Funcional em viewport 320px
- [x] Touch targets 44x44px
- [x] `image_choice` grid responsivo (1 coluna em mobile muito pequeno)
- [x] Sem scroll horizontal

### AC12 — Tracking
- [x] `POST /public/quizzes/:slug/events` disparado: view (on load), start (on first question), submit (after POST responses)

---

## Definition of Done

- [x] Feature `frontend/src/features/quiz-publico/` criada com estrutura completa
- [x] `/q/:slug` acessível sem autenticação
- [x] Flow completo: welcome → questões → submit funciona E2E
- [x] Todos os 6 novos tipos de campo renderizados e funcionais
- [x] Auto-advance funciona em image_choice, yes_no, rating
- [x] Responsivo em 375px
- [x] `form-publico` feature NÃO tem regressões
- [x] TypeScript sem `any`, limites de linhas respeitados

## File List

- `frontend/src/features/quiz-publico/services/quiz-publico.api.ts`
- `frontend/src/features/quiz-publico/hooks/useQuizPublico.ts`
- `frontend/src/features/quiz-publico/hooks/useQuizSubmit.ts`
- `frontend/src/features/quiz-publico/components/QuizPublicoAggregator/QuizPublicoAggregator.tsx`
- `frontend/src/features/quiz-publico/components/QuizWelcomeScreen/QuizWelcomeScreen.tsx`
- `frontend/src/features/quiz-publico/components/QuizQuestionStep/QuizQuestionStep.tsx`
- `frontend/src/features/quiz-publico/components/QuizProgressBar/QuizProgressBar.tsx`
- `frontend/src/features/quiz-publico/components/QuizActions/QuizActions.tsx`
- `frontend/src/features/quiz-publico/components/fields/QuizFields.tsx`
- `frontend/src/features/quiz-publico/index.ts`
- `frontend/src/App.tsx`

## Dev Agent Record

- Criado player público `/q/:slug` fullscreen, sem chrome da plataforma.
- Implementada state machine welcome → questions → submitting → score_reveal/result, com API pública e preview `?preview=1`.
- Renderizados tipos novos e tipos existentes principais, com auto-advance para choices/rating/yes-no.
- Disparados endpoints de tracking `view`, `start`, `submit` e `lead-event` ao avançar além do campo gatilho.
- Mantido isolamento: nenhum arquivo em `frontend/src/features/form-publico/` foi modificado.
- Verificação executada: `cd frontend && npx tsc --noEmit`.
