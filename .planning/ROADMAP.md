# Roadmap: Iris SaaS MVP
## Overview
Projeto brownfield com infraestrutura robusta já construída (auth, área de membros, form builder, consultorias básicas, créditos, webhooks). Os 5 milestones a seguir entregam o que falta para a plataforma ser 100% operacional e lançável: admin que funciona sem terminal, checkout que vende, IA treinada com o método da Iris, reuniões transcritas automaticamente, e uma central da cliente refinada que integra tudo.
## Milestones
- 🚧 **Milestone A — Admin Robusto** - Phases 1-5 (em planejamento)
- 📋 **Milestone B — Checkout Stripe** - Phases 6-9 (planejado)
- 📋 **Milestone C — IA Base de Conhecimento** - Phases 10-13 (planejado)
- 📋 **Milestone D — Reuniões com Transcrição** - Phases 14-16 (planejado)
- 📋 **Milestone E — Central da Cliente v2** - Phases 17-20 (planejado)
## Phases
### Milestone A — Admin Robusto
- [x] **Phase 1: Admin Layout e Navegação** - Redesign do shell do admin com sidebar clara e navegação < 3 cliques (completed 2026-03-29)
- [x] **Phase 2: Admin Planos e Stripe** - Interface para criar/editar planos no Stripe sem terminal (completed 2026-03-29)
- [x] **Phase 3: Admin Cursos** - UX de publicação de cursos e aulas em 1 clique (completed 2026-03-29)
- [x] **Phase 4: Admin Usuários** - Filtros, busca e gestão de entitlements por usuária
- [ ] **Phase 5: Admin IA Global** - Upload de documentos da metodologia Iris e teste da IA
### Milestone B — Checkout Stripe
- [x] **Phase 6: Página de Planos** - Visitante vê planos disponíveis sem estar logado (completed 2026-03-29)
- [x] **Phase 7: Stripe Checkout Session** - Botão "Assinar" redireciona para Stripe real (completed 2026-03-29)
- [x] **Phase 8: Retorno e Confirmação** - Página de sucesso e acesso liberado via webhook (completed 2026-03-29)
- [x] **Phase 9: Conta e Assinatura** - Usuária vê plano atual e acessa portal Stripe (completed 2026-03-29)
### Milestone C — IA Base de Conhecimento
- [x] **Phase 10: Pipeline de Embeddings** - Backend processa PDF/txt e gera chunks indexados no pgvector (completed 2026-03-29)
- [x] **Phase 11: API de Documentos Globais** - Admin gerencia base de conhecimento da metodologia Iris (completed 2026-03-29)
- [x] **Phase 12: API de Documentos por Consultoria** - Consultora sobe documentos do cliente por consultoria (completed 2026-03-30)
- [x] **Phase 13: Chat RAG** - Chat IA usa documentos globais + da consultoria como contexto (completed 2026-03-30)
### Milestone D — Reuniões com Transcrição
- [x] **Phase 14: Integração Recall.ai Backend** - Bot entra no Meet e webhook recebe transcrição (completed 2026-03-30)
- [ ] **Phase 15: Pipeline Transcript → IA** - GPT-4 gera resumo, action items e próximos passos
- [ ] **Phase 16: Reuniões UI** - Modal de ativação do bot e aba de reuniões com status em tempo real
### Milestone E — Central da Cliente v2
- [ ] **Phase 17: Lista de Consultorias com KPIs** - Header com 4 KPIs e cards aprimorados
- [ ] **Phase 18: Wizard de Criação** - Wizard 2 etapas cria consultoria completa em < 3 min
- [ ] **Phase 19: Central da Cliente Tabs** - Tabs reorganizadas na ordem correta com UX refinada
- [ ] **Phase 20: Integração Reunião → Consultoria** - Action items e resumos aparecem automaticamente na Central
---
## Phase Details
### Phase 1: Admin Layout e Navegação
**Goal**: A Iris consegue encontrar qualquer funcionalidade do admin em menos de 3 cliques
**Depends on**: Nothing (codebase brownfield existente)
**Requirements**: ADMN-06
**Success Criteria** (what must be TRUE):
  1. Sidebar do admin tem seções claras: Dashboard, Cursos, Usuárias, Planos/Stripe, IA Global, Configurações
  2. Todas as páginas admin existentes estão linkadas e acessíveis via sidebar
  3. Navegação entre qualquer duas seções do admin requer no máximo 2 cliques
  4. Layout é responsivo e funciona em 375px
