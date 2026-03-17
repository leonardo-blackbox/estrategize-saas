# Epic 5 — Central da Cliente: Módulo Consultorias Completo

> **Status:** Planejado
> **Versão:** 1.0
> **Data:** 2026-03-17
> **Conceito interno:** Central da Cliente

---

## Contexto e Motivação

A aba Consultorias existe hoje como um CRUD básico (lista + detalhe com diagnóstico IA). O módulo precisa se tornar o **centro operacional da consultora** — um sistema vivo que centraliza clientes, contexto estratégico, reuniões, entregáveis, plano de ação e uma **IA Dedicada** treinada com as instruções da Iris e alimentada com as informações de cada consultoria.

O documento de referência completo está em:
`Obsidian/Projetos/Estrategize-app/Pesquisas e Referências/08 - Ideia Aba Consultorias.md`

A metodologia real da Iris está documentada em:
`Obsidian/Projetos/Estrategize-app/Docs/Central Notion/01 - Metodologia de Consultorias da Iris.md`

---

## Princípio-base do produto

A Central da Cliente **não é um CRM genérico**. É:
- Um QG vivo da jornada de cada cliente
- Com método, clareza, histórico, entregas e direção estratégica
- Inteligência contextual isolada por consultoria
- Superfície natural para consumo de créditos premium

---

## Objetivos de negócio

| Objetivo | Métrica |
|---|---|
| Aumentar percepção de valor do produto | NPS + feedback qualitativo |
| Aumentar retenção de usuárias | Churn mensal < 3% |
| Criar superfície para consumo de créditos | Créditos gastos/consultoria/mês |
| Transformar consultoria em rotina no sistema | Sessões semanais por usuária |
| Gerar lock-in por memória e histórico | Dados acumulados por cliente |

---

## Escopo do Epic 5

### Incluído

- Redesign completo da lista de consultorias (KPIs, cards, sidebar)
- Fluxo de criação multi-step com templates por tipo
- Central da Cliente com 12 abas operacionais
- IA Dedicada por consultoria (contexto isolado, memória persistente)
- Sistema de reuniões com resumo automático
- Plano de ação (lista/kanban)
- Entregáveis com geração por crédito
- Dados estratégicos da cliente
- Jornada de etapas com checklist
- Design system completo para o módulo

### Não incluído no MVP (Epic 5)

- Bot de Google Meet para gravação automática
- Scraping avançado de Instagram/Google Maps
- Integração com Google Calendar
- Relatórios visuais/PDF gerados com design gráfico
- Agente autônomo com ações proativas

---

## Arquitetura de dados — Novas tabelas

### Migration: 021_consultancies_full.sql

