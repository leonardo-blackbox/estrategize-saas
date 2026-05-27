# Epic 10 — Meta API Foundation (Onda 1)
## Product Requirements Document

**Status:** Ready for Implementation
**Versão:** 1.0
**Data:** 2026-05-26
**Autores:** Claude Code (planejamento) + Leonardo Rodrigues (decisões de produto)
**Origem:** Pesquisa `Obsidian/01 - Projetos/Estrategize-saas/Pesquisas e referências/12 - Upgrades Meta API — Consultoria e Ferramentas.md`

---

## 1. VISÃO DO PRODUTO

### 1.1 Sumário Executivo

A Onda 1 do plano de upgrades com Meta API estabelece a **fundação técnica** para que o Iris passe de "scrape inteligente" para "co-piloto operacional do Instagram da cliente". Ela destrava as ondas 2 (Engagement Layer) e 3 (Ads & Intelligence) entregando, sozinha, um diferencial competitivo imediato: o painel de Instagram Insights deixa de ser baseado em scraping público para usar dados oficiais — incluindo demografia real, saves, shares, watch time, profile visits e audiência engajada.

O resultado direto: **o diagnóstico do método Iris ganha evidência numérica**, deixando de ser genérico para virar forense.

### 1.2 Problema que Resolve

O painel atual de Instagram Insights (`ConsultoriaDetailInstagramInsights`) consome dados via Apify scraping, que entrega apenas o que é público:

| Métrica | Apify (hoje) | Meta API oficial |
|---|---|---|
| Followers, posts count, likes, comments | ✅ | ✅ |
| Reach, Views, Accounts Engaged | ❌ | ✅ |
| Saves, Shares, Profile Visits, Follows do post | ❌ | ✅ |
| Reels: Avg Watch Time, Total Watch Time, Replays | ❌ | ✅ |
| Stories (efêmeras em 24h) | ❌ | ✅ |
| Demografia (age × gender × cidade × país) | ❌ | ✅ |
| Audiência engajada vs seguidores | ❌ | ✅ |
| Webhooks em tempo real | ❌ | ✅ |

O consultor estratégico não consegue tomar decisão informada sem **saves, shares, watch time e demografia engajada**. Esses são os números que separam consultoria séria de palpite.

### 1.3 Proposta de Valor

| Antes (Apify only) | Depois (Onda 1 entregue) |
|---|---|
| Engagement rate calculado de likes+comments públicos | Reach, accounts engaged, profile visits, follows funnel oficial |
| Sem demografia | Pirâmide etária × gênero × top 5 cidades × top 5 países (própria + engajados) |
| Sem retention de Reels | Avg watch time, total watch time, replays, skip rate |
| Stories: cego | Snapshot a cada 6h antes de expirarem |
| Diagnóstico Iris genérico | Diagnóstico forense com evidência: "Saves caíram 40% mês-a-mês — investigar carrossel X" |

---

## 2. DECISÕES ARQUITETURAIS

### 2.1 Estratégia híbrida Meta API + Apify

A Meta API oficial cobre dados próprios das consultoradas (clientes que conectam OAuth). Apify continua para edge cases que a API oficial NÃO entrega:

| Caso | Fonte |
|---|---|
| Consultoria conectou Instagram via OAuth | **Meta API oficial** |
| Consultoria sem conexão (fallback) | **Apify** |
| Concorrentes Business/Creator (futuro, Onda 3) | **Meta API: Business Discovery** |
| Concorrentes pessoais/privados, stories alheias, discovery por nicho | **Apify** |

O sistema detecta automaticamente qual fonte usar.

### 2.2 OAuth Flow — Instagram Business Login (atualizado 2026-05-27)

**Fluxo escolhido:** **Instagram Business Login** (direto, sem Page intermediária). Recomendado pela Meta em 2026, mais simples para o usuário (2-3 cliques vs 5-6 do Facebook Login).