**Plans**: 3 plans
Plans:
- [ ] 01-01-PLAN.md — Sidebar flat nav + placeholder pages + routes
- [ ] 01-02-PLAN.md — Decompose 3 largest admin pages (FormacaoPage, TurmasPage, OfertasPage)
- [ ] 01-03-PLAN.md — Decompose 5 remaining admin pages (CursosPage, StripePage, DashboardPage, UsuariosPage, NovaOfertaPage)
### Phase 2: Admin Planos e Stripe
**Goal**: A Iris cria um novo plano (nome, preço, créditos) e ele aparece no Stripe sem abrir terminal
**Depends on**: Phase 1
**Requirements**: ADMN-01, ADMN-07
**Success Criteria** (what must be TRUE):
  1. Página `/admin/planos` lista planos cadastrados com status, preço e créditos
  2. Modal "Novo Plano" cria produto + preço no Stripe via API e salva `stripe_products` localmente
  3. Admin vê eventos de webhook Stripe recentes com UI melhorada
**Plans**: 3 plans
Plans:
- [ ] 02-01-PLAN.md — Backend: DB migration (stripe_products) + Stripe service + admin API routes
- [ ] 02-02-PLAN.md — Frontend: AdminPlanosPage aggregator + PlanCard + PlanFormModal + API client
- [ ] 02-03-PLAN.md — Frontend: WebhooksTab UI improvement (status colors + event labels)
### Phase 3: Admin Cursos
**Goal**: A Iris publica uma aula completa no admin sem ajuda externa
**Depends on**: Phase 2
**Requirements**: ADMN-02
**Success Criteria** (what must be TRUE):
  1. Admin publica ou despublica curso/aula com 1 clique a partir da lista
  2. Upload de thumbnail do curso funciona via interface
  3. Admin consegue associar curso a um plano via dropdown
  4. Organização visual da página de cursos torna o fluxo intuitivo
**Plans**: 3 plans
Plans:
- [ ] 03-01-PLAN.md — Backend: migration course-plan link + atualizar GET/PUT para incluir stripe_product_id
- [ ] 03-02-PLAN.md — Frontend: status tabs, plan dropdown no modal/header, UX polish
- [ ] 03-03-PLAN.md — Backend+Frontend: lesson publish/unpublish (status field + endpoints + UI button)
### Phase 4: Admin Usuários
**Goal**: A Iris encontra uma usuária e altera seu acesso em menos de 1 minuto
**Depends on**: Phase 1
**Requirements**: ADMN-03
**Success Criteria** (what must be TRUE):
  1. Lista de usuárias tem filtros por plano e status, e busca por nome/email
  2. Admin consegue conceder ou revogar acesso a curso específico em 1 ação
  3. Perfil da usuária mostra consumo de créditos
  4. Ação de alterar entitlement persiste corretamente no banco
**Plans**: 2 plans
Plans:
- [x] 04-01-PLAN.md — Backend filters (plan/status) + frontend filter UI on user list
- [x] 04-02-PLAN.md — Course dropdown in grant modal + decompose courses tab
### Phase 5: Admin IA Global
**Goal**: A Iris adiciona um PDF com sua metodologia e consegue testar a resposta da IA com base nele
**Depends on**: Phase 1, Phase 10 (pipeline de embeddings deve existir)
**Requirements**: ADMN-04, ADMN-05
**Success Criteria** (what must be TRUE):
  1. Página `/admin/ia` permite upload de PDF, .txt e .md
  2. Lista mostra documentos indexados com status: processando / pronto / erro
  3. Botão "Remover" deleta documento e seus chunks
  4. Campo "Testar IA" retorna resposta baseada nos documentos indexados
