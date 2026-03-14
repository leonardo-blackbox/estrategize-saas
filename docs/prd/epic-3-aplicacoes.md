# Epic 3 — Aplicações (Form Builder)
## Product Requirements Document

**Status:** Draft
**Versão:** 1.0
**Data:** 2026-03-14
**Autores:** Orion (AIOX Master) + UX Design Expert + Architect
**Referência:** Mapeamento Completo do Respondi.app (Obsidian/Ideias)

---

## 1. VISÃO DO PRODUTO

### 1.1 Sumário Executivo

"Aplicações" é a primeira ferramenta real do ecossistema Iris. Permite que consultores e mentores criem formulários conversacionais de alta qualidade para qualificar candidatos, coletar dados de clientes e estruturar processos de aplicação — tudo dentro da plataforma, sem depender de ferramentas externas como Typeform, Respondi ou Google Forms.

### 1.2 Problema que Resolve

Consultores e mentores precisam qualificar leads e clientes antes de venderem seus serviços. Hoje eles usam:
- Typeform (caro, em inglês, sem personalização da marca)
- Respondi.app (tracking de pixel bloqueado no plano gratuito — R$147/mês para recursos essenciais)
- Google Forms (feio, sem experiência conversacional)

O Iris resolve isso nativamente: formulários bonitos, conversacionais, com tracking de pixel gratuito e integrados ao ecossistema de consultorias.

### 1.3 Proposta de Valor Diferencial

| Feature | Respondi PRO (R$147/mês) | Iris (incluso no plano) |
|---------|--------------------------|-------------------------|
| Facebook Pixel + FBCLID | ✅ PRO | ✅ Grátis |
| Google Analytics GA4 | ✅ PRO | ✅ Grátis |
| TikTok Pixel | ✅ PRO | ✅ Grátis |
| Captura UTMs automática | ✅ PRO | ✅ Grátis |
| Sem marca d'água | ✅ PRO | ✅ Grátis |
| Webhook nativo | ✅ PRO | ✅ Grátis |
| Editor visual com preview | ✅ | ✅ |
| Formulário conversacional | ✅ | ✅ |

### 1.4 Usuário Alvo

**Primário:** Consultor/mentor usando o Iris para gerenciar suas consultorias
**Secundário:** Cliente final que preenche o formulário (respondente)

---

## 2. OBJETIVOS E MÉTRICAS

### 2.1 Objetivos

1. **Ativação:** Ser a primeira feature que o usuário usa após o onboarding
2. **Retenção:** Criar "lock-in" — formulários com dados reais aumentam o custo de troca
3. **Upsell:** Usuários que criam formulários têm maior probabilidade de comprar planos premium

### 2.2 KPIs de Sucesso (primeiros 90 dias)

| Métrica | Meta |
|---------|------|
| % usuários que criam ≥1 formulário | >40% |
| % formulários publicados (vs rascunhos) | >60% |
| Respostas coletadas por formulário ativo (mediana) | >10 |
| Tempo médio do 1º formulário criado | <8 min |
| NPS da ferramenta | >70 |

---

## 3. ESCOPO DO MVP

### 3.1 IN — MVP (Epic 3)

- [ ] Dashboard de formulários (listar, criar, duplicar, arquivar, deletar)
- [ ] Editor 3 painéis (campos / preview live / opções do campo)
- [ ] 11 tipos de campos (ver seção 5)
- [ ] Personalização visual completa (cores, logo, fonte, bordas)
- [ ] Publicação/despublicação com URL pública
- [ ] Formulário público conversacional (uma pergunta por tela)
- [ ] Visualização de respostas (individual + tabela)
- [ ] Exportação CSV de respostas
- [ ] Drag-and-drop para reordenar campos

### 3.2 OUT — Pós-MVP

- [ ] Lógica condicional (skip logic por resposta)
- [ ] Sistema de pontuação (scoring/quiz)
- [ ] Notificações por email no envio
- [ ] Notificações por WhatsApp
- [ ] Facebook Pixel / GA4 / TikTok Pixel (tracking)
- [ ] Captura de UTMs / FBCLID / GCLID
- [ ] Webhook nativo (disparo para Make/Zapier/n8n)
- [ ] Upload de arquivo pelo respondente
- [ ] Recuperação de respostas parciais
- [ ] Analytics de abandono por campo
- [ ] Templates pré-criados
- [ ] Integração Google Sheets
- [ ] Domínio personalizado

---

## 4. ARQUITETURA TÉCNICA

### 4.1 Stack Utilizada

Segue o stack existente do projeto sem novas dependências de runtime:
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + Zustand + React Query + Framer Motion
- **Backend:** Node.js + Express + TypeScript + Zod
- **Database:** PostgreSQL via Supabase com RLS
- **Storage:** Supabase Storage (logo e imagem de fundo dos formulários)

Novas dependências de build:
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop no editor
- `papaparse` — export CSV no frontend