**Trade-off aceito:** suporta apenas contas IG **Business** (não Creator). Para o ICP do Iris (empresárias que pagam consultoria), Business é o padrão.

```
1. Frontend: ConnectInstagramButton → POST /api/meta/oauth/start
2. Backend gera state token + URL de autorização Instagram:
   https://www.instagram.com/oauth/authorize?
     client_id=${IG_APP_ID}
     &redirect_uri=${REDIRECT_URI}
     &response_type=code
     &scope=instagram_business_basic,instagram_business_manage_insights,
            instagram_business_manage_comments,instagram_business_manage_messages,
            instagram_business_content_publish
     &state=${state}
3. User aprova direto no Instagram → callback GET /api/meta/oauth/callback?code=...&state=...
4. Backend: troca code → short-lived token via POST https://api.instagram.com/oauth/access_token
5. Backend: troca short → long-lived (60d) via GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token
6. Backend: identifica conta via GET https://graph.instagram.com/me?fields=user_id,username,account_type
7. Backend: valida account_type === 'BUSINESS' (rejeita PERSONAL; CREATOR só suportado se Meta liberar via IBL)
8. Backend: encripta access_token via pgcrypto + salva em instagram_official_connections
9. Frontend: tela de sucesso, redirect para tab Instagram
```

**Permissões pedidas (todas em Standard Access durante dev):**
- `instagram_business_basic` — perfil, lista de mídia, identidade
- `instagram_business_manage_insights` — **CORE da Onda 1** — métricas de conta, mídia, audiência
- `instagram_business_manage_comments` — Onda 2, mas já pedida agora para evitar segunda review
- `instagram_business_manage_messages` — Onda 2, mas já pedida agora
- `instagram_business_content_publish` — Onda 2, mas já pedida agora

**Permissões NÃO necessárias** (vs PRD anterior): `pages_*` e `business_management` ficam dispensáveis porque o fluxo é direto via Instagram, sem passar por Page.

**Base URL da Graph API:** `https://graph.instagram.com/` (não `graph.facebook.com/` — diferença importante para Story 10.3).

**Endpoint de refresh:** `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=...` (não `fb_exchange_token`).

**Validação no app Meta (estado atual 2026-05-27):**
- App: `Sensor Eleitoral` (sub-config Instagram aparece como `Vanttage-IG` — ambos a renomear para nome neutro tipo "Grupo Blackbox")
- Business Verification: ✅ CNPJ Estrategize concluída
- Casos de uso ativos: Marketing API + Anúncios de Apps + Threads + WhatsApp ✅ + **Gerenciar mensagens e conteúdo no Instagram** ✅ + **Gerenciar tudo na sua Página** ✅
- 5 permissões `instagram_business_*` adicionadas em Standard Access
- Tech Provider status: ⏳ a verificar
- Standard Access suficiente para Stories 10.1-10.6 com conta de teste interna ao Business Manager
- Advanced Access apenas antes do go-live público (após screencasts)
- Versão da API: **v25.0**

### 2.3 Token Vault

- `access_token` armazenado em `instagram_official_connections.access_token_encrypted` via `pgp_sym_encrypt(token, key)` do pgcrypto
- Key vem de `META_TOKEN_ENCRYPTION_KEY` env var (32 bytes random, gerado uma vez via `openssl rand -hex 32`)
- Decrypt SÓ no backend, nunca expõe ao frontend
- Refresh automático: cron diário verifica `expires_at` e roda `GET /refresh_access_token` se faltam <14d
- Webhook `user_deauthorize` da Meta marca conexão como `status = 'revoked'` imediatamente

### 2.4 Rate Limiting

A Meta API impõe **200 calls/h/conta autorizada (BUC — Business Use Case)**. Para suportar escala:

- **Cache em memória** (in-process Map com TTL) por padrão; Redis quando o backend evoluir para multi-instância
- **TTL por tipo:**
  - Account insights agregados: 1 hora
  - Media list: 30 minutos
  - Media insights individual: 6 horas
  - Demographics: 24 horas (mudam pouco)
