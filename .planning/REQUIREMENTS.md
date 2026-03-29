# Requirements: Iris SaaS MVP

**Defined:** 2026-03-28
**Core Value:** A IA de cada consultoria responde com a metodologia real da Iris e com o contexto específico do cliente

## v1 Requirements

### Admin

- [x] **ADMN-01**: Admin pode criar/editar planos Stripe via interface sem terminal
- [ ] **ADMN-02**: Admin pode publicar/despublicar cursos e aulas via interface
- [ ] **ADMN-03**: Admin pode gerenciar usuárias (filtrar, buscar, editar entitlements)
- [ ] **ADMN-04**: Admin pode fazer upload de documentos da metodologia Iris para base de conhecimento global
- [ ] **ADMN-05**: Admin pode testar a IA global com uma pergunta antes de publicar
- [x] **ADMN-06**: Admin consegue navegar entre todas as seções em < 3 cliques
- [ ] **ADMN-07**: Admin visualiza eventos de webhook Stripe recentes

### Checkout

- [ ] **CHKT-01**: Visitante pode ver planos disponíveis sem estar logado
- [ ] **CHKT-02**: Usuária autenticada pode iniciar checkout Stripe a partir da página de planos
- [ ] **CHKT-03**: Após pagamento, usuária é redirecionada para página de confirmação
- [ ] **CHKT-04**: Acesso ao curso e créditos são liberados automaticamente após webhook Stripe
- [ ] **CHKT-05**: Usuária pode ver plano atual e data de renovação em /conta
- [ ] **CHKT-06**: Usuária pode gerenciar assinatura via Stripe Customer Portal

### Knowledge Base (IA)

- [ ] **KNWL-01**: Sistema processa PDF/txt/md e gera chunks com embeddings
- [ ] **KNWL-02**: Admin pode adicionar/remover documentos globais (metodologia Iris)
- [ ] **KNWL-03**: Consultora pode fazer upload de documentos do cliente por consultoria
- [ ] **KNWL-04**: Consultora pode remover documentos da consultoria
- [ ] **KNWL-05**: Chat IA da consultoria usa documentos globais + documentos da consultoria como contexto
- [ ] **KNWL-06**: Interface de upload mostra status (processando / pronto / erro)

### Reuniões

- [ ] **MEET-01**: Consultora pode colar link do Meet e ativar bot com consentimento LGPD
- [ ] **MEET-02**: Bot Recall.ai entra na reunião como "Iris AI Notetaker"
- [ ] **MEET-03**: Transcrição completa aparece na consultoria após fim da reunião
- [ ] **MEET-04**: Resumo executivo gerado automaticamente por GPT-4
- [ ] **MEET-05**: Action items extraídos automaticamente e adicionados à consultoria
- [ ] **MEET-06**: Status do bot em tempo real (aguardando / em reunião / processando / pronto)

### Consultorias v2

- [ ] **CONS-01**: Página de lista mostra KPIs: ativas, em onboarding, reuniões da semana, em risco
- [ ] **CONS-02**: Card de consultoria mostra: nome, @instagram, nicho, etapa, próxima reunião, progresso %
- [ ] **CONS-03**: Wizard de criação em 2 etapas (dados base + contexto estratégico)
- [ ] **CONS-04**: Central da Cliente tem tabs reorganizadas na ordem correta
- [ ] **CONS-05**: Action items de reunião aparecem automaticamente na aba Action Items
- [ ] **CONS-06**: Resumo de reunião aparece na timeline do Overview

## v2 Requirements

### Reuniões — Fase 2

- **MEET-07**: Sala de vídeo nativa com LiveKit (após tração com bot)
- **MEET-08**: Legenda ao vivo via Deepgram durante a chamada

### Formulários — Melhorias

- **FORM-01**: Lógica condicional entre campos
- **FORM-02**: Redirect personalizado pós-envio
- **FORM-03**: Templates de formulário por tipo de consultoria

### Analytics Avançado

- **ANLT-01**: Funil de conversão por formulário
- **ANLT-02**: Cohort retention de usuárias

### Integrações

- **INTG-01**: Webhook Hotmart com checkout nativo
- **INTG-02**: Webhook Kiwify com checkout nativo

## Out of Scope

| Feature | Reason |
|---------|--------|
| App mobile | Web-first; não há demanda imediata |
| LiveKit nativo no MVP | 10-12 semanas de dev; bot valida a feature antes |
| OAuth (Google/GitHub login) | Supabase email/password é suficiente para v1 |
| Onboarding wizard multi-step | Pós-lançamento; fluxo simples é suficiente agora |
| 2FA | Pós-lançamento |
| White-label para outras consultoras | Escopo de produto diferente; fase 2 do negócio |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ADMN-01 | Phase 2 (Admin: Planos Stripe) | Complete |
| ADMN-02 | Phase 3 (Admin: Cursos) | Pending |
| ADMN-03 | Phase 4 (Admin: Usuárias) | Pending |
| ADMN-04 | Phase 5 (Admin: IA Global) | Pending |
| ADMN-05 | Phase 5 (Admin: IA Global) | Pending |
| ADMN-06 | Phase 1 (Admin: Layout) | Complete |
| ADMN-07 | Phase 2 (Admin: Planos Stripe) | Pending |
| CHKT-01 | Phase 6 (Página de Planos) | Pending |
| CHKT-02 | Phase 7 (Stripe Checkout) | Pending |
| CHKT-03 | Phase 8 (Retorno Checkout) | Pending |
| CHKT-04 | Phase 8 (Retorno Checkout) | Pending |
| CHKT-05 | Phase 9 (Conta: Assinatura) | Pending |
| CHKT-06 | Phase 9 (Conta: Assinatura) | Pending |
| KNWL-01 | Phase 10 (Pipeline Embeddings) | Pending |
| KNWL-02 | Phase 11 (API Docs Global) | Pending |
| KNWL-03 | Phase 12 (API Docs Consultoria) | Pending |
| KNWL-04 | Phase 12 (API Docs Consultoria) | Pending |
| KNWL-05 | Phase 13 (Chat RAG) | Pending |
| KNWL-06 | Phase 11 (API Docs Global) | Pending |
| MEET-01 | Phase 14 (Recall.ai Backend) | Pending |
| MEET-02 | Phase 14 (Recall.ai Backend) | Pending |
| MEET-03 | Phase 15 (Pipeline Transcript) | Pending |
| MEET-04 | Phase 15 (Pipeline Transcript) | Pending |
| MEET-05 | Phase 15 (Pipeline Transcript) | Pending |
| MEET-06 | Phase 16 (Reuniões UI) | Pending |
| CONS-01 | Phase 17 (Lista Consultorias KPIs) | Pending |
| CONS-02 | Phase 17 (Lista Consultorias KPIs) | Pending |
| CONS-03 | Phase 18 (Wizard Criação) | Pending |
| CONS-04 | Phase 19 (Central da Cliente Tabs) | Pending |
| CONS-05 | Phase 20 (Integração Reunião→Consultoria) | Pending |
| CONS-06 | Phase 20 (Integração Reunião→Consultoria) | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after PRD approval*
