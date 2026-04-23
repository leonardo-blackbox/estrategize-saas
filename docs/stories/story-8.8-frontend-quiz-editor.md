# Story 8.8 — Frontend: Quiz Editor (Campos + Score por Opção)

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.8
**Status:** Ready for Review
**Branch:** feat/8.8-quiz-editor
**Wave:** 5
**Depends on:** Story 8.7 (shell), Story 8.5 (field types)

---

## User Story

> **Como** criador de quiz,
> **Quero** adicionar os 6 novos tipos de campo ao quiz e configurar pontos por resposta,
> **Para** criar um quiz com scoring funcional e preview em tempo real.

---

## Contexto Técnico

**O editor de quiz reutiliza o editor de Aplicações (EditorContent, LivePreview, FieldOptions).**
- Verificar como o editor de Aplicações é invocado e replicar para o quiz
- A maioria dos componentes de editor podem ser importados diretamente

**Novos componentes a criar (APENAS os novos tipos de campo):**

Para o LivePreview (preview no editor):
```
frontend/src/features/aplicacoes/components/LivePreview/fields/
├── ImageChoicePreview/
├── RatingPreview/
├── OpinionScalePreview/
├── YesNoPreview/
├── RankingPreview/
└── SliderPreview/
```

Para o painel de opções (config no editor):
```
frontend/src/features/aplicacoes/components/FieldOptions/
├── FieldOptionsImageChoice/
├── FieldOptionsRating/
├── FieldOptionsOpinionScale/
├── FieldOptionsYesNo/
├── FieldOptionsRanking/
└── FieldOptionsSlider/
```

**Score por opção:** Input "Pontos" adicionado ao painel de opções de multiple_choice, image_choice e yes_no.

---

## Acceptance Criteria

### AC1 — `QuizEditorPage` substitui o stub da Story 8.7
- [x] `QuizEditorPage` renderiza o editor de campos (3 painéis: lista campos / preview / opções)
- [x] Reutiliza `EditorContent` de Aplicações ou componente equivalente com `quizId` passado
- [x] Salva campos via `PUT /api/quizzes/:id/fields` (com debounce 1.5s)
- [x] Todos os 11 tipos originais + 6 novos aparecem na lista de tipos

### AC2 — LivePreview para cada novo tipo

**`ImageChoicePreview`:**
- [x] Grid 2x2 de cards com placeholder de imagem cinza + texto da opção
- [x] Colunas configuráveis (2 ou 3)

**`RatingPreview`:**
- [x] Row de estrelas (⭐) ou números conforme `style`
- [x] Max configurável (5 ou 10 itens)

**`OpinionScalePreview`:**
- [x] Row de botões numerados de `min` a `max`
- [x] Labels nas extremidades (labelMin e labelMax)

**`YesNoPreview`:**
- [x] 2 cards lado a lado com ícone + texto configurados

**`RankingPreview`:**
- [x] Lista ordenada com handle de drag mockup (estático no preview)

**`SliderPreview`:**
- [x] Barra de range slider mockup com valor mínimo e máximo + unidade

### AC3 — FieldOptions para cada novo tipo

**`FieldOptionsImageChoice`:**
- [x] Lista de opções com: input de label, input de URL de imagem (ou upload), input numérico "Pontos" (0-10)
- [x] Botão "Adicionar opção" (max 8 opções)
- [x] Botão remover opção (min 2 opções)
- [x] Toggle de colunas (2 ou 3)

**`FieldOptionsRating`:**
- [x] Select: Max (5 ou 10)
- [x] Select: Estilo (⭐ Estrelas / 🔢 Números / 😊 Emojis)
- [x] Inputs: Label mínimo e máximo

**`FieldOptionsOpinionScale`:**
- [x] Inputs numéricos: Min (default 0), Max (default 10)
- [x] Inputs de texto: Label mínimo e máximo

**`FieldOptionsYesNo`:**
- [x] Inputs: Texto "Sim" e "Não"
- [x] Inputs: Ícone "Sim" e "Não" (emoji text input, max 2 chars)
- [x] Inputs numéricos: Pontos para Sim e Pontos para Não (0-10)

