# Design Spec — Módulo Consultorias (Central da Cliente)

> **Versão:** 1.0 | **Data:** 2026-03-17
> **Stack:** React 18 + TypeScript + Tailwind CSS + Framer Motion
> **Gerado por:** ui-ux-pro-max skill + design system Iris v2

---

## 1. Filosofia de design

O módulo **não é um CRM**. É uma **Central de Comando Viva** — alta densidade informacional, design premium, sensação de superpoder para a consultora.

Princípios:
- **Densidade com elegância** — muita informação, zero poluição
- **Contexto sempre visível** — a consultora nunca fica perdida
- **IA como identidade** — a IA Dedicada é feature de destaque, com visual próprio
- **Dark-first** — tudo desenhado primeiro para dark mode (o sistema já é dark-first)
- **Ação sempre ao alcance** — quick actions em cards, CTAs contextuais, nunca mais de 2 cliques

---

## 2. Tokens de design específicos do módulo

Todos definidos em `frontend/src/index.css` na seção `/* ── Consultorias Module ── */`.

### Cores principais

| Token | Valor oklch | Uso |
|-------|-------------|-----|
| `--consulting-iris` | `oklch(0.58 0.24 295)` | Brand roxo do módulo |
| `--consulting-ai-accent` | `oklch(0.62 0.28 300)` | Elementos de IA |
| `--consulting-ai-gradient` | roxo→magenta | Badges e headers de IA |

### Fases (badges semânticos)

| Fase | Token cor | Token fundo |
|------|-----------|-------------|
| Onboarding | `--phase-onboarding` (azul suave) | `--phase-onboarding-bg` |
| Diagnóstico | `--phase-diagnosis` (violeta) | `--phase-diagnosis-bg` |
| Entrega | `--phase-delivery` (âmbar) | `--phase-delivery-bg` |
| Implementação | `--phase-implementation` (verde) | `--phase-implementation-bg` |
| Suporte | `--phase-support` (azul médio) | `--phase-support-bg` |
| Encerrada | `--phase-closed` (cinza azulado) | `--phase-closed-bg` |

### Prioridades

| Nível | Token | Uso |
|-------|-------|-----|
| Critical | `--priority-critical` | Vermelho — ação urgente |
| High | `--priority-high` | Laranja — esta semana |
| Medium | `--priority-medium` | Âmbar — padrão |
| Low | `--priority-low` | Verde — quando possível |

---

## 3. Tipografia

Herda o sistema global da Iris (`--font-sans: SF Pro Display / Inter`). Escalas específicas do módulo:

| Elemento | Tamanho | Peso | Letter-spacing |
|---------|---------|------|----------------|
| Nome da cliente (header) | `text-xl` (20px) | `semibold` (600) | `--tracking-snug` |
| Nome da marca | `text-sm` (13px) | `medium` (500) | `normal` |
| KPI número | `text-2xl` (24px) | `bold` (700) | `--tracking-tight` |
| KPI label | `text-xs` (11px) | `medium` | `--tracking-widest` (uppercase) |
| Card título (consultoria) | `text-sm` (13px) | `semibold` | `normal` |
| Badge texto | `text-xs` (11px) | `medium` | `--tracking-wide` |
| Tab label | `text-xs` (11px) | `medium` | `normal` |
| Insight card texto | `text-sm` (13px) | `regular` | `normal` |
| AI response texto | `text-sm` (13px) | `regular` | `normal` leading 1.6 |

---

## 4. Spacing system

Grid base: **4px**. Tokens de `--space-xs` (4px) até `--space-4xl` (96px).

Padrões do módulo:
- **Card padding:** `16px` (`--space-md`)
- **Card gap na grid:** `12px`
- **Header padding:** `24px` (`--space-lg`)
- **Section gap:** `24px`
- **Tab bar height:** `40px`
- **KPI row gap:** `12px`
- **Insight card padding:** `16px`
- **Quick actions gap:** `8px` (`--space-sm`)

---

## 5. Padrões de componente

### 5.1 PhaseBadge

```tsx
// Padrão visual de badge de fase
<span
  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
  style={{
    color: `var(--phase-${phase})`,
    backgroundColor: `var(--phase-${phase}-bg)`,
  }}
>
  <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--phase-${phase})` }} />
  {phaseLabel}