### 4.2 Database Schema — Migration 015

#### Tabelas

```sql
-- ============================================================
-- Migration 015: Applications (Form Builder)
-- ============================================================
BEGIN;

-- Function: slugify
CREATE OR REPLACE FUNCTION slugify(value TEXT) RETURNS TEXT AS $$
DECLARE result TEXT;
BEGIN
  result := lower(trim(value));
  result := translate(result,
    'àáâãäåæçèéêëìíîïðñòóôõöøùúûüý',
    'aaaaaaeceeeeiiiidnoooooouuuuy'
  );
  result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');
  result := regexp_replace(result, '[\s-]+', '-', 'g');
  result := trim(both '-' from result);
  result := left(result, 80);
  RETURN COALESCE(NULLIF(result, ''), 'formulario');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: generate unique slug with collision resolution
CREATE OR REPLACE FUNCTION generate_application_slug(
  p_title TEXT, p_exclude_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  base_slug  TEXT := slugify(p_title);
  candidate  TEXT := base_slug;
  counter    INT  := 1;
  conflict   BOOL;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM applications
      WHERE slug = candidate
        AND (p_exclude_id IS NULL OR id <> p_exclude_id)
    ) INTO conflict;
    EXIT WHEN NOT conflict;
    candidate := base_slug || '-' || counter;
    counter   := counter + 1;
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql;

-- Table: applications
CREATE TABLE IF NOT EXISTS applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  slug             TEXT NOT NULL UNIQUE,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'archived')),
  theme_config     JSONB NOT NULL DEFAULT '{}',
  settings         JSONB NOT NULL DEFAULT '{}',
  response_count   INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: application_fields
CREATE TABLE IF NOT EXISTS application_fields (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id     UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  position           INT NOT NULL DEFAULT 0,
  type               TEXT NOT NULL,
  title              TEXT NOT NULL DEFAULT '',
  description        TEXT,
  required           BOOL NOT NULL DEFAULT false,
  options            JSONB NOT NULL DEFAULT '[]',
  conditional_logic  JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: application_responses
CREATE TABLE IF NOT EXISTS application_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'partial'
                   CHECK (status IN ('partial', 'complete')),
  session_token  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  metadata       JSONB NOT NULL DEFAULT '{}',
  submitted_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: application_response_answers
CREATE TABLE IF NOT EXISTS application_response_answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  UUID NOT NULL REFERENCES application_responses(id) ON DELETE CASCADE,
  field_id     UUID NOT NULL,
  field_type   TEXT NOT NULL,
  field_title  TEXT NOT NULL,
  value        JSONB NOT NULL DEFAULT 'null',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_applications_user_id      ON applications(user_id);
CREATE INDEX idx_applications_slug         ON applications(slug);
CREATE INDEX idx_applications_status       ON applications(user_id, status);
CREATE INDEX idx_app_fields_app_id         ON application_fields(application_id, position);
CREATE INDEX idx_app_responses_app_id      ON application_responses(application_id, created_at DESC);
CREATE INDEX idx_app_responses_status      ON application_responses(application_id, status);
CREATE INDEX idx_app_answers_response_id   ON application_response_answers(response_id);

-- Triggers: updated_at
CREATE TRIGGER set_updated_at_applications
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_app_fields
  BEFORE UPDATE ON application_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: auto-increment response_count on complete submission
CREATE OR REPLACE FUNCTION increment_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'complete' AND (OLD.status IS NULL OR OLD.status <> 'complete') THEN
    UPDATE applications SET response_count = response_count + 1
    WHERE id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_response_complete
  AFTER INSERT OR UPDATE ON application_responses
  FOR EACH ROW EXECUTE FUNCTION increment_response_count();

-- RLS
ALTER TABLE applications                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_fields           ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_responses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_response_answers ENABLE ROW LEVEL SECURITY;

-- applications: owner-only CRUD
CREATE POLICY "applications_owner_select" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "applications_owner_insert" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_owner_update" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "applications_owner_delete" ON applications FOR DELETE USING (auth.uid() = user_id);

-- application_fields: owner via application
CREATE POLICY "app_fields_owner_all" ON application_fields
  USING (EXISTS (SELECT 1 FROM applications WHERE id = application_id AND user_id = auth.uid()));

-- application_responses: owner can read; public can insert (via service role)
CREATE POLICY "app_responses_owner_select" ON application_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM applications WHERE id = application_id AND user_id = auth.uid()));

-- application_response_answers: owner can read via response
CREATE POLICY "app_answers_owner_select" ON application_response_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM application_responses r
    JOIN applications a ON a.id = r.application_id
    WHERE r.id = response_id AND a.user_id = auth.uid()
  ));

COMMIT;
```

#### theme_config JSONB Schema

