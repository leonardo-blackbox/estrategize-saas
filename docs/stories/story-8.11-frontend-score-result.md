# Story 8.11 — Frontend: Score Reveal + Result Screen

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.11
**Status:** Ready for Review
**Branch:** feat/8.11-score-reveal-result
**Wave:** 6
**Depends on:** Story 8.10 (quiz público player)

---

## User Story

> **Como** respondente,
> **Quero** ver meu score animado e uma tela de resultado personalizada com próximos passos,
> **Para** entender onde estou e o que devo fazer a seguir.

---

## Contexto Técnico

**Adicionado à feature:** `frontend/src/features/quiz-publico/components/`
- `QuizScoreReveal/` — animação do score
- `QuizResultScreen/` — tela de resultado por outcome

**State machine:** após `submitting` → `score_reveal` (1.5s animação) → `result`

---

## Acceptance Criteria

### AC1 — `QuizScoreReveal`

- [x] Círculo SVG animado (stroke-dashoffset de 0 até score%) — duração 1.5s, easing `ease-out`
- [x] No centro do círculo: número do score animado de 0 até valor final (counter animation)
- [x] Texto abaixo: "Calculando seu resultado..."
- [x] Após 1.5s: fade-out da tela de reveal, fade-in do `QuizResultScreen`
- [x] Funciona para qualquer score 0-100
- [x] Implementar com CSS animations (não requires Framer Motion obrigatório)
- [x] Max 80 linhas

**Referência SVG para círculo animado:**
```jsx
// Círculo com stroke-dashoffset controlado por CSS animation
const circumference = 2 * Math.PI * 45; // r=45
const offset = circumference - (score / 100) * circumference;
// style: { strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s ease-out' }
```

### AC2 — `QuizResultScreen` — estrutura

- [x] Background: `background_color` do outcome OU `theme_config.backgroundColor`
- [x] Se `image_url` configurado: imagem de fundo com overlay escuro (rgba(0,0,0,0.5))
- [x] Logo do quiz no topo (se `theme_config.logoUrl` configurado)
- [x] Score display: badge discreto "Seu score: 68%" (menor, secundário)
- [x] **Título do outcome** (grande, destaque visual)
- [x] **Descrição do outcome** (texto, markdown simples suportado se possível)
- [x] **Botão CTA** (condicional):
  - `cta_type = 'none'`: sem botão CTA
  - `cta_type = 'url'`: botão com `cta_label`, abre `cta_url` em nova aba
  - `cta_type = 'whatsapp'`: botão com `cta_label`, abre `https://wa.me/55{numero}?text=Olá!%20Vi%20meu%20resultado%20no%20quiz%20e%20quero%20saber%20mais.`
- [x] **Botão "Compartilhar quiz"**: copia `/q/:slug` para clipboard, mostra toast "Link copiado!"
- [x] Max 120 linhas

### AC3 — Fallback sem outcome
- [x] Se score não mapeia nenhum outcome (outcome = null do backend):
  - Exibe tela de agradecimento genérica usando `settings.thankYouTitle` e `settings.thankYouMessage`
  - Sem botão CTA (ou botão "Refazer quiz" que recarrega a página)

### AC4 — WhatsApp deeplink
- [x] Número salvo sem formatação (ex: "27999999999")
- [x] Deeplink: `https://wa.me/55${numero}?text=Ol%C3%A1!%20Vi%20meu%20resultado%20no%20quiz%20e%20quero%20saber%20mais.`
- [x] Abre em nova aba (target="_blank", rel="noopener noreferrer")

### AC5 — Responsivo
- [x] Funcional em 375px
- [x] Título grande mas sem overflow
- [x] Botões com touch target 44x44px

### AC6 — Acessibilidade básica
- [x] Título do resultado em `<h1>`
- [x] Botão CTA com aria-label descritivo
- [x] Cores de botão com contraste adequado (texto legível sobre background do outcome)

---

## Definition of Done

- [x] `QuizScoreReveal` com animação SVG circular funcionando
- [x] `QuizResultScreen` exibe conteúdo correto por outcome
- [x] CTA URL e WhatsApp funcionam corretamente
- [x] Fallback sem outcome exibe mensagem de agradecimento
- [x] Responsivo em 375px
- [x] TypeScript sem `any`
- [x] Flow E2E completo: responder quiz → ver score animado → ver resultado → clicar CTA

## File List

- `frontend/src/features/quiz-publico/components/QuizScoreReveal/QuizScoreReveal.tsx`
- `frontend/src/features/quiz-publico/components/QuizResultScreen/QuizResultScreen.tsx`
- `frontend/src/features/quiz-publico/components/QuizPublicoAggregator/QuizPublicoAggregator.tsx`

## Dev Agent Record

- Implementado `QuizScoreReveal` com SVG circular animado e contador de score por 1.5s.
- Implementado `QuizResultScreen` com outcome, score, descrição, background/capa, CTA URL/WhatsApp, fallback sem outcome e compartilhamento.
- Integrado fluxo score_reveal → result no player público.
- Verificação executada: `cd frontend && npx tsc --noEmit`.
