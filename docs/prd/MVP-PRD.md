# PRD — Iris SaaS MVP Completo
## Product Requirements Document

**Versão:** 1.0
**Data:** 2026-03-28
**Autor:** @pm (via AIOS God Mode + PRD PRO Workflow)
**Status:** Aprovado para execução com GSD

---

## 1. VISÃO GERAL DO PROBLEMA

### 1.1 Contexto

O Iris é um SaaS B2B para consultoras de estratégia de negócios. A plataforma tem infraestrutura robusta já construída (auth, área de membros, form builder, consultorias básicas, créditos, webhooks), mas não está lançável. Os gaps críticos que impedem o lançamento são:

1. **Ninguém consegue comprar** — não existe fluxo de checkout Stripe
2. **A Iris (owner) não consegue operar** — o admin é funcional no código mas está inacessível/confuso visualmente
3. **O diferencial principal não existe** — a IA das consultorias não tem base de conhecimento da metodologia da Iris nem contexto por cliente
4. **O recurso mais poderoso não está construído** — reuniões com transcrição automática via bot

### 1.2 Usuários

| Perfil | Quem é | O que precisa |
|---|---|---|
| **Owner/Admin (Iris)** | A própria criadora do produto | Gerenciar cursos, usuárias, planos, IA — sem terminal |
| **Consultora (membro pagante)** | Consultoras de negócios que compram o plano | Ferramentas para gerenciar clientes, reuniões, IA |
| **Lead/visitante** | Quem chega na plataforma | Ver planos e comprar |

### 1.3 Proposta de Valor Central

> "Tudo que uma consultora de estratégia precisa em um só lugar: gestão de clientes, IA treinada com o método da Iris, reuniões transcritas automaticamente e formulários de qualificação — sem depender de ferramentas externas."

---

## 2. OBJETIVO DO MVP

Entregar uma plataforma **100% operacional e lançável** onde:

- Visitante → vê planos → compra → recebe acesso automático ao curso + ferramentas
- Iris → gerencia tudo pelo admin (cursos, planos, usuárias, IA, Stripe) sem terminal
- Consultora → cria consultorias, usa IA treinada com método da Iris + documentos do cliente, recebe transcrição automática das reuniões
- Sistema de créditos funciona de ponta a ponta

---

## 3. ESCOPO DO MVP

### 3.1 DENTRO do MVP

| Área | Descrição | Estado atual |
|---|---|---|
| **Admin Robusto** | Redesign completo — Stripe config, cursos, usuárias, IA global | Existe parcialmente, não funcional |
| **Checkout + Monetização** | Página de planos + Stripe checkout + acesso automático | Código de webhook existe, checkout não existe |
| **IA Base de Conhecimento** | Metodologia global da Iris (admin) + docs por consultoria (membro) | Não existe |
| **Reuniões com Transcrição** | Bot Recall.ai entra no Meet → transcrição → pipeline IA | Não existe |
| **Central da Cliente (v2)** | Lista melhorada + wizard criação + tabs refinadas + integração IA/reunião | Existe parcialmente |
| **Form Builder** | Já funcional — apenas ajustes pontuais se necessário | ✅ Completo |
| **Área de Membros** | Já funcional — publicar conteúdo via admin | ✅ Completo |

### 3.2 FORA do MVP (próximas versões)

- LiveKit nativo (vídeo dentro do app) — implementar após tração com bot
- Onboarding wizard sofisticado
- Webhooks Hotmart/Kiwify (apenas Stripe no MVP)
- Analytics avançado com funil
- Lógica condicional em formulários
- App mobile
- Templates avançados de consultoria

---

## 4. REGRAS DE NEGÓCIO

### Créditos
- Toda operação de IA consome créditos
- Plano define saldo inicial de créditos
- Compra adicional de créditos via Stripe (avulso)
- Saldo nunca fica negativo — bloqueia operação e mostra CTA de recarga

### Acesso
- Compra de plano → webhook Stripe → onboarding automático (já implementado)
- Plano define quais cursos/módulos estão liberados (entitlements já implementados)
- Admin pode fazer override manual de entitlement por usuária