```typescript
interface ThemeConfig {
  backgroundColor:  string;  // hex, default: '#000000'
  questionColor:    string;  // hex, default: '#f5f5f7'
  answerColor:      string;  // hex, default: '#f5f5f7'
  buttonColor:      string;  // hex, default: '#7c5cfc'
  buttonTextColor:  string;  // hex, calculated by contrast ratio
  fontFamily:       string;  // Google Font name, default: 'Inter'
  borderRadius:     number;  // 0–24, default: 12
  logoUrl?:         string;  // Supabase Storage URL
  logoPosition:     'left' | 'center' | 'right';
  backgroundImageUrl?: string;
}
```

#### settings JSONB Schema

```typescript
interface FormSettings {
  closeAfterResponses?: number;  // null = ilimitado
  limitOneResponsePerSession: boolean;
  showProgressBar:     boolean;   // default: true
  showQuestionNumbers: boolean;   // default: true
  redirectUrl?:        string;    // pós-submit
  thankYouTitle:       string;    // default: 'Obrigado!'
  thankYouMessage:     string;
  estimatedTime?:      number;    // minutos (exibido na welcome screen)
}
```

### 4.3 Backend API

**Base path:** `/api/applications`
**Auth:** `requireAuth` middleware em todas as rotas exceto as públicas
**Rate limits:** Herda rate limit geral (300/15min); rotas públicas: 60 submits/hora por IP

#### Rotas Autenticadas

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/applications` | Lista formulários do usuário |
| POST | `/api/applications` | Cria novo formulário |
| GET | `/api/applications/:id` | Busca formulário com campos |
| PUT | `/api/applications/:id` | Atualiza metadados + tema + settings |
| DELETE | `/api/applications/:id` | Arquiva (soft) ou deleta permanentemente |
| POST | `/api/applications/:id/duplicate` | Clona formulário + campos |
| PUT | `/api/applications/:id/fields` | Substitui array de campos (bulk, atomic) |
| GET | `/api/applications/:id/responses` | Lista respostas (paginado) |
| GET | `/api/applications/:id/responses/export` | CSV de respostas |

#### Rotas Públicas (sem auth)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/applications/public/:slug` | Dados do form (só se publicado) |
| POST | `/api/applications/public/:slug/submit` | Submete resposta |

#### Schemas Zod Principais

```typescript
// POST /api/applications
const CreateApplicationSchema = z.object({
  title: z.string().min(1).max(200),
});

// PUT /api/applications/:id
const UpdateApplicationSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  status:       z.enum(['draft', 'published', 'archived']).optional(),
  theme_config: ThemeConfigSchema.partial().optional(),
  settings:     FormSettingsSchema.partial().optional(),
});

// PUT /api/applications/:id/fields (bulk replace)
const BulkUpdateFieldsSchema = z.object({
  fields: z.array(z.object({
    id:                z.string().uuid().optional(), // omit = new field
    type:              z.enum(FIELD_TYPES),
    title:             z.string().max(500),
    description:       z.string().max(1000).optional(),
    required:          z.boolean().default(false),
    options:           z.array(FieldOptionSchema).optional(),
    conditional_logic: ConditionalLogicSchema.optional(),
  })).max(100),
});

// POST /api/applications/public/:slug/submit
const SubmitResponseSchema = z.object({
  answers: z.array(z.object({
    field_id:    z.string().uuid(),
    field_type:  z.string(),
    field_title: z.string(),
    value:       z.unknown(),
  })),
  metadata: z.object({
    utm_source:   z.string().optional(),
    utm_medium:   z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content:  z.string().optional(),
    utm_term:     z.string().optional(),
    fbclid:       z.string().optional(),
    gclid:        z.string().optional(),
    user_agent:   z.string().optional(),
  }).optional(),
});
```

#### Lógica de Criação de Formulário

Ao criar um formulário (`POST /api/applications`), o backend automaticamente:
1. Gera o slug via `generate_application_slug(title)`
2. Cria o registro em `applications`
3. Insere 2 campos padrão:
   - `welcome` na posição 0: "Bem-vindo(a)!"
   - `thank_you` na posição 9999: "Obrigado pela resposta!"

### 4.4 Frontend — State Management

#### Zustand — Editor Store