</span>
```

### 5.2 ConsultancyCard

Layout do card rico na listagem:

```
┌─────────────────────────────────────────────────────┐
│ [Avatar]  NomeDaCliente             [PhaseBadge]    │
│ [Initial] NomeDaMarca · @instagram  [NicheBadge]    │
│                                                      │
│ Progresso da consultoria                            │
│ ████████████░░░░░░░░  65%                           │
│                                                      │
│ Próx. reunião: 20 mar · 14h          Score: ●●●○○   │
│ 3 pendências · Último insight da IA: "..."           │
│                                                      │
│ ── hover: quick actions aparecem ─────────────────  │
│ [Abrir Central]  [+ Reunião]  [Nota]  [IA]          │
└─────────────────────────────────────────────────────┘
```

**CSS base:**
```css
.consultancy-card {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  transition: border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  cursor: pointer;
}
.consultancy-card:hover {
  border-color: var(--consulting-iris-subtle);
  transform: translateY(-1px);
  box-shadow: var(--shadow-card-hover);
}
```

**Framer Motion:**
```tsx
const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
}
```

### 5.3 ProgressBar

```tsx
<div className="relative h-1 rounded-full overflow-hidden"
     style={{ background: 'var(--consulting-progress-track)' }}>
  <motion.div
    className="absolute inset-y-0 left-0 rounded-full"
    style={{ background: 'var(--consulting-iris)' }}
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
  />
</div>
```

### 5.4 KpiCard

```
┌──────────────────────┐
│  ↑ +2 esta semana    │ ← variação (micro)
│                      │
│  12                  │ ← número grande
│  CONSULTORIAS ATIVAS │ ← label uppercase tracking-widest
└──────────────────────┘
```

**Variante por tipo:**
- Ativas: fundo `--kpi-active`, accent `--phase-implementation`
- Onboarding: fundo `--kpi-onboarding`, accent `--phase-onboarding`
- Reuniões: fundo `--kpi-meetings`, accent `--consulting-iris`
- Em risco: fundo `--kpi-risk`, accent `--priority-critical`

### 5.5 InsightCardsStrip (4 cards acima das tabs)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│ GARGALO REAL │ │  PRIORIDADES │ │  PRÓXª REUN. │ │  IA: OPORTUNIDADE    │
│ ─────────────│ │ ─────────────│ │ ─────────────│ │ ─────────────────────│
│ Falta de     │ │ 1. Definir   │ │ Terça 24/03  │ │ Há espaço para       │
│ diferenciação│ │    oferta    │ │ 14h30 • Meet │ │ posicionar como       │
│ comunicada.  │ │ 2. Revisar   │ │ Pauta: Entrga│ │ premium via Google.  │
│              │ │    precif.   │ │              │ │ ✦ IA Dedicada        │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘
   borda vermelha   borda âmbar      borda azul        borda magenta (IA)
```

Cada card tem borda colorida no topo (border-top 2px) com a cor semântica:
- Gargalo: `--insight-bottleneck-border`
- Prioridades: `--insight-priorities-border`
- Próxima reunião: `--insight-meeting-border`
- Oportunidade IA: `--insight-opportunity-border` (+ pequeno gradient shimmer)