- **Batch field selection:** sempre pedir múltiplas métricas numa única chamada (`fields=reach,views,accounts_engaged,profile_views`)
- **Cron-driven snapshot diário** evita queries on-demand sob carga
- **Stories cron a cada 6h** porque dados expiram em 24h

### 2.5 Schema do Banco

5 tabelas novas em uma única migration (`035_meta_foundation.sql`):

```
instagram_official_connections    ← token vault + estado da conexão
instagram_insights_daily          ← snapshot diário de métricas de conta
instagram_media_insights          ← métricas por post/reel (capturadas no snapshot diário)
instagram_audience_snapshots      ← demografia (capturada diariamente)
instagram_stories_insights        ← stories ativas (capturadas a cada 6h)
```

Detalhes completos em Story 10.1.

### 2.6 Compatibilidade com sistema atual

Esta Onda **não quebra nada existente:**

- O painel atual (`ConsultoriaDetailInstagramInsights`) ganha modo dual: oficial OU Apify
- O plugin `pesquisa-mercado` continua usando Apify por enquanto (Onda 3 migra para Business Discovery)
- O serviço `instagramScanService` (Apify) continua intocado
- O `irisAIService.generateDiagnosis()` ganha overload (parâmetro opcional `instagramConnectionId`) — quem não passa cai no comportamento atual

---

## 3. ESCOPO

### 3.1 In Scope (Onda 1)

| Item | Story |
|---|---|
| Migration de 5 tabelas + RLS + pgcrypto | 10.1 |
| OAuth flow completo (start + callback + revoke + webhook deauthorize) | 10.2 |
| Componente `ConnectInstagramButton` na tab Instagram | 10.2 |
| `metaInsightsService.ts` (account + media + audience) com retry e rate limit | 10.3 |
| Endpoints REST de leitura de insights | 10.3 |
| Cron diário @ 03:00 BRT (account + media + audience) | 10.4 |
| Cron stories a cada 6h | 10.4 |
| Endpoint manual de trigger admin | 10.4 |
| Upgrade do painel `ConsultoriaDetailInstagramInsights` com 7 micro-módulos novos | 10.5 |
| Hook `useMetaInsights` (React Query) | 10.5 |
| Fallback Apify para consultorias sem conexão | 10.5 |
| Upgrade do `irisAIService.generateDiagnosis()` aceitando dados oficiais | 10.6 |
| Endpoint `POST /api/diagnosis/:consultancyId/generate-with-insights` | 10.6 |
| Botão "Gerar com dados oficiais" na tab Diagnosis | 10.6 |

### 3.2 Out of Scope (deixar para outras ondas)

| Item | Onda |
|---|---|
| Webhooks Meta (comments, mentions, messages, story_insights) | 2 |
| Inbox de comentários e DMs | 2 |
| Content Publishing (criar/publicar posts via API) | 2 |
| Calendário Editorial | 2 |
| Apollo IG (DMs via Apollo) | 2 |
| Marketing API / Ads / CAPI | 3 |
| Business Discovery API para concorrentes | 3 |
| Hashtag Search API | 3 |
| Concorrentes Watch | 3 |

---

## 4. ARQUITETURA TÉCNICA

### 4.1 Estrutura de arquivos novos