```typescript
// frontend/src/stores/editorStore.ts

interface LocalField {
  localId:          string;    // crypto.randomUUID() — ID local antes de salvar
  id?:              string;    // UUID do banco após salvar
  type:             FieldType;
  title:            string;
  description?:     string;
  required:         boolean;
  options:          FieldOption[];
  conditional_logic: ConditionalLogic;
}

interface EditorState {
  // Data
  applicationId:    string | null;
  title:            string;
  status:           'draft' | 'published' | 'archived';
  themeConfig:      ThemeConfig;
  settings:         FormSettings;
  fields:           LocalField[];

  // UI State
  selectedFieldIndex: number | null;
  previewDevice:    'desktop' | 'mobile';
  isDirty:          boolean;
  saveStatus:       'idle' | 'saving' | 'saved' | 'error';

  // Actions — Field Management
  addField:         (type: FieldType, afterIndex?: number) => void;
  removeField:      (index: number) => void;
  reorderFields:    (oldIndex: number, newIndex: number) => void;
  updateField:      (index: number, updates: Partial<LocalField>) => void;
  selectField:      (index: number | null) => void;
  duplicateField:   (index: number) => void;

  // Actions — Form Management
  updateTitle:      (title: string) => void;
  updateTheme:      (updates: Partial<ThemeConfig>) => void;
  updateSettings:   (updates: Partial<FormSettings>) => void;
  toggleStatus:     () => void;

  // Actions — Persistence
  loadApplication:  (id: string) => Promise<void>;
  saveFields:       () => Promise<void>;   // debounced 1.5s
  saveMetadata:     () => Promise<void>;   // debounced 1.5s
  forceSave:        () => Promise<void>;   // imediato (ex: ao publicar)
  reset:            () => void;
}
```

#### React Query — Query Keys

```typescript
export const applicationKeys = {
  all:       ['applications'] as const,
  lists:     () => [...applicationKeys.all, 'list'] as const,
  detail:    (id: string) => [...applicationKeys.all, 'detail', id] as const,
  responses: (id: string) => [...applicationKeys.all, 'responses', id] as const,
  public:    (slug: string) => ['public-form', slug] as const,
};

// Configurações de cache recomendadas:
// Dashboard list: staleTime: 2min, gcTime: 10min
// Form detail (editor): staleTime: 0 (sempre fresco — editável)
// Public form: staleTime: 5min, gcTime: 30min
// Responses list: staleTime: 30s
```

### 4.5 Estrutura de Arquivos

```
backend/src/
├── database/migrations/
│   └── 015_applications.sql          [NOVO]
├── routes/
│   ├── applications.ts               [NOVO] rotas auth'd
│   └── public/
│       └── forms.ts                  [NOVO] rotas públicas
└── app.ts                            [ALTERADO] registrar rotas

frontend/src/
├── api/
│   └── applications.ts               [NOVO] API client functions
├── stores/
│   └── editorStore.ts                [NOVO] Zustand editor store
├── pages/
│   ├── member/
│   │   └── aplicacoes/
│   │       ├── AplicacoesPage.tsx    [NOVO] dashboard
│   │       ├── EditorPage.tsx        [NOVO] editor 3 painéis
│   │       └── RespostasPage.tsx     [NOVO] visualização respostas
│   └── public/
│       └── FormPublicoPage.tsx       [NOVO] form conversacional público
├── components/
│   └── aplicacoes/
│       ├── editor/
│       │   ├── FieldsList.tsx        [NOVO] painel esquerdo
│       │   ├── FieldItem.tsx         [NOVO] item drag-and-drop
│       │   ├── FieldTypeSelector.tsx [NOVO] seletor de tipo
│       │   ├── LivePreview.tsx       [NOVO] painel central
│       │   └── FieldOptions.tsx      [NOVO] painel direito
│       ├── form/
│       │   ├── FormRenderer.tsx      [NOVO] renderizador público/preview
│       │   ├── WelcomeScreen.tsx     [NOVO]
│       │   ├── ThankYouScreen.tsx    [NOVO]
│       │   ├── QuestionScreen.tsx    [NOVO]
│       │   ├── ProgressBar.tsx       [NOVO]
│       │   └── fields/
│       │       ├── ShortTextField.tsx
│       │       ├── LongTextField.tsx
│       │       ├── MultipleChoiceField.tsx
│       │       ├── EmailField.tsx
│       │       ├── PhoneField.tsx
│       │       ├── NumberField.tsx
│       │       ├── DateField.tsx
│       │       └── RatingField.tsx
│       └── dashboard/
│           ├── ApplicationCard.tsx   [NOVO]
│           ├── FormThumbnail.tsx     [NOVO]
│           └── EmptyState.tsx        [NOVO]
└── App.tsx                           [ALTERADO] novas rotas
```

---

## 5. TIPOS DE CAMPOS — MVP

| Tipo | Identificador | Descrição | Options Schema |
|------|---------------|-----------|----------------|
| Boas-vindas | `welcome` | Tela inicial, não coleta dado | `{ buttonText, description }` |
| Mensagem | `message` | Texto informativo entre perguntas | `{}` |
| Resposta curta | `short_text` | Input de linha única | `{ placeholder, maxLength }` |
| Resposta longa | `long_text` | Textarea multi-linha | `{ placeholder, maxLength }` |
| Nome | `name` | Input com validação de nome | `{ placeholder }` |
| E-mail | `email` | Input com validação de email | `{ placeholder }` |
| Telefone | `phone` | Input com máscara BR | `{ placeholder }` |
| Múltipla escolha | `multiple_choice` | Lista de opções | `{ choices: [{id, label}], allowMultiple, randomize }` |
| Número | `number` | Input numérico | `{ min, max, placeholder }` |
| Data | `date` | Seletor de data | `{ minDate, maxDate }` |
| Agradecimento | `thank_you` | Tela final, não coleta dado | `{ title, message, redirectUrl, showBranding }` |