### IA da Consultoria
- Base global (metodologia Iris) é shared entre todas as consultorias
- Contexto por consultoria = dados cadastrais + documentos do cliente + memórias + transcrições
- Cada operação IA usa: [base global] + [contexto específico da consultoria]
- Consultor pode adicionar/remover documentos do cliente a qualquer momento

### Reuniões
- Bot só entra se consentimento explícito foi dado (checkbox antes de ativar)
- Bot aparece como "Iris AI Notetaker" na reunião
- Transcrição aparece na consultoria após o fim da reunião (~5 min processamento)
- Action items extraídos automaticamente e adicionados à lista da consultoria

### Admin
- Apenas `role = admin` acessa o painel admin
- Admin pode configurar produtos Stripe via UI (sem terminal)
- Admin pode publicar/despublicar cursos e aulas
- Admin pode gerenciar base de conhecimento global da IA

---

## 5. REQUISITOS FUNCIONAIS

### RF01 — Admin: Configuração Stripe
- Admin cria/edita produtos e preços no Stripe via interface
- Admin visualiza status dos planos cadastrados
- Admin configura webhook secret do Stripe
- Admin vê eventos de webhook recentes

### RF02 — Admin: Gestão de Cursos e Conteúdo
- Admin cria/edita/publica cursos, módulos e aulas
- Admin faz upload de vídeos (link externo ou storage)
- Admin define quais planos têm acesso a quais cursos
- Admin visualiza progresso das alunas por curso

### RF03 — Admin: Gestão de Usuárias
- Admin lista usuárias com filtros (plano, status, data)
- Admin edita entitlements de uma usuária individualmente
- Admin suspende/reativa acesso
- Admin visualiza consumo de créditos por usuária

### RF04 — Admin: Configuração da IA Global
- Admin gerencia documentos da base de conhecimento da Iris
- Admin pode adicionar/remover/atualizar documentos (PDF, .txt, .md)
- Admin visualiza lista de documentos indexados
- Admin pode testar a IA com uma pergunta antes de publicar

### RF05 — Checkout e Monetização
- Página `/planos` mostra cards de planos com preços e features
- Botão "Assinar" inicia sessão Stripe Checkout
- Após pagamento, usuária é redirecionada para dashboard com acesso liberado
- E-mail de boas-vindas enviado automaticamente
- Usuária consegue ver/gerenciar assinatura na página `/conta`

### RF06 — IA da Consultoria: Base de Conhecimento por Cliente
- Aba "Documentos" dentro de cada consultoria
- Upload de arquivos (PDF, .txt, .docx) — max 10MB por arquivo, 50MB por consultoria
- Lista de documentos com nome, tamanho, data de upload
- Opção de remover documento
- IA usa automaticamente esses documentos no chat da consultoria

### RF07 — Reuniões com Transcrição
- Modal "Nova Reunião" dentro de consultoria
- Campo para colar link do Google Meet / Zoom
- Checkbox de consentimento LGPD (obrigatório)
- Sistema dispara bot Recall.ai com o link
- Aba "Reuniões" mostra: status, data, transcrição, resumo, action items
- Action items automaticamente adicionados à lista da consultoria
- Reunião aparece na timeline da consultoria

### RF08 — Central da Cliente (Consultorias v2)
- Página de lista com KPIs: ativas, em onboarding, reuniões da semana, em risco
- Cards com: nome cliente, @instagram, nicho, etapa, próxima reunião, progresso %
- Wizard de criação em 2 etapas: dados base + contexto estratégico
- Detalhe (Central) com tabs: Overview, Dados, Chat IA, Reuniões, Diagnóstico, Documentos, Action Items, Entregas, Memória IA

---

## 6. REQUISITOS NÃO FUNCIONAIS

- **Performance:** lista de consultorias carrega em < 1s; chat IA responde em < 5s
- **Segurança:** RLS obrigatório em todas as tabelas; webhook Stripe com signature verification
- **LGPD:** consentimento explícito antes de ativar gravação; bot visível com nome identificável
- **Responsividade:** todas as páginas funcionam em mobile (mínimo 375px)
- **Feedback visual:** loading states em todas as operações assíncronas; empty states com CTA

---

## 7. DEPENDÊNCIAS TÉCNICAS