### 5.6 CentralHeader

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Consultorias                                                       │
│                                                                      │
│ [A] Thaís Bessa              [NAIL • ONBOARDING] [3 créditos gastos] │
│     Blindagem Moderna · @thais.bessa                                 │
│     Objetivo: Lançar curso presencial com método BM                  │
│                                                                      │
│ [Agendar Reunião]  [Registrar Nota]  [Gerar Material]  [IA]  [⋯]   │
└──────────────────────────────────────────────────────────────────────┘
```

O avatar é um círculo com iniciais + gradiente baseado na cor da fase atual.

### 5.7 TabsNav (12 abas)

```tsx
// Horizontal scrollável, border-bottom, ativo com underline da cor do módulo
<nav className="flex gap-0.5 border-b border-[var(--border-hairline)] overflow-x-auto scrollbar-none">
  {tabs.map(tab => (
    <button
      key={tab.value}
      className={cn(
        'px-3 py-2.5 text-[11px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
        active === tab.value
          ? 'border-[var(--consulting-iris)] text-[var(--text-primary)]'
          : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
      )}
    >
      {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
      {tab.label}
      {tab.badge && (
        <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                         bg-[var(--consulting-iris-subtle)] text-[var(--consulting-iris)]">
          {tab.badge}
        </span>
      )}
    </button>
  ))}
</nav>
```

### 5.8 AIChat Interface (aba IA da Consultoria)

```
┌─────────────────────────────────────────────────────────────────┐
│ [CHAT — 60%]                      │ [MEMÓRIA — 40%]             │
│                                   │                             │
│ IA Dedicada — Thaís Bessa         │ O que a IA sabe:            │
│ ✦ Contexto carregado (8 fontes)   │ ─────────────────────────   │
│ ─────────────────────────────     │ ● Nail designer há 5 anos   │
│                                   │ ● Produto: Blindagem Moderna│
│ [Mensagem da IA]                  │ ● Gargalo: Posicionamento   │
│ [Resposta do usuário]             │ ● Próx reunião: 20/03       │
│                                   │ ● Diagnóstico v2 editado    │
│ ─────────────────────────────     │                             │
│ [Campo de input]   [→ Enviar]     │ [+ Adicionar memória]       │
│                                   │                             │
│ Quick actions:                    │                             │
│ [Gerar plano] [Resumir] [Gargalo] │                             │
└─────────────────────────────────────────────────────────────────┘
```

O header do chat tem gradiente `--consulting-ai-gradient` e badge "IA Dedicada" com glow `--consulting-ai-glow`.

### 5.9 CreateConsultancyWizard

**Step indicator:**
```
① ── ② ── ③ ── ④
Template  Dados  Contexto  Geração
```

Passo ativo: círculo `--wizard-step-active` com glow suave
Passo concluído: `--wizard-step-completed` com checkmark
Passo pendente: `--wizard-step-pending` (ghost)

**Step 1 — Template cards:**
Grid 2×2 de cards selecionáveis. Card selecionado ganha borda `--consulting-iris` e fundo `--consulting-iris-subtle`.

Cada template card:
```
┌──────────────────────┐
│    [Ícone SVG]       │
│  Posicionamento      │
│  Diagnóstico +       │
│  Conteúdo + IA       │
│                      │
│  "Para consultoras   │
│   de marca e        │
│   autoridade"       │
└──────────────────────┘
```

**Step 4 — Auto-geração:**
Spinner animado com Framer Motion (rotate infinito, 1.5s ease-linear) + lista de itens sendo criados com checkmarks aparecendo sequencialmente:

```
Criando Central da Cliente...

✓ Painel criado
✓ Etapas da jornada configuradas
✓ IA Dedicada habilitada
◐ Configurando checklist inicial...
```

---

## 6. Animações — Framer Motion

### Configurações padrão do módulo

```tsx
// Entrada da página lista
const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
}

// Cards na grid
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  }
}

// KPI cards com número contando
// Usar framer-motion's useMotionValue + useTransform para contar de 0 ao valor

// Insight cards — entrada em cascata
const insightVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
}

// Tab content — fade entre abas
const tabVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } }
}

// Progress bar — animação de preenchimento
// Usar initial={{ width: 0 }} animate={{ width: `${progress}%` }}
// transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }

// IA typing indicator
// 3 dots pulsando: opacity 0→1→0, stagger 0.15s entre cada dot
```

### Regra: Reduced Motion

```tsx
import { useReducedMotion } from 'framer-motion'