---

## 6. DESIGN SYSTEM — Aplicações

### 6.1 Identidade Visual da Ferramenta

A ferramenta "Aplicações" tem identidade própria dentro do Iris com tokens de cor específicos:

```css
--iris-violet:       #7c5cfc;   /* primary brand da ferramenta */
--iris-violet-dim:   rgba(124, 92, 252, 0.12);
--iris-violet-glow:  rgba(124, 92, 252, 0.32);
--iris-indigo:       #5e5ce6;   /* gradient endpoint */
```

### 6.2 Telas e Layouts

#### Dashboard de Formulários

**Layout:** Grid responsivo `repeat(auto-fill, minmax(280px, 1fr))`, gap 20px, max-width 1280px

**Card de Formulário:**
- Thumbnail area (160px) renderiza o tema real do form em `scale(0.28)`
- Status badge: pill com dot colorido (verde=publicado, âmbar=rascunho, cinza=arquivado)
- Hover: `translateY(-2px)` + `box-shadow: --shadow-violet` + thumbnail zoom `scale(1.04)`
- Menu kebab (···): aparece no hover, dropdown com ações

**Empty State:**
- Ilustração SVG animada de formulário em perspectiva isométrica
- Framer Motion keyframes para campos que preenchem em loop
- CTA: "Criar primeira aplicação"

**Loading:** 6 cards skeleton com shimmer `1.5s infinite`

#### Editor 3 Painéis

**Breakpoints:**
- Desktop (≥1024px): 3 painéis lado a lado (`260px 1fr 320px`)
- Tablet (<1024px): painel direito vira bottom sheet
- Mobile (<768px): tela de aviso "Editor disponível no desktop"

**Painel Esquerdo (Fields List):**
- Drag handles aparecem no hover (`opacity: 0 → 1`, `150ms`)
- Item dragging: `opacity: 0.5`, `scale: 1.02`, `rotate: 1deg`
- Slot fantasma: retângulo tracejado com `--iris-violet-dim`
- Inserção de novo campo: `height: 0 → 52px` animado com spring `stiffness: 500, damping: 30`
- Type badges coloridos por categoria (ver paleta na seção 6.3)

**Field Type Selector:**
- Bottom sheet animado subindo do painel esquerdo
- Grid 3×N de cards `72×72px`
- Busca inline com debounce
- `spring stiffness: 400, damping: 28`

**Painel Central (Live Preview):**
- Frame de dispositivo animado com `layout` transition
- Toggle desktop/mobile: frame muda de largura com spring
- Campo ativo destacado: borda `2px --iris-violet` pulsante
- Toolbar flutuante na base: navegar campos sem sair da edição
- Mesmos componentes do formulário público com `mode="preview"`

**Painel Direito (Field Options):**
- Seção "Pergunta": textarea auto-resize + contador de caracteres
- Seção "Descrição": togglável com height animation
- Seção "Configurações": varia por tipo de campo
- Seção "Validação": toggle obrigatório + lógica (pós-MVP)
- Quando nenhum campo selecionado: mostra configurações de Aparência do form

**Auto-save visual:**
```
idle   → ""
saving → "Salvando..."   (dots animados)
saved  → "✓ Salvo"       (fade out após 2s)
error  → "Erro ao salvar ↺"  (botão retry)
```

#### Formulário Público Conversacional

**URL:** `/f/:slug` — rota pública, sem auth

**Estrutura:**
- Uma pergunta por tela, viewport completo
- Progress bar (3px) no topo com glow effect na cor do tema
- Transição entre perguntas: `y: ±60, scale: 0.96, opacity: 0` → center com spring `300/25`
- Direção da animação: forward = sobe, back = desce

**Welcome Screen:**
- Logo (se configurado), título em Display 48-56px, descrição, botão CTA
- Stagger animation nos filhos (`staggerChildren: 0.1, delayChildren: 0.2`)
- Tempo estimado opcional

**Question Screen:**
- Número da pergunta em monospace com `→` animado
- Label é a própria pergunta (H2), sem label separado
- Input com focus automático ao entrar
- Botão "OK ↵" + hint de teclado

**Navegação por teclado:**
- `Enter`: avança
- `Shift+Enter`: avança mesmo em textarea
- `A, B, C...`: seleciona opção em múltipla escolha
- `1-9, 0`: seleciona em escala numérica
- `← →`: navega em escala

**Thank You Screen:**
- Ícone check com spring bounce (`scale: 0 → 1.2 → 1`)
- Confetti: 30-40 partículas animadas, cores baseadas no accent do tema
- Sequência: progress bar 100% → ícone → título → subtítulo → ações