| Dependência | Uso | Status |
|---|---|---|
| Supabase + pgvector | RAG chunks da base de conhecimento | A configurar (pgvector extension) |
| OpenAI API | Chat IA + embeddings + resumos | ✅ Configurado |
| Recall.ai API | Bot de reunião | A criar conta + API key |
| Stripe API + MCP | Checkout + produtos + webhooks | ✅ MCP disponível |
| Supabase Storage | Upload de documentos | ✅ Já usado para avatares |

---

## 8. ARQUITETURA TÉCNICA (DECISÕES)

### IA da Consultoria — Stack RAG

```
Documento uploaded (PDF/txt/docx)
  → parse + chunk (por parágrafo, 300–500 tokens)
  → embedding via OpenAI text-embedding-3-small
  → armazenar no Supabase (tabela knowledge_chunks com vector(1536))
  → no chat: query → embedding → match_knowledge_chunks() → contexto → GPT-4
```

**Dois escopos de conhecimento:**
1. `scope = 'global'` — base de conhecimento Iris (admin gerencia, compartilhada)
2. `scope = 'consultancy'` — documentos do cliente (por `consultancy_id`)

**No chat da consultoria:** busca em ambos os escopos, prioriza global para metodologia + consultancy para contexto do cliente.

### Reuniões — Stack Bot

```
POST /api/meetings/bot (Recall.ai)
  → Bot entra no Meet como "Iris AI Notetaker"
  → Reunião acontece
  → Webhook /webhooks/recall → recebe transcript
  → GPT-4: resumo + action items + speaker labels
  → Salva meeting_sessions + meeting_transcripts
  → Action items → tabela action_items da consultoria
```

### Stripe Checkout — Fluxo

```
GET /api/stripe/products (list products+prices)
  → Frontend renderiza /planos
  → POST /api/stripe/checkout-session (cria sessão)
  → Redirect para Stripe Checkout
  → success_url + cancel_url
  → Webhook checkout.session.completed → onboardingService (JÁ EXISTE)
  → Usuária liberada automaticamente
```

---

## 9. MIGRAÇÕES DE BANCO NECESSÁRIAS

### Migration 023 — Knowledge Base

```sql
-- Habilitar pgvector (via Supabase Dashboard)
CREATE EXTENSION IF NOT EXISTS vector;

-- Base de conhecimento (global + por consultoria)
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'consultancy')),
  consultancy_id UUID REFERENCES consultancies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT,
  content TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  chunk_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  consultancy_id UUID,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para busca semântica
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  p_scope TEXT,
  p_consultancy_id UUID DEFAULT NULL
) RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT kc.id, kc.content, kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE (kc.scope = 'global' OR kc.consultancy_id = p_consultancy_id)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Global: todos lêem, apenas admin escreve
CREATE POLICY "global_docs_read" ON knowledge_documents FOR SELECT USING (scope = 'global');

-- Consultancy: owner da consultoria lê/escreve
CREATE POLICY "consultancy_docs_owner" ON knowledge_documents
  FOR ALL USING (
    scope = 'consultancy' AND
    EXISTS (SELECT 1 FROM consultancies c WHERE c.id = consultancy_id AND c.user_id = auth.uid())
  );
```

### Migration 024 — Meeting Sessions

```sql
CREATE TABLE meeting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultancy_id UUID NOT NULL REFERENCES consultancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  bot_id TEXT,
  meeting_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'joining', 'in_meeting', 'done', 'error')),
  consent_given BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES meeting_sessions(id) ON DELETE CASCADE,
  raw_transcript JSONB,
  formatted_transcript TEXT,
  summary TEXT,
  speakers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meeting_sessions_owner" ON meeting_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "meeting_transcripts_owner" ON meeting_transcripts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meeting_sessions ms WHERE ms.id = session_id AND ms.user_id = auth.uid())
  );
```

### Migration 025 — Stripe Products

```sql
CREATE TABLE stripe_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_amount INT, -- em centavos
  price_currency TEXT DEFAULT 'brl',
  interval TEXT CHECK (interval IN ('month', 'year', 'one_time')),
  credits_included INT DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link entre plano e cursos
CREATE TABLE plan_courses (
  plan_id UUID REFERENCES stripe_products(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, course_id)
);
```

---

## 10. EPICS E STORIES

---

### EPIC A — Admin Robusto

**Objetivo:** A Iris consegue operar o sistema inteiro via interface admin, sem terminal.

**Stories:**

