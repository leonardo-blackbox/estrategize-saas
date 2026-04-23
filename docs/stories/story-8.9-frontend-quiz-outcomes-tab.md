# Story 8.9 — Frontend: Aba Resultados (Quiz Outcomes)

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.9
**Status:** Ready for Review
**Branch:** feat/8.9-quiz-outcomes-tab
**Wave:** 5
**Depends on:** Story 8.3 (backend outcomes), Story 8.7 (quiz shell)

---

## User Story

> **Como** criador de quiz,
> **Quero** configurar múltiplas telas de resultado com CTA diferentes por tier de score,
> **Para** personalizar a experiência de cada lead com base no seu desempenho.

---

## Contexto Técnico

**Rota:** `/quiz/:id/resultados` → `QuizOutcomesPage` (substitui o stub da Story 8.7)

**Estrutura a criar:**
```
frontend/src/features/quiz/components/QuizOutcomesPage/
├── QuizOutcomesPage.tsx    ← Agregador (max 200 linhas)
├── OutcomeCard.tsx         ← Card de outcome na lista (max 80 linhas)
├── OutcomeEditorPanel.tsx  ← Formulário de edição (max 120 linhas)
├── ScoreRangeBar.tsx       ← Visualização dos ranges (max 80 linhas)
└── index.ts
```

**API:** `GET /api/quizzes/:id/outcomes` e `PUT /api/quizzes/:id/outcomes`

**Padrão de defaults:** Ao criar quiz pela primeira vez, inserir 3 outcomes padrão:
- "Iniciante" (0-40%)
- "Em Desenvolvimento" (41-70%)  
- "Pronto para o Próximo Nível" (71-100%)

---

## Acceptance Criteria

### AC1 — `QuizOutcomesPage.tsx` — Agregador
- [x] Carrega outcomes via `GET /api/quizzes/:id/outcomes`
- [x] Lista outcomes como cards (`OutcomeCard`) com range visual e título
- [x] Botão "Adicionar resultado" (disabled quando já há 10 outcomes)
- [x] Ao clicar em um outcome, abre `OutcomeEditorPanel` ao lado (layout split)
- [x] Renderiza `ScoreRangeBar` no topo mostrando ranges configurados
- [x] Max 200 linhas

### AC2 — Defaults ao entrar na aba pela primeira vez
- [x] Se lista de outcomes está vazia (quiz novo), cria automaticamente 3 outcomes padrão via `PUT /api/quizzes/:id/outcomes`
- [x] Outcomes padrão:
  ```
  { outcome_key: 'iniciante',    title: 'Iniciante',                    score_min: 0,  score_max: 40,  cta_type: 'none' }
  { outcome_key: 'intermediario', title: 'Em Desenvolvimento',           score_min: 41, score_max: 70,  cta_type: 'none' }
  { outcome_key: 'avancado',     title: 'Pronto para o Próximo Nível',  score_min: 71, score_max: 100, cta_type: 'none' }
  ```

### AC3 — `OutcomeCard.tsx`
- [x] Exibe: barra colorida de range (ex: "0% – 40%"), título do outcome, badge do cta_type
- [x] Botão "Editar" → seleciona este outcome no editor
- [x] Botão "Excluir" → remove com confirmação (PUT /outcomes sem este item)
- [x] Max 80 linhas

### AC4 — `ScoreRangeBar.tsx`
- [x] Barra horizontal 0-100% dividida visualmente por cores dos outcomes
- [x] Cada segmento tem tooltip com título ao hover
- [x] Warning visual se há gaps (score não coberto por nenhum outcome)
- [x] Warning visual se há sobreposição entre ranges
- [x] Max 80 linhas

### AC5 — `OutcomeEditorPanel.tsx`
- [x] Campos editáveis:
  - Título (text input, obrigatório)
  - Descrição (textarea, opcional)
  - Score mínimo e máximo (number inputs, 0-100)
  - Cor de fundo (color picker HTML nativo `<input type="color">`)
  - URL de imagem de fundo (text input, opcional)
  - Tipo de CTA: select (Nenhum / URL redirect / WhatsApp)
  - URL/número (condicional ao tipo de CTA):
    - URL redirect: input de URL completa (https://...)
    - WhatsApp: input de número BR (ex: 27999999999, sem formatação)
  - Label do botão CTA (text input, opcional, default "Quero saber mais")
  - **Seção "📡 Evento Meta adicional" (novo):**
    - Toggle "Disparar evento Meta ao exibir este resultado"
    - Se ativo: select com opções predefinidas: `Lead`, `Contact`, `Schedule`, `ViewContent`, `Purchase`, `Custom`
    - Se `Custom` selecionado: input de texto livre para nome do evento
    - Valor salvo em `outcome.pixel_event_name` (null quando toggle desligado)
    - Hint: "Este evento é disparado quando o respondente vê este resultado, além do SubmitApplication."
- [x] Auto-save com debounce 1.5s ao editar qualquer campo
- [x] Indicador "Salvando..." / "Salvo"
- [x] Validação: score_min < score_max, ranges válidos
- [x] Max 150 linhas (ajustado pela seção de tracking)

### AC6 — Persistência
- [x] `PUT /api/quizzes/:id/outcomes` chamado com o array completo atualizado a cada mudança
- [x] Sucesso e erro tratados com toast

---

## Definition of Done

- [x] `QuizOutcomesPage` funcional em `/quiz/:id/resultados`
- [x] 3 outcomes padrão criados automaticamente para quizzes novos
- [x] Editor de outcome salva todas as configurações
- [x] `ScoreRangeBar` mostra ranges visualizados
- [x] CTA WhatsApp: número salvo sem formatação
- [x] Evento Meta por outcome: toggle + select funcional, salvo em `outcome.pixel_event_name`
- [x] TypeScript sem `any`, limites de linhas respeitados

## File List

- `frontend/src/features/quiz/components/QuizOutcomesPage/QuizOutcomesPage.tsx`
- `frontend/src/features/quiz/components/QuizOutcomesPage/OutcomeCard.tsx`
- `frontend/src/features/quiz/components/QuizOutcomesPage/OutcomeEditorPanel.tsx`
- `frontend/src/features/quiz/components/QuizOutcomesPage/ScoreRangeBar.tsx`

## Dev Agent Record

- Implementada aba Resultados com defaults automáticos, lista de outcomes, editor lateral e salvamento debounce.
- Adicionado `ScoreRangeBar` com warning de gaps/sobreposição.
- Implementada seção `📡 Evento Meta adicional` salvando `pixel_event_name` com opções predefinidas e custom.
- Verificação executada: `cd frontend && npx tsc --noEmit`.