### 6.3 Type Badges — Paleta de Cores

```
short_text / long_text / name → rgba(50,173,230,0.12) / #32ade6
multiple_choice               → rgba(124,92,252,0.12)  / #7c5cfc
email                         → rgba(48,209,88,0.12)   / #30d158
phone                         → rgba(48,209,88,0.12)   / #30d158
number                        → rgba(255,159,10,0.12)  / #ff9f0a
date                          → rgba(100,210,255,0.12) / #64d2ff
welcome / message             → rgba(110,110,115,0.12) / #8e8e93
thank_you                     → rgba(48,209,88,0.12)   / #30d158
```

### 6.4 Motion Design — Tabela de Referência

| Interação | Duração | Easing | Tipo |
|-----------|---------|--------|------|
| Avançar pergunta (público) | 350ms | spring 300/25 | slide Y + fade |
| Voltar pergunta (público) | 350ms | spring 300/25 | slide Y invertido |
| Inserir novo campo (editor) | 300ms | spring 500/30 | height 0→52 + fade |
| Reorder drag-drop | contínuo | spring 300/25 | layout |
| Hover em card | 200ms | spring 300/20 | translateY + shadow |
| Click em card | 80ms | ease | scale 0.98 |
| Tab switch (editor topbar) | 250ms | ease | layoutId underline |
| Progress bar avançar | 400ms | cubic 0.4/0/0.2/1 | width |
| Thank you icon bounce | 400ms | spring 500/25 | scale + rotate |
| Field type selector sheet | 250ms | spring 400/28 | y + opacity |
| Skeleton shimmer | 1500ms | linear | background-position |
| Auto-save status texto | 300ms | ease | opacity |

---

## 7. USER STORIES

### Epic 3.1 — Dashboard de Formulários

**US-3.1.1** — Como consultor, quero ver todos os meus formulários em um dashboard visual para gerenciar meu catálogo de aplicações.

**Critérios de Aceite:**
- [ ] Grid de cards com thumbnail visual de cada formulário
- [ ] Card exibe: nome, status (badge), contador de respostas, data de criação
- [ ] Thumbnail renderiza as cores reais do tema do formulário
- [ ] Menu de ações por card: Editar, Ver respostas, Compartilhar link, Duplicar, Arquivar, Excluir
- [ ] Busca por nome com debounce de 300ms
- [ ] Filtros: Todos / Publicados / Rascunhos
- [ ] Empty state com CTA para criar primeiro formulário
- [ ] Skeleton loading (6 cards) enquanto dados carregam

**US-3.1.2** — Como consultor, quero criar um novo formulário para começar a coletar aplicações.

**Critérios de Aceite:**
- [ ] Botão "Nova Aplicação" no dashboard
- [ ] Modal para inserir título (mínimo 1, máximo 200 caracteres)
- [ ] Após criação: redireciona automaticamente para o editor
- [ ] Formulário criado com campos Welcome e Thank You por padrão
- [ ] Status inicial: Rascunho

**US-3.1.3** — Como consultor, quero duplicar um formulário existente para criar variações sem começar do zero.

**Critérios de Aceite:**
- [ ] Ação "Duplicar" no menu do card
- [ ] Cópia criada com nome "Cópia de [nome original]"
- [ ] Todos os campos e tema copiados
- [ ] Status da cópia: sempre Rascunho
- [ ] Slug gerado automaticamente para a cópia

---

### Epic 3.2 — Editor de Formulário

**US-3.2.1** — Como consultor, quero editar os campos do formulário com um editor visual para criar minha sequência de perguntas.

**Critérios de Aceite:**
- [ ] Layout 3 painéis: lista de campos / preview / opções
- [ ] Preview ao vivo atualiza em tempo real ao editar
- [ ] Painel esquerdo lista todos os campos com tipo, título resumido
- [ ] Clique em campo no painel esquerdo seleciona e mostra opções no direito
- [ ] Título do formulário editável inline na topbar
- [ ] Indicador de auto-save (Salvando... / ✓ Salvo / Erro ao salvar)

**US-3.2.2** — Como consultor, quero adicionar diferentes tipos de campos para coletar as informações certas.

**Critérios de Aceite:**
- [ ] Botão "Adicionar campo" no painel esquerdo
- [ ] Seletor de tipos com grid visual (ícone + nome)
- [ ] 11 tipos disponíveis no MVP (ver seção 5)
- [ ] Campo inserido após o campo atualmente selecionado
- [ ] Foco automático no campo de título após inserção
- [ ] Animação de inserção com height e fade

**US-3.2.3** — Como consultor, quero reordenar os campos arrastando-os para personalizar o fluxo.

**Critérios de Aceite:**
- [ ] Drag handle aparece ao hover em cada campo
- [ ] Drag-and-drop com @dnd-kit/sortable
- [ ] Feedback visual: slot fantasma + opacidade no item arrastado
- [ ] Reordenação otimista (UI atualiza imediatamente, salva em background)
- [ ] Auto-save acionado após soltar (debounce 1.5s)