```sql
-- Perfil estratégico da cliente
CREATE TABLE consultancy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  -- Dados básicos expandidos
  instagram TEXT,
  whatsapp TEXT,
  city TEXT,
  state TEXT,
  niche TEXT,
  sub_niche TEXT,
  business_type TEXT, -- produto, serviço, mentoria, curso, local
  -- Contexto estratégico
  main_objective TEXT,
  reported_pains TEXT[],
  current_stage TEXT,
  has_team BOOLEAN DEFAULT FALSE,
  has_physical_space BOOLEAN DEFAULT FALSE,
  has_local_presence BOOLEAN DEFAULT FALSE,
  has_google_mybusiness BOOLEAN DEFAULT FALSE,
  has_website BOOLEAN DEFAULT FALSE,
  -- Perfil comercial
  main_offer TEXT,
  ticket_range TEXT,
  current_audience TEXT,
  desired_audience TEXT,
  acquisition_channels TEXT[],
  -- Financeiro da consultoria
  consulting_value NUMERIC(10,2),
  payment_status TEXT DEFAULT 'pending', -- pending, partial, paid
  payment_installments INTEGER,
  -- Metadados
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consultancy_id)
);

-- Etapas da jornada
CREATE TABLE consultancy_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL, -- Contrato, Briefing, Diagnóstico, Entrega, Implementação, Suporte, Encerramento
  order_index INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  checklist JSONB DEFAULT '[]', -- [{item: string, done: boolean}]
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reuniões
CREATE TABLE consultancy_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  meeting_url TEXT,
  recording_url TEXT,
  participants TEXT[],
  agenda TEXT,
  transcript TEXT,
  summary TEXT, -- gerado pela IA (com crédito)
  decisions TEXT[],
  next_steps TEXT[],
  open_questions TEXT[],
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plano de ação / tarefas
CREATE TABLE consultancy_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  meeting_id UUID REFERENCES consultancy_meetings(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  responsible TEXT, -- consultora ou cliente
  due_date DATE,
  status TEXT DEFAULT 'todo', -- todo, in_progress, done, cancelled
  expected_impact TEXT,
  evidence_url TEXT,
  origin TEXT DEFAULT 'manual', -- manual, meeting_ai, diagnosis_ai
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entregáveis
CREATE TABLE consultancy_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL, -- executive_summary, action_plan, diagnosis_pdf, presentation, competition_analysis, content_bank, positioning, offer, contract, manual
  title TEXT NOT NULL,
  description TEXT,
  content JSONB, -- conteúdo estruturado gerado pela IA
  file_url TEXT, -- arquivo anexado manualmente
  status TEXT DEFAULT 'draft', -- draft, ready, delivered
  generated_by TEXT DEFAULT 'manual', -- manual, ai
  credits_spent INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memória da IA por consultoria
CREATE TABLE consultancy_ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  memory_type TEXT NOT NULL, -- profile, diagnosis, meeting_insight, decision, opportunity, positioning, risk
  content TEXT NOT NULL,
  source TEXT, -- meeting_id, deliverable_id, manual
  importance INTEGER DEFAULT 3, -- 1=low, 3=medium, 5=critical
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de conversas com IA
CREATE TABLE consultancy_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  messages JSONB NOT NULL DEFAULT '[]', -- [{role, content, timestamp}]
  credits_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concorrentes e mercado
CREATE TABLE consultancy_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  url TEXT,
  city TEXT,
  type TEXT, -- direct, indirect, inspiration
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  google_rating NUMERIC(2,1),
  review_highlights TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estratégia de conteúdo
CREATE TABLE consultancy_content_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  central_narrative TEXT,
  brand_belief TEXT,
  enemy TEXT, -- o que combate
  content_pillars TEXT[],
  title_bank TEXT[],
  story_themes TEXT[],
  content_types JSONB,
  hooks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consultancy_id)
);

-- Expander a tabela consultancies existente
ALTER TABLE consultancies
  ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'onboarding',
    -- onboarding, diagnosis, delivery, implementation, support, closed
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS niche TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date_estimated DATE,
  ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'none',
    -- none, positioning, educational_product, local_business, full_restructure
  ADD COLUMN IF NOT EXISTS implementation_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_spent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS strategic_summary TEXT,
  ADD COLUMN IF NOT EXISTS real_bottleneck TEXT,
  ADD COLUMN IF NOT EXISTS next_meeting_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
    -- low, normal, high, at_risk

-- RLS policies
ALTER TABLE consultancy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultancy_content_strategy ENABLE ROW LEVEL SECURITY;

-- Policies (owner-only)
CREATE POLICY "owner_only" ON consultancy_profiles
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_stages
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_meetings
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_action_items
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_deliverables
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_ai_memory
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_ai_conversations
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_competitors
  USING (user_id = auth.uid());
CREATE POLICY "owner_only" ON consultancy_content_strategy
  USING (user_id = auth.uid());
```

---

## Arquitetura de serviços — Backend

### Serviços novos

#### `consultancyAIService.ts` — IA Dedicada

```
Responsabilidade:
- Montar contexto completo de uma consultoria (profile + stages + meetings + diagnosis + deliverables + memory)
- Construir system prompt com metodologia Iris + contexto da cliente
- Manter histórico de conversa
- Gerar outputs estruturados (resumo reunião, plano de ação, diagnóstico, análise concorrência)
- Registrar memórias novas derivadas de interações
- Cobrar créditos proporcionais ao output

System prompt base:
  "Você é a IA Dedicada da consultoria de {client_name}.
   Você foi treinada com a metodologia Iris de consultoria estratégica.
   Seu papel é agir como copiloto estratégico da consultora,
   com memória completa desta cliente e capacidade de:
   - responder sobre o contexto da cliente
   - sugerir próximos passos estratégicos
   - gerar materiais baseados no histórico real
   - identificar inconsistências e oportunidades
   - sempre conectar diagnóstico, entregáveis e plano de ação

   Metodologia Iris:
   [... instruções completas do método Iris injetadas aqui ...]

   Contexto desta cliente:
   {context_block}"
```

#### `meetingService.ts` — Gestão de Reuniões
- CRUD completo
- `generateMeetingSummary()` — usa IA para resumir transcrição (2 créditos)
- `extractActionItems()` — extrai tarefas da reunião (incluído no summary)
- `updateAIMemoryFromMeeting()` — persiste insights na memória da IA