```
backend/src/
├── database/migrations/
│   └── 035_meta_foundation.sql              ← Story 10.1
├── services/
│   ├── metaOAuthService.ts                  ← Story 10.2
│   ├── metaTokenService.ts                  ← Story 10.2 (encrypt/decrypt)
│   ├── metaInsightsService.ts               ← Story 10.3
│   ├── metaSnapshotService.ts               ← Story 10.4
│   └── metaInsightsCache.ts                 ← Story 10.3 (in-memory cache)
├── routes/
│   ├── metaOAuth.ts                         ← Story 10.2
│   └── metaInsights.ts                      ← Story 10.3
├── crons/
│   └── metaSnapshotCron.ts                  ← Story 10.4
└── types/
    └── metaApi.ts                           ← shared types (todas stories)

frontend/src/
├── api/
│   └── meta.ts                              ← client functions
├── features/consultorias/
│   ├── components/
│   │   ├── ConnectInstagramButton/          ← Story 10.2
│   │   └── ConsultoriaDetailInstagramInsights/
│   │       ├── HeroMetricsOfficial/         ← Story 10.5
│   │       ├── AudienceDemographicsPanel/   ← Story 10.5
│   │       ├── EngagedVsFollowersGap/       ← Story 10.5
│   │       ├── ReelsRetentionPanel/         ← Story 10.5
│   │       ├── PostingHeatmap/              ← Story 10.5
│   │       ├── StoriesPanel/                ← Story 10.5
│   │       └── SavesSharesBreakdown/        ← Story 10.5
│   └── hooks/
│       ├── useMetaConnection.ts             ← Story 10.2
│       └── useMetaInsights.ts               ← Story 10.5
```

### 4.2 Fluxo de dados típico (usuário abre tab Insights)

```
ConsultoriaDetailInstagramInsights monta
  ↓
useMetaConnection(consultancyId) → GET /api/meta/connections/:id
  ↓
Se connection.status = 'active':
  useMetaInsights(consultancyId) → GET /api/meta/insights/:id/account
                                 → GET /api/meta/insights/:id/media
                                 → GET /api/meta/insights/:id/audience
  Cada endpoint:
    ↓
    Verifica cache (TTL por tipo)
    ↓
    Cache miss → consulta instagram_insights_daily (snapshot do cron)
    ↓
    Se snapshot < 25h: serve do banco
    ↓
    Senão chama metaInsightsService.fetch...() (com rate limit handler)
    ↓
    Salva no cache + atualiza snapshot
    ↓
  Renderiza painéis oficiais (HeroMetricsOfficial, AudienceDemographicsPanel, ...)

Senão:
  Renderiza CTA "Conectar Instagram" (ConnectInstagramButton)
  Continua mostrando dados Apify como fallback (atual)
```

### 4.3 Variáveis de ambiente novas

```bash
# Meta App
META_APP_ID=...
META_APP_SECRET=...
META_GRAPH_API_VERSION=v22.0
META_OAUTH_REDIRECT_URI=https://app.estrategize.co/api/meta/oauth/callback
META_TOKEN_ENCRYPTION_KEY=<32-byte hex>   # gerado uma vez: openssl rand -hex 32

# Frontend
VITE_META_APP_ID=...                       # mesmo do backend, exposto no SDK do browser
```

---

## 5. STORIES

| # | Story | Complexidade | Wave |
|---|---|---|---|
| 10.1 | Migration `instagram_official_connections` + token vault | high | 1 |
| 10.2 | OAuth Instagram Login flow + ConnectInstagramButton | high | 2 |
| 10.3 | metaInsightsService (Account + Media + Audience) | high | 2 |
| 10.4 | Cron diário de snapshot + Stories cron 6h | medium | 3 |
| 10.5 | Upgrade do painel Instagram Insights com dados oficiais | high | 3 |
| 10.6 | Diagnóstico Iris com dados oficiais (forense) | medium | 4 |

**Sequência:** 10.1 bloqueia tudo. 10.2 e 10.3 paralelizam após 10.1. 10.4 e 10.5 dependem de 10.3 (e 10.5 também de 10.2 para o ConnectInstagramButton). 10.6 depende de 10.3.

---

## 6. CRITÉRIOS DE PRONTO DA EPIC