**US-3.2.4** — Como consultor, quero configurar as opções de cada campo para customizar a pergunta.

**Critérios de Aceite:**
- [ ] Painel direito contextual por tipo de campo
- [ ] Campo Texto: placeholder, limite de caracteres, obrigatório
- [ ] Campo Múltipla Escolha: lista editável de opções, toggle múltipla seleção, toggle randomizar
- [ ] Campo E-mail/Telefone: placeholder, obrigatório
- [ ] Campo Número: min, max, placeholder
- [ ] Campo Data: min date, max date
- [ ] Toggle "Obrigatório" presente em todos os campos coletores
- [ ] Mudanças aplicadas em tempo real no preview

**US-3.2.5** — Como consultor, quero personalizar a aparência do formulário para que corresponda à minha marca.

**Critérios de Aceite:**
- [ ] Aba de Aparência no painel direito (quando nenhum campo selecionado)
- [ ] Pickers de cor para: fundo, pergunta, resposta, botão
- [ ] Upload de logo (PNG/JPG, max 2MB) → salvo no Supabase Storage
- [ ] Posição do logo: Esquerda / Centro / Direita
- [ ] Upload de imagem de fundo (max 5MB)
- [ ] Seletor de fonte (mínimo: Inter, Poppins, Playfair Display, Roboto, Montserrat)
- [ ] Slider de raio de bordas (0–24px)
- [ ] Preview atualiza em tempo real a cada mudança

**US-3.2.6** — Como consultor, quero publicar ou despublicar meu formulário para controlar quando ele aceita respostas.

**Critérios de Aceite:**
- [ ] Botão "Publicar" na topbar do editor
- [ ] Status pill clicável: Rascunho / Publicado
- [ ] Ao publicar: link público copiável exibido em toast/modal
- [ ] Formulário publicado: aceita respostas na URL `/f/:slug`
- [ ] Formulário rascunho: URL pública retorna 404 / mensagem "Formulário não disponível"

---

### Epic 3.3 — Formulário Público

**US-3.3.1** — Como respondente, quero preencher um formulário conversacional com uma pergunta por tela para ter uma experiência fluida e focada.

**Critérios de Aceite:**
- [ ] URL pública `/f/:slug` acessível sem login
- [ ] Uma pergunta por tela, viewport completo
- [ ] Animação de transição entre perguntas (slide Y + fade)
- [ ] Barra de progresso sutil no topo
- [ ] Welcome screen com título, descrição e botão CTA
- [ ] Thank you screen após envio com animação de sucesso
- [ ] Totalmente responsivo (mobile-first)

**US-3.3.2** — Como respondente, quero navegar pelo formulário com o teclado para preenchê-lo sem tirar as mãos das teclas.

**Critérios de Aceite:**
- [ ] `Enter` avança para próxima pergunta
- [ ] `A, B, C...` seleciona opção em múltipla escolha
- [ ] `1-9` seleciona em escala numérica
- [ ] Hint visual de "pressione Enter ↵" na tela
- [ ] Foco automático no input ao entrar em nova tela

**US-3.3.3** — Como respondente, quero que o formulário carregue rapidamente mesmo em conexão lenta.

**Critérios de Aceite:**
- [ ] First Contentful Paint < 600ms
- [ ] Formulário funcional offline após primeiro load (dados cacheados)
- [ ] Lazy loading do bundle do formulário público (chunk separado)
- [ ] Imagens (logo, fundo) com loading progressivo

---

### Epic 3.4 — Visualização de Respostas

**US-3.4.1** — Como consultor, quero visualizar as respostas individualmente para analisar cada candidato.

**Critérios de Aceite:**
- [ ] Sidebar com lista de respostas (mais recentes primeiro)
- [ ] Área principal mostra resposta selecionada
- [ ] Cada resposta exibe: data/hora, todas as perguntas e respostas formatadas
- [ ] Navegação anterior/próximo
- [ ] Animação de slide entre respostas
- [ ] Contagem total de respostas no header

**US-3.4.2** — Como consultor, quero visualizar todas as respostas em tabela para comparar dados rapidamente.

**Critérios de Aceite:**
- [ ] Toggle "Individual / Tabela" na topbar
- [ ] Tabela com linhas = respondentes, colunas = perguntas
- [ ] Scroll horizontal quando muitas colunas
- [ ] Hover em linha abre detalhe completo em slide-over
- [ ] Células truncam texto longo com tooltip no hover

**US-3.4.3** — Como consultor, quero exportar as respostas em CSV para analisar no Excel/Sheets.