**`FieldOptionsRanking`:**
- [x] Lista editável de itens (label, reordenável, removível)
- [x] Botão "Adicionar item" (max 8 itens, min 2)

**`FieldOptionsSlider`:**
- [x] Inputs numéricos: Min, Max, Step
- [x] Input texto: Unidade (R$, %, anos, etc.)

### AC4 — Score por opção em `multiple_choice` e `image_choice` e `yes_no`
- [x] No painel de opções de `multiple_choice` existente: adicionar input numérico "Pontos" (0-10) ao lado de cada opção
- [x] Valor salvo em `choices[n].scoreValue` no JSONB `options`
- [x] Input desabilitado ou oculto para campos que não são de scoring (short_text, email, etc.)

### AC5 — Persistência
- [x] Edições nos campos de opções disparam auto-save (debounce 1.5s)
- [x] Indicador de "Salvando..." e "Salvo" no topbar (mesmo padrão de Aplicações)
- [x] Tipos novos salvam corretamente via `PUT /api/quizzes/:id/fields`

### AC6 — Gatilho de Lead por campo (📡)

O criador do quiz precisa marcar exatamente qual campo dispara o evento `Lead` para o Meta Pixel. Quando o respondente avança além desse campo, os dados já capturados (nome, email, telefone) são enviados ao servidor e repassados ao Facebook.

**No painel de opções de qualquer campo (`FieldOptions`):**
- [x] Toggle "📡 Gatilho de Lead" com descrição: "Quando o usuário avançar deste campo, enviamos os dados capturados ao Meta como evento Lead"
- [x] Valor armazenado em `field.options.triggerLeadEvent: boolean`
- [x] Somente **um** campo por quiz pode ter `triggerLeadEvent = true` — ao ativar em um campo, desativa automaticamente nos demais (lógica no hook de save)
- [x] Toggle recomendado para campos de captura: badge discreto "Recomendado" quando field_type é `phone` ou `email`

**Na lista de campos (`FieldsList`):**
- [x] Campo com `triggerLeadEvent = true` exibe ícone 📡 à direita do título
- [x] Tooltip no ícone: "Gatilho de Lead Meta configurado neste campo"

**Warning no editor:**
- [x] Se nenhum campo tem `triggerLeadEvent = true`: exibir banner sutil no topo do editor — "📡 Nenhum gatilho de Lead configurado. O evento Lead não será disparado."
- [x] Banner tem link "Configurar" que sugere o primeiro campo de tipo `phone` ou `email`

---

## Definition of Done

- [x] `QuizEditorPage` funcional com 3 painéis
- [x] Todos os 6 novos tipos têm preview + options panel
- [x] Score por opção configurável em multiple_choice, image_choice, yes_no
- [x] Auto-save funcionando (debounce + indicador)
- [x] Toggle 📡 Gatilho de Lead: salvo em `options.triggerLeadEvent`, ícone na lista, unicidade garantida
- [x] Editor de Aplicações original NÃO tem regressões
- [x] TypeScript sem `any`, limites de linhas respeitados

## File List

- `frontend/src/features/quiz/components/QuizEditorPage/QuizEditorPage.tsx`
- `frontend/src/features/quiz/components/QuizEditorPage/types.ts`
- `frontend/src/features/quiz/components/QuizEditorPage/quiz-editor.helpers.ts`
- `frontend/src/features/quiz/components/QuizEditorPage/parts/QuizFieldsList.tsx`
- `frontend/src/features/quiz/components/QuizEditorPage/parts/QuizLivePreview.tsx`
- `frontend/src/features/quiz/components/QuizEditorPage/parts/QuizFieldOptions.tsx`

## Dev Agent Record

- Substituído stub do editor por editor próprio de quiz com lista de campos, preview e painel de opções.
- Adicionados previews e opções para `image_choice`, `rating`, `opinion_scale`, `yes_no`, `ranking` e `slider`.
- Implementado score por opção para `multiple_choice`, `image_choice` e `yes_no`.
- Implementado toggle único `📡 Gatilho de Lead`, ícone na lista e banner de warning com CTA de configuração.
- Mantido isolamento: nenhum arquivo em `frontend/src/features/aplicacoes/` foi modificado.
- Verificação executada: `cd frontend && npx tsc --noEmit`.
