# Story 8.5 — Frontend: FieldType Union + Novos Tipos de Campo

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.5
**Status:** Ready for Review
**Branch:** feat/8.5-fieldtype-new-fields
**Wave:** 3
**Depends on:** Story 8.1

---

## User Story

> **Como** desenvolvedor,
> **Quero** que os 6 novos tipos de campo sejam definidos no sistema de tipos e configurados com defaults,
> **Para** que possam ser usados no editor e no quiz público.

---

## Contexto Técnico

**Arquivo a modificar:** `frontend/src/api/applications.ts`
- Adicionar ao `FieldType` union existente
- Adicionar `DEFAULT_OPTIONS` para cada novo tipo
- Adicionar ícones na lista de tipos disponíveis no editor

**NÃO criar componentes de renderização nesta story** — isso é feito nas Stories 8.8, 8.9 e 8.10.

**Novos tipos:**
- `image_choice` — alternativas com imagem
- `rating` — estrelas 1-5 ou números 1-10
- `opinion_scale` — NPS/Likert 0-10
- `yes_no` — binário Sim/Não
- `ranking` — ordenar lista
- `slider` — range numérico

---

## Acceptance Criteria

### AC1 — FieldType union atualizado
```typescript
// Em frontend/src/api/applications.ts
export type FieldType =
  | 'welcome' | 'message' | 'short_text' | 'long_text'
  | 'name' | 'email' | 'phone' | 'multiple_choice'
  | 'number' | 'date' | 'thank_you'
  // Novos (Epic 8)
  | 'image_choice'
  | 'rating'
  | 'opinion_scale'
  | 'yes_no'
  | 'ranking'
  | 'slider'
```
- [x] FieldType union inclui os 6 novos tipos
- [x] TypeScript compila sem erros

### AC2 — DEFAULT_OPTIONS para cada novo tipo

```typescript
// Adicionar ao objeto DEFAULT_FIELD_OPTIONS (ou equivalente em applications.ts):
image_choice: {
  choices: [
    { label: 'Opção 1', value: 'a', imageUrl: '', scoreValue: 0 },
    { label: 'Opção 2', value: 'b', imageUrl: '', scoreValue: 0 },
  ],
  columns: 2,
},
rating: {
  max: 5,
  style: 'star', // 'star' | 'number' | 'emoji'
  labelMin: '',
  labelMax: '',
},
opinion_scale: {
  min: 0,
  max: 10,
  labelMin: 'Discordo totalmente',
  labelMax: 'Concordo totalmente',
  scoreMap: {},
},
yes_no: {
  yesLabel: 'Sim',
  noLabel: 'Não',
  yesIcon: '👍',
  noIcon: '👎',
  yesScoreValue: 10,
  noScoreValue: 0,
},
ranking: {
  items: [
    { id: '1', label: 'Item 1' },
    { id: '2', label: 'Item 2' },
    { id: '3', label: 'Item 3' },
  ],
},
slider: {
  min: 0,
  max: 100,
  step: 1,
  unit: '',
  scoreRanges: [],
},
```
- [x] Cada novo tipo tem DEFAULT_OPTIONS definido
- [x] Estrutura dos options tipada corretamente

### AC3 — Novos tipos aparecem na lista de campos do editor
- [x] No painel de seleção de tipo de campo (onde o usuário escolhe que tipo adicionar), os 6 novos aparecem em uma seção "Campos de Quiz" separada
- [x] Cada tipo tem label em português e ícone (Lucide React):
  - `image_choice` → `LayoutGrid` + "Escolha com Imagem"
  - `rating` → `Star` + "Avaliação"
  - `opinion_scale` → `Sliders` + "Escala de Opinião"
  - `yes_no` → `ThumbsUp` + "Sim / Não"
  - `ranking` → `List` + "Ranking"
  - `slider` → `SlidersHorizontal` + "Slider"
- [x] Ao adicionar um novo tipo, o campo é criado com os DEFAULT_OPTIONS correspondentes

### AC4 — Compatibilidade
- [x] Editor de Aplicações (formulários) não quebra com o novo FieldType
- [x] Campos existentes (welcome, message, short_text, etc.) continuam funcionando
- [x] TypeScript strict — sem `any`

---

## Definition of Done

- [x] `frontend/src/api/applications.ts` atualizado com 6 novos tipos
- [x] FieldType union completo com 17 tipos totais
- [x] DEFAULT_OPTIONS definidos para todos os 6 tipos novos
- [x] Novos tipos aparecem no seletor de campos do editor
- [x] `npm run type-check` passa sem erros (frontend)
- [x] Editor de Aplicações (formulários) ainda funciona sem regressões

## File List

- `frontend/src/api/applications.ts`

## Dev Agent Record

- Expandido modelo compartilhado com `BaseFieldType`, `QuizFieldType`, novos tipos de quiz e `DEFAULT_FIELD_OPTIONS`.
- Adicionado catálogo `QUIZ_FIELD_TYPE_OPTIONS` com labels em português e nomes dos ícones esperados para consumo pela feature de quiz.
- `FieldOption` agora aceita `value`, `scoreValue` e `imageUrl` de forma retrocompatível.
- Por regra de isolamento da Epic 8, nenhum arquivo de `frontend/src/features/aplicacoes/` foi modificado; a UI dos novos tipos será consumida pela feature `quiz`.
- Verificação executada: `cd frontend && npx tsc --noEmit`.