**Plans**: 2 plans
Plans:
- [ ] 05-01-PLAN.md — Backend knowledge routes + frontend API client + types
- [ ] 05-02-PLAN.md — AdminIAPage aggregator + micro-modules (upload, list, test query)
### Phase 6: Página de Planos
**Goal**: Visitante acessa `/planos` e vê todos os planos disponíveis sem precisar estar logado
**Depends on**: Phase 2 (planos devem existir na tabela `stripe_products`)
**Requirements**: CHKT-01
**Success Criteria** (what must be TRUE):
  1. Página `/planos` é acessível sem autenticação
  2. Cards de plano mostram nome, preço, intervalo, créditos e features
  3. Loading state e empty state estão presentes
  4. Layout é mobile-first e funciona em 375px
**Plans**: 2 plans
Plans:
- [ ] 06-01-PLAN.md — Backend public GET /api/plans + frontend API client + React Query hook
- [ ] 06-02-PLAN.md — PlanosPage aggregator + PlanCard micro-module + route wiring
### Phase 7: Stripe Checkout Session
**Goal**: Usuária autenticada clica "Assinar" e é redirecionada para página de checkout real do Stripe
**Depends on**: Phase 6
**Requirements**: CHKT-02
**Success Criteria** (what must be TRUE):
  1. Endpoint `POST /api/stripe/checkout-session` cria sessão Stripe com `success_url` e `cancel_url`
  2. Botão "Assinar" no frontend redireciona para URL da sessão Stripe
  3. Usuária não autenticada é redirecionada para login antes do checkout
  4. Erros do Stripe são tratados com mensagem clara para o usuário
**Plans**: 2 plans
Plans:
- [ ] 07-01-PLAN.md — Backend: POST /api/stripe/checkout-session endpoint
- [ ] 07-02-PLAN.md — Frontend: useCheckout hook + PlanCard/PlanosPage auth gate + checkout redirect
### Phase 8: Retorno e Confirmação
**Goal**: Após pagamento concluído, usuária vê confirmação e tem acesso liberado automaticamente em até 5 minutos
**Depends on**: Phase 7
**Requirements**: CHKT-03, CHKT-04
**Success Criteria** (what must be TRUE):
  1. Página `/checkout/sucesso` mostra confirmação clara com próximos passos e CTA para dashboard
  2. Cancelamento retorna usuária para `/planos`
  3. Webhook `checkout.session.completed` dispara `onboardingService` e libera matrícula + créditos
  4. Acesso ao curso está disponível sem intervenção manual dentro de 5 minutos do pagamento
**Plans**: 2 plans
Plans:
- [ ] 08-01-PLAN.md — Backend: webhook normalizer + onboardingService credit granting
- [ ] 08-02-PLAN.md — Frontend: CheckoutSucessoPage + route wiring


### Phase 9: Conta e Assinatura
**Goal**: Usuária consegue ver seu plano atual e gerenciar ou cancelar assinatura sem contato com admin
**Depends on**: Phase 8
**Requirements**: CHKT-05, CHKT-06
**Success Criteria** (what must be TRUE):
  1. Aba "Assinatura" em `/conta` mostra plano atual, data de renovação e créditos disponíveis
  2. Botão "Gerenciar assinatura" abre Stripe Customer Portal
  3. Informações de assinatura refletem estado real do Stripe