function useConsultingAnimations() {
  const reduced = useReducedMotion()
  return reduced
    ? { duration: 0, animate: false }
    : { duration: 0.25, animate: true }
}
```

---

## 7. Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| `< 768px` (mobile) | Lista de consultorias: 1 coluna de cards; sidebar escondida; tabs com scroll horizontal; InsightStrip empilhado 2×2; AI chat fullscreen |
| `768px–1023px` (tablet) | Grid 2 colunas; sidebar colapsada em toggle button |
| `≥ 1024px` (desktop) | Grid 2 colunas + sidebar fixa 280px; InsightStrip 4 colunas; AI split view |
| `≥ 1440px` (wide) | Grid 3 colunas para consultorias; max-width 1280px centrado |

---

## 8. Acessibilidade

- Contraste mínimo **4.5:1** para texto normal (WCAG AA), alvejando 7:1 para texto crítico
- Todos os badges têm texto além da cor (label + ícone)
- Botões de ação têm `aria-label` descritivo
- Focus ring visível: `outline: 2px solid var(--consulting-iris); outline-offset: 2px`
- Tabs navegáveis por teclado (role="tablist", role="tab", aria-selected)
- Quick actions acessíveis quando focadas (não só no hover)
- Loading states com aria-busy e aria-live para screen readers

---

## 9. Estados de interface

### Empty state (listagem sem consultorias)

```
[ícone SVG grande — pasta/estrela]
Sua primeira Central está a um clique.

Consultoras que usam a Iris Central:
• Centralizam toda a jornada das clientes
• Geram materiais estratégicos em segundos
• Têm uma IA que conhece cada cliente de cor

[Criar primeira consultoria]
[Ver exemplo de Central →]
```

### Empty state por aba

Cada aba tem seu próprio empty state contextual com value prop e CTA:
- Reuniões: "Registre sua primeira reunião e transforme ela em ação."
- Plano de ação: "Nenhuma tarefa ainda. A IA pode gerar um plano com base no diagnóstico."
- Entregáveis: "Nenhum material gerado. Gere seu primeiro com 2 créditos."
- IA: "A IA está pronta para começar. Pergunte qualquer coisa sobre [nome da cliente]."

### Loading skeleton

Usar `animate-pulse` com `bg-[var(--bg-hover)]`. Forma do skeleton deve imitar o shape real do conteúdo.

---

## 10. Checklist de implementação

### Por componente

- [ ] `PhaseBadge` — oklch vars, dot + texto, variants por fase
- [ ] `ConsultancyCard` — hover com quick actions, progress bar, score visual
- [ ] `KpiRow` + `KpiCard` — animação de número, variação semanal
- [ ] `FilterBar` — busca com debounce 300ms, dropdowns acessíveis
- [ ] `ConsultancySidePanel` — reuniões + pendências + alertas IA
- [ ] `CreateConsultancyWizard` — 4 steps, validação por step, step indicator
- [ ] `CentralHeader` — avatar com gradiente, fase badge, quick actions
- [ ] `InsightCardsStrip` — 4 cards, borda top semântica, shimmer na IA card
- [ ] `TabsNav` — scroll horizontal, active indicator roxo, badges de contagem
- [ ] `AITab` — split view chat/memória, gradient header, quick actions
- [ ] `JourneyTimeline` — visual horizontal com etapas e checklist

### Global

- [ ] Tokens adicionados em `index.css` ✅
- [ ] Responsividade testada em 375px, 768px, 1024px, 1440px
- [ ] Dark mode verificado (principal)
- [ ] Light mode verificado (secundário)
- [ ] Contraste validado para todos os novos tokens
- [ ] `prefers-reduced-motion` respeitado em todas as animações
- [ ] `cursor-pointer` em todos os elementos clicáveis
- [ ] Focus states visíveis

---

## 11. Paleta visual resumida

```
DARK MODE (principal)
────────────────────────────────────────────────────
Fundo base:        #0a1f1f    (teal escuro)
Surface 1:         #0f2a2a
Texto primário:    #f0f5f4
Texto secundário:  #8ba8a6
Accent sistema:    #2dd4a8    (teal brilhante)
────────────────────────────────────────────────────
Consultorias brand:  oklch(0.58 0.24 295)  = roxo #7b52e8
IA accent:           oklch(0.62 0.28 300)  = magenta #9a4ef5
────────────────────────────────────────────────────
Phase onboarding:   oklch(0.75 0.15 200)  = azul suave
Phase diagnosis:    oklch(0.72 0.20 270)  = violeta
Phase delivery:     oklch(0.75 0.18 55)   = âmbar
Phase implementation: oklch(0.72 0.20 145) = verde
Phase support:      oklch(0.68 0.18 220)  = azul médio
Phase closed:       oklch(0.55 0.05 240)  = cinza azulado
```