- [ ] Todas as 6 stories com status Done
- [ ] Migration `035_meta_foundation.sql` aplicada em prod sem erros
- [ ] Pelo menos 1 consultoria de teste com Instagram oficial conectado
- [ ] Cron diário executando e populando `instagram_insights_daily`
- [ ] Painel de Insights mostrando reach, accounts engaged, demografia real para a conta teste
- [ ] Diagnóstico Iris gerado com evidência numérica para a conta teste
- [ ] Sentry sem erros críticos em produção por 48h após deploy
- [ ] LGPD: política de privacidade atualizada mencionando armazenamento de tokens Meta encriptados
- [ ] Documentação do OAuth flow em `docs/integrations/meta-oauth.md`

---

## 7. RISCOS E MITIGAÇÕES

| Risco | Impacto | Mitigação |
|---|---|---|
| Permissões não estão em Advanced Access no app Meta | BLOQUEANTE | Validar antes de codar Story 10.2. Se Standard, solicitar Advanced via App Review (1-4 semanas/permissão) |
| Cliente não tem IG Business/Creator + Page conectada | ALTO | Wizard de onboarding na connection com checklist do que precisa estar configurado |
| Token long-lived expira em 60d sem refresh | ALTO | Cron diário verifica `expires_at < 14d` e roda refresh automático |
| Rate limit 200 calls/h estoura com 50+ clientes ativos | MÉDIO | Cache agressivo + snapshot diário + batch field selection |
| User revoga acesso no Meta sem o Iris saber | MÉDIO | Implementar webhook `user_deauthorize` em Story 10.2 |
| LGPD/Privacidade: armazenar tokens de terceiros | ALTO | pgcrypto + key em env var; política de privacidade atualizada; ação de revogação imediata via DELETE endpoint |
| Custo de chamadas Meta cresce — mas Meta é gratuita | BAIXO | N/A — API Meta é free |
| Apify continua sendo cobrado em consultorias sem conexão oficial | MÉDIO | Documentar trade-off no pricing v1.1 |
| Conflito visual: dois modos (oficial + Apify) podem confundir | MÉDIO | Story 10.5 inclui badge claro "dados oficiais" vs "via Apify" |

---

## 8. MÉTRICAS DE SUCESSO

| Métrica | Baseline | Meta pós-Onda 1 |
|---|---|---|
| % consultorias com Instagram oficial conectado | 0% | 30% em 30d |
| Diagnósticos gerados com dados oficiais | 0 | 50% dos diagnósticos novos em 30d |
| NPS dos consultores sobre painel de Instagram | (medir) | +20 pontos |
| Churn em consultorias com conexão oficial | (medir) | -30% vs sem conexão |
| Custo Apify mensal | (atual) | -20% (consultorias com oficial não consomem) |

---

## 9. ROADMAP PÓS-ONDA 1

- **Onda 2 — Engagement Layer (6-8 semanas):** Webhooks, Inbox, Calendário Editorial, Stories Tracker, Apollo IG
- **Onda 3 — Ads & Intelligence (8-10 semanas):** Ferramenta Ads & Atribuição (CAPI), Custom Audiences via Aplicações, Pesquisa de Mercado v2 (Business Discovery), Concorrentes Watch

---

## 10. REFERÊNCIAS

- Pesquisa estratégica: `Obsidian/01 - Projetos/Estrategize-saas/Pesquisas e referências/12 - Upgrades Meta API — Consultoria e Ferramentas.md`
- Plano Mestre Obsidian: `Obsidian/01 - Projetos/Estrategize-saas/Sistema/02 - Epics/Epic 10 - Meta Foundation/00 - Plano Mestre.md`
- Doc CAPI relacionado (Onda 3): `Obsidian/01 - Projetos/Estrategize-saas/Pesquisas e referências/10 - Upgrade de Integração Meta Ads.md`
- Meta Instagram Platform docs: https://developers.facebook.com/docs/instagram-platform/
- Insights API reference: https://developers.facebook.com/docs/instagram-platform/insights/
- Graph API rate limiting: https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
- pgcrypto: https://www.postgresql.org/docs/current/pgcrypto.html

---

**Aprovação para execução:** aguarda confirmação do Leonardo de que as permissões Meta estão em Advanced Access no app.