#### `deliverableService.ts` — Entregáveis
- CRUD manual
- `generateDeliverable(type, consultancyId)` — gera output com IA (custo variável)
- Tabela de custos:
  - `meeting_summary`: 2 créditos
  - `action_plan`: 4 créditos
  - `strategic_diagnosis`: 6 créditos
  - `competition_analysis`: 8 créditos
  - `positioning_doc`: 6 créditos
  - `content_bank`: 6 créditos

#### `consultancyContextService.ts` — Contexto unificado
- `buildFullContext(consultancyId, userId)` — agrega todas as tabelas num bloco de contexto para a IA
- `getInsightCards(consultancyId)` — retorna os 4 blocos do header da Central

---

## Rotas novas — Backend

### Consultorias expandidas
```
GET    /api/consultancies                    — list com KPI stats
POST   /api/consultancies                    — create (expandido com template + fields)
GET    /api/consultancies/:id                — detail completo
PUT    /api/consultancies/:id                — update (inclui novos campos)
DELETE /api/consultancies/:id                — soft delete
```

### Profile estratégico
```
GET    /api/consultancies/:id/profile        — busca ou cria profile
PUT    /api/consultancies/:id/profile        — upsert profile
```

### Etapas
```
GET    /api/consultancies/:id/stages         — lista etapas (cria defaults se não existir)
PUT    /api/consultancies/:id/stages/:sid    — update stage (status, checklist, notes)
```

### Reuniões
```
GET    /api/consultancies/:id/meetings       — lista reuniões
POST   /api/consultancies/:id/meetings       — create
PUT    /api/consultancies/:id/meetings/:mid  — update
DELETE /api/consultancies/:id/meetings/:mid  — delete
POST   /api/consultancies/:id/meetings/:mid/summarize  — gera resumo IA (2 créditos)
```

### Plano de ação
```
GET    /api/consultancies/:id/actions        — lista (filtros: status, priority)
POST   /api/consultancies/:id/actions        — create
PUT    /api/consultancies/:id/actions/:aid   — update
DELETE /api/consultancies/:id/actions/:aid   — delete
```

### Entregáveis
```
GET    /api/consultancies/:id/deliverables   — lista
POST   /api/consultancies/:id/deliverables   — create manual
POST   /api/consultancies/:id/deliverables/generate  — gera com IA (crédito)
PUT    /api/consultancies/:id/deliverables/:did  — update
DELETE /api/consultancies/:id/deliverables/:did  — delete
```

### IA Dedicada
```
GET    /api/consultancies/:id/ai/context     — mostra memória e fontes ativas
POST   /api/consultancies/:id/ai/chat        — envia mensagem (custo/mensagem: 1 crédito)
GET    /api/consultancies/:id/ai/memory      — lista memórias
POST   /api/consultancies/:id/ai/memory      — adiciona memória manual
DELETE /api/consultancies/:id/ai/memory/:mid — remove memória
```

### Concorrentes
```
GET    /api/consultancies/:id/competitors    — lista
POST   /api/consultancies/:id/competitors    — create
PUT    /api/consultancies/:id/competitors/:cid — update
DELETE /api/consultancies/:id/competitors/:cid — delete
```

### Estratégia de conteúdo
```
GET    /api/consultancies/:id/content        — busca ou cria
PUT    /api/consultancies/:id/content        — upsert
```

---

## Design System — Tokens específicos do módulo

```css
/* Consultorias module tokens */
--consulting-iris: oklch(0.58 0.24 295);        /* roxo Iris principal */
--consulting-iris-light: oklch(0.85 0.10 295);  /* roxo claro para badges */
--consulting-phase-onboarding: oklch(0.75 0.15 200);  /* azul suave */
--consulting-phase-diagnosis: oklch(0.72 0.20 270);   /* violeta */
--consulting-phase-delivery: oklch(0.65 0.22 30);     /* âmbar */
--consulting-phase-implementation: oklch(0.60 0.25 145); /* verde */
--consulting-phase-support: oklch(0.68 0.18 220);     /* azul médio */
--consulting-phase-closed: oklch(0.55 0.05 240);      /* cinza azulado */
--consulting-ai-accent: oklch(0.62 0.28 300);         /* magenta IA */
--consulting-card-bg: var(--bg-surface-1);
--consulting-card-border: var(--border-hairline);
--consulting-priority-high: oklch(0.60 0.25 25);      /* vermelho suave */
--consulting-priority-medium: oklch(0.72 0.18 55);    /* âmbar */
--consulting-priority-low: oklch(0.65 0.12 145);      /* verde suave */
```