#### A1 — Admin: Layout e Navegação Reorganizados
- Redesign do shell do admin com sidebar clara por seção
- Seções: Dashboard, Cursos, Usuárias, Planos/Stripe, IA Global, Configurações
- Todas as páginas existentes linkadas corretamente
- Critério: Iris consegue encontrar qualquer funcionalidade em < 3 cliques

#### A2 — Admin: Gestão de Planos e Stripe
- Página `/admin/planos` lista planos cadastrados com status, preço, créditos
- Modal "Novo Plano": nome, descrição, preço, intervalo, créditos, cursos incluídos
- Integra com Stripe API via MCP: cria produto + preço no Stripe
- Salva `stripe_products` + `stripe_price_id` localmente
- Admin vê eventos de webhook recentes (já existe — melhorar UI)
- Critério: Iris cria um plano novo sem abrir o terminal

#### A3 — Admin: Gestão de Cursos (melhorias)
- Existente: AdminCursoDetailPage.tsx — verificar o que está quebrado/feio
- Melhorias UX: organização visual, publicar/despublicar com 1 click
- Upload de thumbnail do curso
- Associar curso a plano(s) (dropdown de planos criados em A2)
- Critério: Iris publica uma aula completa sem ajuda

#### A4 — Admin: Gestão de Usuárias (melhorias)
- Existente: AdminUsuariosPage.tsx + AdminUserDetailPage.tsx
- Melhorias: filtros por plano/status, busca por nome/email
- Ação rápida: conceder/revogar acesso a curso específico
- Visualizar consumo de créditos por usuária
- Critério: Iris encontra uma usuária e altera acesso em < 1 min

#### A5 — Admin: Configuração da IA Global (base de conhecimento)
- Página `/admin/ia` — nova
- Upload de documentos da metodologia Iris (PDF, .txt, .md)
- Lista de documentos indexados com status (processando / pronto / erro)
- Botão "Remover" por documento
- Campo "Testar IA": digitar pergunta e ver resposta com base no que foi indexado
- Critério: Iris adiciona um PDF com sua metodologia e consegue testar

---

### EPIC B — Checkout e Monetização

**Objetivo:** Qualquer pessoa consegue comprar um plano e ter acesso liberado automaticamente.

**Stories:**

#### B1 — Página de Planos (`/planos`)
- Busca planos ativos da tabela `stripe_products`
- Cards com: nome, preço, interval, créditos, features, cursos incluídos
- CTA "Assinar" por plano
- Design limpo, mobile-first
- Estado de loading e empty state
- Critério: visitante vê planos disponíveis sem estar logado

#### B2 — Stripe Checkout Session
- Endpoint: `POST /api/stripe/checkout-session` (autenticado)
- Recebe `priceId` + `userId`
- Cria sessão Stripe Checkout com `success_url` e `cancel_url`
- Retorna `sessionUrl` para o frontend redirecionar
- Critério: botão "Assinar" redireciona para página Stripe real

#### B3 — Stripe Checkout: Retorno e Feedback
- `success_url`: `/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`
- Página de sucesso mostra: confirmação + próximos passos + CTA para dashboard
- `cancel_url`: volta para `/planos`
- Critério: após pagamento, usuária vê confirmação clara

#### B4 — Webhook → Acesso Automático (validação)
- Verificar que o `onboardingService.ts` já existente funciona end-to-end
- Testar cenário: checkout completo → webhook → matrícula no curso → créditos alocados
- Corrigir qualquer gap no fluxo existente
- Critério: 5 minutos após pagamento, acesso está liberado sem intervenção manual

#### B5 — Página de Conta: Assinatura
- `/conta` → aba "Assinatura"
- Mostra: plano atual, data renovação, créditos disponíveis
- Botão "Gerenciar assinatura" → portal Stripe Customer Portal
- Critério: usuária consegue ver status e cancelar sem contato com admin

---

### EPIC C — IA Base de Conhecimento

**Objetivo:** A IA das consultorias responde com a metodologia real da Iris e com contexto específico do cliente.

**Stories:**