**Critérios de Aceite:**
- [ ] Botão "Exportar CSV" na view de respostas
- [ ] CSV inclui: data, todas as perguntas como colunas, valores como linhas
- [ ] Valores de múltipla escolha concatenados com vírgula
- [ ] Nome do arquivo: `[nome-do-form]-respostas-YYYY-MM-DD.csv`
- [ ] Download direto no browser

---

## 8. PERFORMANCE TARGETS

| Métrica | Target | Estratégia |
|---------|--------|-----------|
| Dashboard load | <500ms | React Query cache + skeleton imediato |
| Editor initial load | <800ms | Lazy import do chunk do editor |
| Public form FCP | <600ms | Chunk separado + React Query prefetch |
| Field reorder perceived latency | 0ms | Otimistic update + save em background |
| Auto-save debounce | 1.5s | `useDebounce` + Zustand `isDirty` |
| API response (auth'd) | <300ms | Supabase indexes otimizados |
| Public form submit | <500ms | Sem joins complexos na inserção |

---

## 9. SEGURANÇA

### 9.1 Proteção do Formulário Público

- Rate limiting: 60 submissões/hora por IP por slug
- Honeypot field (campo oculto CSS — bots preenchem, humanos não)
- Timing check: rejeita submissões com `created_at + 2s > submitted_at` (bots muito rápidos)
- Limite máximo de respostas por formulário (configurável no `settings.closeAfterResponses`)

### 9.2 Upload de Mídia

- Validação MIME no frontend antes do upload
- Supabase Storage policy: apenas imagens `image/png, image/jpeg, image/webp`
- Tamanho máximo: logo 2MB, background 5MB
- Path isolado por usuário: `applications/{user_id}/{application_id}/`

### 9.3 RLS Verificada

- Usuário só acessa seus próprios formulários
- Respostas só visíveis ao dono do formulário
- Formulário público: apenas status `published` retorna dados

---

## 10. ROTAS FRONTEND

Adicionar ao `App.tsx`:

```tsx
// Rotas member (protegidas)
<Route path="/aplicacoes" element={<AplicacoesPage />} />
<Route path="/aplicacoes/:id/editor" element={<EditorPage />} />
<Route path="/aplicacoes/:id/respostas" element={<RespostasPage />} />

// Rota pública (fora do ProtectedRoute)
<Route path="/f/:slug" element={<FormPublicoPage />} />
```

---

## 11. FASES DE EXECUÇÃO

### Fase 1 — Fundação (Backend + DB)
1. Migration `015_applications.sql`
2. Rotas backend: CRUD applications + bulk fields
3. Rota pública: GET form + POST submit
4. Registrar rotas no `app.ts`

### Fase 2 — Dashboard
1. `AplicacoesPage.tsx` — grid de cards
2. `ApplicationCard.tsx` + `FormThumbnail.tsx`
3. `EmptyState.tsx`
4. `api/applications.ts` — client functions
5. Atualizar `FerramentasPage.tsx` com card "Aplicações"
6. Atualizar `App.tsx` com novas rotas

### Fase 3 — Editor
1. `editorStore.ts` — Zustand com auto-save
2. `EditorPage.tsx` — layout 3 painéis
3. `FieldsList.tsx` + `FieldItem.tsx` + drag-and-drop
4. `FieldTypeSelector.tsx` — bottom sheet
5. `LivePreview.tsx` — preview central
6. `FieldOptions.tsx` — painel direito contextual
7. Componentes de campo para o preview

### Fase 4 — Formulário Público
1. `FormPublicoPage.tsx` — route `/f/:slug`
2. `FormRenderer.tsx` — componente principal
3. `WelcomeScreen.tsx` + `ThankYouScreen.tsx`
4. `QuestionScreen.tsx` + `ProgressBar.tsx`
5. Componentes de campo públicos (ShortText, MultipleChoice, etc.)
6. Navegação por teclado

### Fase 5 — Respostas
1. `RespostasPage.tsx` — layout com sidebar
2. Vista individual com animações
3. Vista tabela
4. Export CSV com papaparse

---

## 12. DEPENDÊNCIAS A INSTALAR

```bash
# Frontend
npm install --prefix frontend @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install --prefix frontend papaparse
npm install --prefix frontend --save-dev @types/papaparse

# Backend — sem novas dependências de runtime
```

---

## 13. REFERÊNCIAS

- **Mapeamento Completo do Respondi.app** — `/dev/Obsidian/Ideias/Mapeamento Completo do Respondi.app.md`
- **Epic 1 PRD** — `docs/prd/epic-1.md` (Auth + Consultorias + Credits)
- **Epic 2 PRD** — `docs/prd/epic-2.md` (Member Area + Admin Console)
- **Design System** — `frontend/src/index.css` (CSS variables dark/light)
- **API Client** — `frontend/src/api/client.ts`
- **Auth Middleware** — `backend/src/middleware/auth.ts`

---

*Gerado por AIOX Master Orchestrator com UX Design Expert + Architect*
*Data: 2026-03-14 — Iris SaaS Epic 3*