---

## Componentes de UI — Estrutura

### Página de Listagem (`ConsultoriasPage.tsx`)

```
ConsultoriasPage
├── PageHeader
│   ├── Title + Subtitle
│   ├── CTA: "Importar Template"
│   └── CTA: "Nova Consultoria" (abre wizard)
├── KpiRow (4 cards)
│   ├── KpiCard (Ativas)
│   ├── KpiCard (Onboarding)
│   ├── KpiCard (Reuniões da semana)
│   └── KpiCard (Em risco)
├── FilterBar
│   ├── SearchInput
│   ├── PhaseFilterTabs (Todas / Onboarding / Diagnóstico / Entrega / Implementação / Suporte / Arquivadas)
│   ├── NicheDropdown
│   └── SortDropdown
└── TwoColumnLayout
    ├── ConsultancyGrid (2 cols)
    │   └── ConsultancyCard × N
    │       ├── AvatarInitials
    │       ├── ClientName + Brand
    │       ├── NicheBadge + PhaseBadge
    │       ├── ProgressBar (%)
    │       ├── NextMeeting
    │       ├── PendingCount
    │       ├── ImplementationScore
    │       ├── LastAIInsight (truncado)
    │       └── QuickActions (Abrir | Reunião | Nota | IA)
    └── SidebarPanel
        ├── UpcomingMeetings
        ├── CriticalPendencies
        ├── AIAlerts
        └── RecentOutputs
```

### Central da Cliente (`ConsultoriaDetailPage.tsx`)

```
ConsultoriaDetailPage
├── CentralHeader
│   ├── Row1: ClientName | BrandName | NicheBadge | PhaseBadge
│   ├── Row2: MainObjective | Responsible | CreditsSpent
│   └── Row3 QuickActions: Agendar | Nota | Gerar material | Falar com IA | Editar
├── InsightCardsStrip (4 cards)
│   ├── RealBottleneckCard
│   ├── WeekPrioritiesCard
│   ├── NextMeetingCard
│   └── AIOpportunityCard
├── TabsNav (12 abas)
└── TabContent (renderiza aba ativa)
    ├── OverviewTab
    │   ├── JourneyTimeline (horizontal)
    │   ├── OperationalSummary
    │   └── StrategicIntelligence
    ├── ClientDataTab
    ├── DiagnosisTab (existente, expandido)
    ├── JourneyTab
    ├── MeetingsTab
    ├── ActionPlanTab (lista ou kanban)
    ├── DeliverablesTab
    ├── AITab (chat + memória)
    ├── MarketTab
    ├── ContentTab
    ├── FinancialTab
    └── FilesTab
```

### Modal de Criação Multi-step

```
CreateConsultancyWizard
├── Step 1 — Template (nenhum / posicionamento / produto educacional / negócio local / reestruturação)
├── Step 2 — Dados base (nome, empresa, instagram, nicho, tipo, datas, valor)
├── Step 3 — Contexto estratégico (objetivo, dores, estágio, estrutura)
└── Step 4 — Geração automática (preview da Central + spinner)
```

---

## Fluxo da IA Dedicada — Arquitetura

### Contexto construído por consultoria

```typescript
interface ConsultancyAIContext {
  // Identidade da cliente
  client_name: string
  brand: string
  niche: string
  instagram?: string
  city?: string

  // Diagnóstico e posicionamento
  real_bottleneck?: string
  strategic_summary?: string
  diagnosis_content?: DiagnosisContent

  // Perfil estratégico
  main_objective?: string
  reported_pains?: string[]
  main_offer?: string
  current_audience?: string
  desired_audience?: string

  // Jornada
  current_phase: string
  stages: StageWithChecklist[]
  implementation_score: number

  // Histórico de reuniões (resumos dos últimos 5)
  recent_meetings: MeetingSummary[]

  // Entregáveis já produzidos
  deliverables: DeliverableSummary[]

  // Memórias críticas (importance >= 4)
  critical_memories: AIMemory[]

  // Plano de ação em aberto
  open_action_items: ActionItem[]
}
```

### System prompt da IA Dedicada

O system prompt injetará:
1. **Metodologia Iris completa** (diagnóstico, separação sintoma/gargalo, transformação de/para, pilares estratégicos)
2. **Contexto completo da cliente** (bloco JSON estruturado)
3. **Tom e instruções operacionais** da consultora