#### C1 — Pipeline de Embeddings (backend)
- Serviço `knowledgeService.ts`: parse PDF/txt → chunks → embedding OpenAI → pgvector
- Suporte a: PDF (via pdf-parse), .txt, .md
- Chunk strategy: por parágrafo, máx 500 tokens, overlap 50 tokens
- Metadata: `{ scope, consultancy_id, document_name, chunk_index }`
- Critério: upload de PDF de 10 páginas gera chunks indexados em < 30s

#### C2 — API de Documentos (global)
- `GET /api/admin/knowledge` — lista documentos globais (admin only)
- `POST /api/admin/knowledge` — upload + trigger de indexação
- `DELETE /api/admin/knowledge/:id` — remove documento + chunks
- Critério: admin adiciona documento e ele aparece indexado

#### C3 — API de Documentos (por consultoria)
- `GET /api/consultancies/:id/documents` — lista documentos da consultoria
- `POST /api/consultancies/:id/documents` — upload + indexação
- `DELETE /api/consultancies/:id/documents/:docId` — remove
- Critério: consultora sobe PDF do cliente e ele é usado no chat

#### C4 — Frontend: Aba Documentos na Consultoria
- Aba "Documentos" em ConsultoriaDetailPage
- Dropzone de upload com feedback de progresso
- Lista de documentos: nome, tamanho, status, data, botão remover
- Empty state com instrução clara
- Critério: consultora faz upload em < 3 cliques e vê confirmação

#### C5 — Chat IA aprimorado com RAG
- `consultancyAIService.ts`: antes de chamar GPT-4, buscar chunks relevantes
- Hybrid: `match_knowledge_chunks(query_embedding, scope='global') + scope='consultancy'`
- Top 5 chunks injetados no system prompt como contexto adicional
- Critério: pergunta sobre metodologia retorna resposta alinhada com doc da Iris

---

### EPIC D — Reuniões com Transcrição (Bot API)

**Objetivo:** Consultora cola o link do Meet → bot entra → transcrição + resumo aparecem automaticamente na consultoria.

**Decisão técnica:** Recall.ai para MVP (SOC-2, $0,50/hora, sem fee mensal).

**Stories:**

#### D1 — Integração Recall.ai (backend)
- Migration 024: tabelas `meeting_sessions` + `meeting_transcripts`
- `POST /api/meetings/bot` — cria bot com Recall.ai, salva sessão
- `POST /webhooks/recall` — recebe transcript, salva, dispara pipeline
- Serviço `meetingBotService.ts`:
  - `createBot(meetingUrl, consultancyId, userId)`
  - `processTranscript(sessionId, rawTranscript)`
- Critério: bot entra em reunião real e webhook é recebido

#### D2 — Pipeline Transcript → IA
- `processTranscript()` chama GPT-4 com a transcrição raw
- Gera: resumo executivo + lista de action items + próximos passos
- Salva `meeting_transcripts` com `formatted_transcript`, `summary`, `speakers`
- Action items → inserir em `action_items` da consultoria (já existe)
- Critério: após reunião, resumo e action items aparecem automaticamente

#### D3 — Frontend: Modal "Nova Reunião"
- Botão "Adicionar IA à Reunião" na aba Reuniões da consultoria
- Modal com: campo de link do Meet, checkbox de consentimento LGPD
- Status em tempo real: "Aguardando bot entrar" → "Em reunião" → "Processando" → "Pronto"
- Critério: consultora ativa o bot em < 30 segundos

#### D4 — Frontend: Aba Reuniões na Consultoria
- Lista de reuniões com: data, status, duração estimada
- Card expandido de cada reunião: transcrição completa, resumo, action items gerados
- Badge de status: pendente / em andamento / processando / concluído
- Critério: consultora acessa a transcrição completa da reunião

---

### EPIC E — Central da Cliente (Consultorias v2)

**Objetivo:** A página de consultorias se torna o centro operacional da consultora, com todas as informações visíveis e acessíveis.

**Stories:**

#### E1 — Lista de Consultorias com KPIs
- Header com 4 KPI cards: ativas, em onboarding, reuniões da semana, em risco
- Cards aprimorados: @instagram, nicho, etapa, próxima reunião, progresso %, pendências
- Filtros: todas, por etapa, por status
- Empty state melhorado com value proposition clara
- Critério: consultora enxerga status de todos os clientes de relance