**Plans**: 2 plans
Plans:
- [ ] 09-01-PLAN.md — Backend: subscription record in webhook + account endpoints (subscription info + billing portal)
- [ ] 09-02-PLAN.md — Frontend: decompose ContaPage into 3-layer + SubscriptionCard micro-module
### Phase 10: Pipeline de Embeddings
**Goal**: Upload de PDF de 10 páginas gera chunks indexados no pgvector em menos de 30 segundos
**Depends on**: Nothing (pgvector extension deve estar habilitada no Supabase antes da execucao)
**Requirements**: KNWL-01
**Success Criteria** (what must be TRUE):
  1. Migration 026 cria tabelas knowledge_documents e knowledge_chunks com RLS correto
  2. knowledgeService.ts processa PDF, .txt e .md em chunks de 300-500 tokens com overlap
  3. Embeddings sao gerados via text-embedding-3-small e armazenados como vector(1536)
  4. Metadados de scope, consultancy_id e document_name sao preservados em cada chunk
**Plans**: 1 plan
Plans:
- [ ] 10-01-PLAN.md -- Migration 026 (knowledge tables + pgvector + RLS) + knowledgeService + embeddingService
### Phase 11: API de Documentos Globais
**Goal**: Admin adiciona um documento da metodologia Iris e ele aparece como indexado na interface
**Depends on**: Phase 10
**Requirements**: KNWL-02, KNWL-06
**Success Criteria** (what must be TRUE):
  1. `GET /api/admin/knowledge` retorna lista de documentos globais com status
  2. `POST /api/admin/knowledge` dispara upload + indexação e retorna documento com status `processing`
  3. Status evolui para `ready` ou `error` conforme pipeline conclui
  4. `DELETE /api/admin/knowledge/:id` remove documento e todos os seus chunks
**Plans**: 2 plans
Plans:
- [ ] 11-01-PLAN.md — Backend: admin knowledge routes (GET list, POST upload, DELETE) + app.ts registration
- [ ] 11-02-PLAN.md — Frontend: knowledge.api.ts + useKnowledge hook + AdminIAPage aggregator + KnowledgeUpload + KnowledgeList
### Phase 12: API de Documentos por Consultoria
**Goal**: Consultora sobe PDF do cliente em uma consultoria e ele é usado no chat daquela consultoria
**Depends on**: Phase 10
**Requirements**: KNWL-03, KNWL-04
**Success Criteria** (what must be TRUE):
  1. `GET /api/consultancies/:id/documents` retorna documentos isolados por consultoria
  2. `POST /api/consultancies/:id/documents` faz upload e indexa com `scope = 'consultancy'`
  3. `DELETE /api/consultancies/:id/documents/:docId` remove documento sem afetar outras consultorias
  4. RLS garante que consultora acessa apenas documentos de suas próprias consultorias
**Plans**: 2 plans
Plans:
- [ ] 12-01-PLAN.md — Backend: member document routes (GET/POST/DELETE) + app.ts registration
- [ ] 12-02-PLAN.md — Frontend: consultancyDocuments API + hook + ConsultoriaDocumentos micro-module + tabs wiring
### Phase 13: Chat RAG
**Goal**: Pergunta sobre a metodologia da Iris retorna resposta alinhada com os documentos indexados, usando contexto global + da consultoria
**Depends on**: Phase 11, Phase 12
**Requirements**: KNWL-05
**Success Criteria** (what must be TRUE):
  1. Antes de chamar GPT-4, sistema busca top 5 chunks relevantes via `match_knowledge_chunks()`
  2. Busca combina scope `global` + scope `consultancy` para a consultoria ativa
  3. Chunks injetados no system prompt como contexto adicional
  4. Resposta do chat referencia conteúdo dos documentos quando relevante
**Plans**: 1 plan
Plans:
- [ ] 13-01-PLAN.md — RAG retrieval service + inject context into chatWithAI system prompt
### Phase 14: Integração Recall.ai Backend
**Goal**: Bot entra em reunião real e webhook é recebido e processado pelo sistema
**Depends on**: Nothing (independente, requer conta + API key do Recall.ai)
**Requirements**: MEET-01, MEET-02
**Success Criteria** (what must be TRUE):
  1. Migration 027 cria tabelas `meeting_sessions` e `meeting_transcripts` com RLS correto
  2. `POST /api/meetings/bot` cria bot Recall.ai, salva sessão com status `pending`
  3. Bot entra na reunião identificado como "Iris AI Notetaker"
  4. `POST /webhooks/recall` recebe transcrição raw e salva na sessão correspondente