A IA responde como copiloto — nunca como chatbot genérico.

---

## Fases de execução

### Fase 5.1 — Fundação DB + Backend (Wave 1)

**Objetivo:** Estrutura de dados completa e APIs base

**Tarefas:**
- [ ] Criar migration `021_consultancies_full.sql`
- [ ] Expandir `consultancyService.ts` com campos novos
- [ ] Criar `consultancyProfileService.ts`
- [ ] Criar `consultancyStageService.ts` com defaults automáticos
- [ ] Criar `meetingService.ts`
- [ ] Criar `actionItemService.ts`
- [ ] Criar `deliverableService.ts`
- [ ] Criar `consultancyAIService.ts` (IA Dedicada)
- [ ] Criar `consultancyContextService.ts`
- [ ] Expandir `routes/consultancies.ts` com todas as novas rotas
- [ ] Criar tipos TypeScript para todos os novos modelos

**Env vars novas:**
```
# Já existe: OPENAI_API_KEY
# Nenhuma nova env var necessária para fase 5.1
```

**Estimativa de créditos:**
- Chat com IA: 1 crédito/mensagem
- Resumo de reunião: 2 créditos
- Plano de ação estruturado: 4 créditos
- Diagnóstico estratégico: 6 créditos
- Análise de concorrência: 8 créditos
- PDF final: 8 créditos
- Apresentação: 10 créditos

---

### Fase 5.2 — Redesign da Lista de Consultorias (Wave 2)

**Objetivo:** Transformar a lista atual num dashboard operacional

**Componentes a criar/refatorar:**
- [ ] `ConsultancyKpiRow` — 4 cards de métricas (busca dados reais)
- [ ] `ConsultancyFilterBar` — busca + filtros por fase, nicho, sort
- [ ] `ConsultancyCard` — card rico com todas as informações
- [ ] `ConsultancySidePanel` — painel lateral com reuniões + pendências + alertas IA
- [ ] `CreateConsultancyWizard` — modal multi-step (4 etapas)
- [ ] Empty state inteligente com value props
- [ ] Tokens de design específicos do módulo

**API nova necessária:**
- `GET /api/consultancies` — expandir response com KPI stats (contagens por fase)

---

### Fase 5.3 — Central da Cliente (Wave 3)

**Objetivo:** Construir a página de detalhe com 12 abas

**Abas a implementar (por prioridade):**

**P1 — Visão Geral**
- Timeline horizontal de etapas
- Blocos estratégicos (gargalo, prioridades, próxima reunião, oportunidade IA)
- Resumo operacional

**P1 — Dados da Cliente**
- Formulário editável inline com todos os campos do profile
- Seções: Info Básica, Canais, Estrutura do Negócio, Contexto Comercial

**P1 — Diagnóstico** (refatorar existente)
- Expandir para incluir: problema relatado, gargalo real, análise crítica, prioridades, diferenciais, objeções, oportunidades
- Edição in-place de cada seção

**P1 — Jornada**
- Visual das 7 etapas com status
- Checklist por etapa
- Datas e progresso

**P1 — Reuniões**
- Lista/calendário de reuniões
- Card de reunião com agenda, transcrição, resumo, tarefas geradas
- CTA "Resumir com IA" (2 créditos)

**P1 — Plano de Ação**
- Visualização lista (default) ou kanban
- Filtros por prioridade, responsável, status
- Criar tarefa inline

**P2 — Entregáveis**
- Grid de cards de entregáveis
- Status badge (rascunho, pronto, entregue)
- CTA "Gerar novo" com modal de confirmação de créditos
- Download de conteúdo gerado

**P2 — IA da Consultoria**
- Split view: chat à esquerda, memória à direita
- Interface de chat limpa com contexto visível
- Indicador de créditos por mensagem
- Memória editável (adicionar/remover)
- Quick actions: "Gerar plano", "Resumir status", "Encontrar inconsistências"

**P3 — Mercado**
- Cards de concorrentes
- Formulário de adição manual
- Insights comparativos

**P3 — Conteúdo**
- Formulário de estratégia de conteúdo
- Narrativa, pilares, banco de títulos, ganchos

**P3 — Financeiro**
- Dados do contrato
- Status de pagamento
- Gastos em créditos da consultoria

**P3 — Arquivos**
- Lista de arquivos (futura integração com Supabase Storage)
- Placeholder com CTA de upload

---

### Fase 5.4 — IA Dedicada Completa (Wave 4)

**Objetivo:** IA contextual com memória persistente e geração de outputs premium