#### E2 — Wizard de Criação (2 etapas)
- Etapa 1: dados base (nome, empresa, @instagram, nicho, tipo consultoria, ticket, data início)
- Etapa 2: contexto estratégico (objetivo principal, dores relatadas, estágio atual, tem equipe?, tem site?)
- Criação gera: perfil completo + stage inicial "onboarding" + tabs vazias + agente IA pronto
- Critério: nova consultoria criada em < 3 minutos com todas as informações

#### E3 — Central da Cliente: Tabs Reorganizadas
- Ordem de tabs: Overview · Chat IA · Reuniões · Documentos · Diagnóstico · Action Items · Entregas · Memória IA · Dados
- Overview: status atual, progresso, próxima reunião, últimas atividades, insight mais recente
- Tabs já existentes (Chat, Diagnóstico, etc.) — verificar estado e ajustar UX
- Critério: consultora encontra qualquer informação em < 2 cliques

#### E4 — Integração: Reunião → Consultoria
- Action items de reunião aparecem automaticamente em Action Items tab
- Resumo de reunião aparece na timeline do Overview
- Transcrição usada como contexto adicional no Chat IA (via RAG)
- Critério: após reunião, a Central reflete o que foi discutido

---

## 11. CRITÉRIOS DE ACEITAÇÃO GLOBAIS DO MVP

- [ ] Visitante acessa `/planos`, escolhe um plano e conclui pagamento via Stripe
- [ ] 5 minutos após pagamento, acesso ao curso e créditos estão liberados sem intervenção manual
- [ ] Iris cria um novo plano no admin (nome, preço, créditos) sem terminal
- [ ] Iris publica uma aula no admin sem terminal
- [ ] Iris sobe um PDF da metodologia no admin, ele é indexado, e a IA responde baseada nele
- [ ] Consultora cria uma nova consultoria pelo wizard em < 3 min
- [ ] Consultora sobe documentos do cliente e a IA usa esses documentos no chat
- [ ] Consultora cola link do Meet, bot entra, e 10 minutos após o fim da reunião a transcrição e action items aparecem na consultoria
- [ ] Todas as páginas funcionam em mobile (375px mínimo)
- [ ] Sistema de créditos impede operação quando saldo = 0

---

## 12. RISCOS

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| pgvector não está habilitado no Supabase | Média | Alto | Habilitar via dashboard antes de começar Epic C |
| Recall.ai bot bloqueado pelo Google Meet | Baixa | Alto | Bot identificado, já é prática comum — monitorar |
| OpenAI embeddings com latência alta | Baixa | Médio | Cache de embeddings; processar em background |
| Stripe webhook não chegando em localhost | Alta (dev) | Médio | Usar Stripe CLI para dev local |
| Checkout sem tratamento de erro claro | Média | Médio | Estados de erro explícitos em B2/B3 |

---

## 13. ORDEM DE EXECUÇÃO RECOMENDADA (GSD)

A execução deve seguir a **dependência real entre epics**:

```
Epic A (Admin) ──────────────────────────────────► pode iniciar imediatamente
Epic B (Checkout) ────────────────────────────────► pode iniciar imediatamente
Epic C (IA Base) ─────────────────────────────────► depende de pgvector habilitado
Epic D (Reuniões) ────────────────────────────────► independente, pode ser paralelo
Epic E (Consultorias v2) ─► depende de C + D para integração total

Sequência recomendada:
  Semana 1: A1 + A2 + B1 + B2 + B3 (admin base + checkout)
  Semana 2: A3 + A4 + B4 + C1 + C2 (conteúdo admin + RAG global)
  Semana 3: C3 + C4 + C5 + D1 + D2 (docs por consultoria + reuniões backend)
  Semana 4: D3 + D4 + E1 + E2 + E3 + E4 (reuniões UI + consultorias v2)
  Buffer:   A5 + testes + ajustes finais
```

---

## 14. OBSERVAÇÕES PARA EXECUÇÃO COM GSD

- Cada **Epic** = um **Milestone** no GSD
- Cada **Story** = uma **Phase** no GSD
- Iniciar com `/gsd:new-milestone` para cada epic
- Executar com `/gsd:execute-phase` story por story
- Verificar com `/gsd:verify-work` ao final de cada phase
- Commits atômicos por story, não por arquivo

---

*PRD gerado via @pm — AIOS God Mode + PRD PRO Workflow — 2026-03-28*