**Plans**: 2 plans
Plans:
- [ ] 14-01-PLAN.md — Migration 027 (meeting tables + RLS) + recallService + POST /api/meetings/bot
- [ ] 14-02-PLAN.md — Recall.ai webhook receiver (HMAC + transcript storage + status updates)
### Phase 15: Pipeline Transcript → IA
**Goal**: Após reunião, resumo executivo e action items aparecem automaticamente na consultoria sem ação manual
**Depends on**: Phase 14
**Requirements**: MEET-03, MEET-04, MEET-05
**Success Criteria** (what must be TRUE):
  1. `processTranscript()` gera resumo executivo, lista de action items e próximos passos via GPT-4
  2. `meeting_transcripts` salva `formatted_transcript`, `summary` e `speakers`
  3. Action items são inseridos automaticamente na tabela `action_items` da consultoria
  4. Pipeline completa em menos de 10 minutos após fim da reunião
**Plans**: 2 plans
Plans:
- [ ] 15-01-PLAN.md — Migration 028 (summary columns) + transcriptService with processTranscript GPT-4 pipeline
- [ ] 15-02-PLAN.md — Wire processTranscript into recall.ts webhook call_ended handler

### Phase 16: Reuniões UI
**Goal**: Consultora ativa o bot em menos de 30 segundos e acompanha status em tempo real
**Depends on**: Phase 14, Phase 15
**Requirements**: MEET-06
**Success Criteria** (what must be TRUE):
  1. Modal "Nova Reunião" tem campo de link do Meet/Zoom e checkbox de consentimento LGPD obrigatório
  2. Status do bot atualiza em tempo real: aguardando / em reunião / processando / pronto
  3. Aba "Reuniões" lista reuniões com data, status e duração; card expandido mostra transcrição, resumo e action items
  4. Badge de status é visualmente distinto por estado
**Plans**: 2 plans
Plans:
- [ ] 05-01-PLAN.md — Backend knowledge routes + frontend API client + types
- [ ] 05-02-PLAN.md — AdminIAPage aggregator + micro-modules (upload, list, test query)
### Phase 17: Lista de Consultorias com KPIs
**Goal**: Consultora enxerga status de todos os seus clientes de relance ao abrir a página
**Depends on**: Nothing (melhoria sobre página existente)
**Requirements**: CONS-01, CONS-02
**Success Criteria** (what must be TRUE):
  1. Header mostra 4 KPI cards: ativas, em onboarding, reuniões da semana, em risco
  2. Cards mostram nome, @instagram, nicho, etapa, próxima reunião e progresso %
  3. Filtros funcionam por todas, por etapa e por status
  4. Empty state tem value proposition clara e CTA para criar primeira consultoria
**Plans**: 2 plans
Plans:
- [ ] 05-01-PLAN.md — Backend knowledge routes + frontend API client + types
- [ ] 05-02-PLAN.md — AdminIAPage aggregator + micro-modules (upload, list, test query)
### Phase 18: Wizard de Criação
**Goal**: Nova consultoria criada em menos de 3 minutos com todas as informações base e contexto estratégico
**Depends on**: Phase 17
**Requirements**: CONS-03
**Success Criteria** (what must be TRUE):
  1. Etapa 1 coleta: nome, empresa, @instagram, nicho, tipo de consultoria, ticket, data início
  2. Etapa 2 coleta: objetivo principal, dores relatadas, estágio atual, tem equipe, tem site
  3. Consultoria criada tem stage inicial "onboarding" e tabs vazias prontas para uso
  4. Fluxo completo é concluível em menos de 3 minutos