**Tarefas:**
- [ ] `consultancyAIService.ts` — context builder + chat + output generators
- [ ] System prompt completo com metodologia Iris
- [ ] `buildFullContext()` — agrega todas as tabelas em bloco coerente
- [ ] Generators por tipo de output (resumo reunião, diagnóstico, plano, análise mercado, banco conteúdo)
- [ ] `updateMemoryFromInteraction()` — persiste novos insights automaticamente
- [ ] Interface `AITab` com chat, memória e quick actions
- [ ] `GenerateOutputModal` — fluxo de confirmação de créditos
- [ ] Validação: IA só acessa contexto daquela consultoria (isolamento total)

**Env vars novas:**
```
# Nenhuma nova — usa OPENAI_API_KEY já configurada
# Modelos recomendados:
# - chat: gpt-4o (melhor reasoning)
# - outputs longos: gpt-4o
# - memória sumarizada: gpt-4o-mini (custo menor)
```

---

### Fase 5.5 — Polish + Design System Completo (Wave 5)

**Objetivo:** Elevar o design ao nível premium definido pelo ui-ux-pro-max

**Tarefas:**
- [ ] Aplicar tokens de design do módulo em todos os componentes
- [ ] Animações Framer Motion: entrada de cards, transição de tabs, loading states
- [ ] Empty states por aba com valor comunicado
- [ ] Skeleton loaders para todos os estados de carregamento
- [ ] Responsividade mobile (320px → 1440px)
- [ ] Quick actions no hover dos cards
- [ ] Progress bars animadas
- [ ] Phase badges com cor semântica
- [ ] Toasts de confirmação após ações com crédito
- [ ] Indicador visual de créditos restantes no header da Central

---

## Critérios de aceitação por fase

### Fase 5.1 ✓ quando
- Migration aplicada sem erros
- Todos os endpoints respondem corretamente (200/201/404/402)
- RLS testado: usuária A não acessa dados da usuária B
- Créditos debitados corretamente nas ações premium

### Fase 5.2 ✓ quando
- Lista mostra KPIs corretos calculados do banco
- Cards mostram todas as informações do card spec
- Filtros e busca funcionam
- Wizard cria consultoria com dados expandidos
- Sidebar mostra dados reais (não mocks)

### Fase 5.3 ✓ quando
- Todas as 12 abas renderizam sem erro
- Dados são lidos e escritos corretamente para cada aba
- Jornada atualiza etapas com checklist funcional
- Reuniões CRUD completo funciona
- Plano de ação com CRUD e filtros

### Fase 5.4 ✓ quando
- Chat com IA responde em contexto daquela consultoria
- Respostas incluem referências reais (nome da cliente, dados cadastrados)
- Outputs gerados chegam no formato correto
- Créditos são cobrados e registrados
- Memória persistida e visível na interface

### Fase 5.5 ✓ quando
- Design aprovado pelo usuário
- Sem erros de layout em 320px e 1440px
- Todas as animações funcionam sem jank
- Acessibilidade: contraste ≥ 4.5:1

---

## Dependências e riscos

| Dependência | Status | Ação |
|---|---|---|
| OpenAI API Key | Já configurada | — |
| Supabase Storage para arquivos | Futuro | Placeholder por ora |
| Google Calendar | Futuro | Não implementar no Epic 5 |
| Supabase projeto live | Necessário para migration | Confirmar com usuário |

| Risco | Mitigação |
|---|---|
| Custo OpenAI com IA Dedicada | Modelo gpt-4o-mini para chats curtos, gpt-4o para outputs longos |
| Contexto muito grande para o modelo | Limitar a últimas 5 reuniões + memórias críticas + profile + diagnóstico |
| Regressão nos endpoints de diagnóstico existentes | Testar endpoints atuais antes de modificar |

---

## Variáveis de ambiente novas

```bash
# Nenhuma variável nova necessária para o MVP do Epic 5
# Tudo usa infraestrutura já existente:
# OPENAI_API_KEY — já configurada
# SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — já configuradas
```

---

## Referências

- Documento de ideias: `Obsidian/Projetos/Estrategize-app/Pesquisas e Referências/08 - Ideia Aba Consultorias.md`
- Metodologia Iris real: `Obsidian/Projetos/Estrategize-app/Docs/Central Notion/01 - Metodologia de Consultorias da Iris.md`
- Epic anterior (Aplicações): `docs/prd/epic-4-aplicacoes-v2.md`
- Stack atual: `CLAUDE.md`