**Plans**: 2 plans
Plans:
- [ ] 05-01-PLAN.md — Backend knowledge routes + frontend API client + types
- [ ] 05-02-PLAN.md — AdminIAPage aggregator + micro-modules (upload, list, test query)
### Phase 19: Central da Cliente Tabs
**Goal**: Consultora encontra qualquer informação da cliente em menos de 2 cliques
**Depends on**: Phase 18
**Requirements**: CONS-04
**Success Criteria** (what must be TRUE):
  1. Tabs seguem a ordem: Overview · Chat IA · Reuniões · Documentos · Diagnóstico · Action Items · Entregas · Memória IA · Dados
  2. Overview mostra: status atual, progresso, próxima reunião, últimas atividades, insight mais recente
  3. Tabs existentes (Chat, Diagnóstico, etc.) têm UX ajustada e funcionam corretamente
  4. Navegação entre tabs é fluida e não perde estado
**Plans**: 2 plans
Plans:
- [ ] 05-01-PLAN.md — Backend knowledge routes + frontend API client + types
- [ ] 05-02-PLAN.md — AdminIAPage aggregator + micro-modules (upload, list, test query)
### Phase 20: Integração Reunião → Consultoria
**Goal**: Após reunião, a Central da Cliente reflete automaticamente o que foi discutido sem ação da consultora
**Depends on**: Phase 15, Phase 16, Phase 19
**Requirements**: CONS-05, CONS-06
**Success Criteria** (what must be TRUE):
  1. Action items gerados pela reunião aparecem automaticamente na aba Action Items
  2. Resumo da reunião aparece na timeline do Overview com data e link para reunião
  3. Transcrição da reunião é indexada e usada como contexto adicional no Chat IA via RAG
  4. Nenhuma ação manual da consultora é necessária para que os dados apareçam
**Plans**: 2 plans
Plans:
- [ ] 05-01-PLAN.md — Backend knowledge routes + frontend API client + types
- [ ] 05-02-PLAN.md — AdminIAPage aggregator + micro-modules (upload, list, test query)
---
## Progress
**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20
**Note:** Phase 5 depends on Phase 10 (embeddings pipeline). Recommended execution: run Phase 10 before Phase 5 if working on Epic C before finishing Epic A.
| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Admin Layout e Navegação | 3/3 | Complete   | 2026-03-29 | - |
| 2. Admin Planos e Stripe | 3/3 | Complete   | 2026-03-29 | - |
| 3. Admin Cursos | 2/3 | In Progress|  | - |
| 4. Admin Usuários | 1/2 | In Progress|  | - |
| 5. Admin IA Global | A — Admin Robusto | 0/TBD | Not started | - |
| 6. Página de Planos | 2/2 | Complete   | 2026-03-29 | - |
| 7. Stripe Checkout Session | 2/2 | Complete   | 2026-03-29 | - |
| 8. Retorno e Confirmação | 2/2 | Complete   | 2026-03-29 | - |
| 9. Conta e Assinatura | 2/2 | Complete   | 2026-03-29 | - |
| 10. Pipeline de Embeddings | 1/1 | Complete    | 2026-03-29 | - |
| 11. API Docs Globais | 2/2 | Complete    | 2026-03-29 | - |
| 12. API Docs por Consultoria | 2/2 | Complete    | 2026-03-30 | - |
| 13. Chat RAG | 1/1 | Complete   | 2026-03-30 | - |
| 14. Integração Recall.ai Backend | 2/2 | Complete    | 2026-03-30 | - |
| 15. Pipeline Transcript → IA | D — Reuniões com Transcrição | 0/TBD | Not started | - |
| 16. Reuniões UI | D — Reuniões com Transcrição | 0/TBD | Not started | - |
| 17. Lista Consultorias KPIs | E — Central da Cliente v2 | 0/TBD | Not started | - |
| 18. Wizard de Criação | E — Central da Cliente v2 | 0/TBD | Not started | - |
| 19. Central da Cliente Tabs | E — Central da Cliente v2 | 0/TBD | Not started | - |
| 20. Integração Reunião → Consultoria | E — Central da Cliente v2 | 0/TBD | Not started | - |
