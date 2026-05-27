# Story 10.2 — OAuth Instagram Business Login + ConnectInstagramButton

**Épico:** Epic 10 — Meta API Foundation (Onda 1)
**Story:** 10.2
**Status:** Draft
**Branch:** feat/10.2-meta-oauth-flow
**Agente principal:** @dev
**Paralelismo:** WAVE 2 — paraleliza com 10.3; depende de 10.1

---

## User Story

> **Como** consultor estratégico,
> **Quero** conectar o Instagram da minha consultoria com 2-3 cliques diretos no Instagram,
> **Para** que o Iris passe a usar dados oficiais (demografia, saves, shares, watch time) em vez de scraping.

---

## Contexto Técnico

**DECISÃO ARQUITETURAL (2026-05-27):** Usar **Instagram Business Login** (fluxo direto, recomendado pela Meta em 2026) em vez de Facebook Login for Business. Vantagens: 2-3 cliques vs 5-6; menos permissões a pedir (sem `pages_*` nem `business_management`); UI da autorização aparece dentro do Instagram (mais confiável para a cliente). Trade-off aceito: só suporta contas IG **Business** (não Creator). Para empresárias do ICP do Iris, Business é o padrão.

**Estado atual:**
- Não há fluxo OAuth no projeto. Auth do app é Supabase Auth.
- A tab Instagram da consultoria (`ConsultoriaDetailInstagram`) hoje só mostra dados Apify
- `metaCapiService.ts` já existe (Conversions API para Aplicações/Quiz) — confirma que projeto sabe falar com Graph API, mas usa `graph.facebook.com`; aqui usaremos `graph.instagram.com`

**O que será construído:**
- `backend/src/services/metaOAuthService.ts` — toda lógica de OAuth (exchange, refresh, revoke) via Instagram Business Login
- `backend/src/services/metaTokenService.ts` — encrypt/decrypt via pgcrypto
- `backend/src/routes/metaOAuth.ts` — 4 endpoints (start, callback, status, disconnect) + webhook deauthorize
- `frontend/src/features/consultorias/components/ConnectInstagramButton/` — botão + tela de status
- `frontend/src/features/consultorias/hooks/useMetaConnection.ts` — React Query hook

**Endpoints externos (Instagram Business Login):**
- Authorize: `https://www.instagram.com/oauth/authorize`
- Short-lived token exchange: `POST https://api.instagram.com/oauth/access_token`
- Long-lived token exchange: `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token`
- Refresh long-lived: `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token`
- User info: `GET https://graph.instagram.com/me?fields=user_id,username,account_type,name,profile_picture_url`
- Revoke: `DELETE https://graph.instagram.com/me/permissions?access_token=...`

---

## Acceptance Criteria

### AC1 — Serviço `metaTokenService.ts`
- [ ] Funções `encryptToken(token: string): Promise<Buffer>` e `decryptToken(encrypted: Buffer): Promise<string>` usando pgcrypto via SQL
- [ ] Key vem de `process.env.META_TOKEN_ENCRYPTION_KEY` — throw se ausente
- [ ] Round-trip funciona em teste unitário
- [ ] Decrypt nunca expõe token em log (mascarar nos primeiros/últimos 4 chars)

### AC2 — Serviço `metaOAuthService.ts` (Instagram Business Login flow)
- [ ] Função `buildAuthUrl(consultancyId, userId): { url, state }`:
  - Gera state token (jwt com `consultancyId`, `userId`, `nonce`, `exp = 10min`) assinado com `META_OAUTH_STATE_SECRET`
  - Compõe URL: `https://www.instagram.com/oauth/authorize?client_id=${IG_APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=instagram_business_basic,instagram_business_manage_insights,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_content_publish&state=${state}`
- [ ] Função `exchangeCodeForToken(code): Promise<{ accessToken, igUserId }>`:
  - POST `https://api.instagram.com/oauth/access_token` (form-urlencoded body):
    - `client_id=${IG_APP_ID}`
    - `client_secret=${IG_APP_SECRET}`
    - `grant_type=authorization_code`
    - `redirect_uri=${REDIRECT_URI}`
    - `code=${code}`
  - Retorna short-lived token (válido 1 hora) + `user_id` (Instagram User ID)
- [ ] Função `exchangeForLongLivedToken(shortToken): Promise<{ accessToken, expiresIn }>`:
  - GET `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${shortToken}`
  - Retorna long-lived token (60 dias)
- [ ] Função `fetchInstagramUserInfo(longToken): Promise<{ igUserId, igUsername, accountType, name, profilePictureUrl }>`:
  - GET `https://graph.instagram.com/me?fields=user_id,username,account_type,name,profile_picture_url&access_token=...`
  - Valida `account_type === 'BUSINESS'` — se PERSONAL, throw com mensagem clara
  - Se Meta retornar CREATOR via IBL (raro), aceitar mas registrar em log
- [ ] Função `refreshLongLivedToken(currentToken): Promise<{ accessToken, expiresIn }>`:
  - GET `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
  - Token só pode ser refreshado após 24h da criação E antes de expirar
  - Aplica refresh quando `expires_at < now() + 14d`
- [ ] Função `revokeToken(token): Promise<void>`:
  - DELETE `https://graph.instagram.com/me/permissions?access_token=...`
  - Best-effort: log warn se falhar mas não throw (token pode já estar inválido)

### AC3 — Endpoints REST (`backend/src/routes/metaOAuth.ts`)
- [ ] `POST /api/meta/oauth/start` (autenticado):
  - Body: `{ consultancyId }`
  - Valida ownership da consultancy (RLS)
  - Chama `buildAuthUrl(consultancyId, userId)`
  - Response: `{ url }`
- [ ] `GET /api/meta/oauth/callback`:
  - Query: `code`, `state`, `error?`, `error_description?`
  - Se `error`: redireciona pro frontend `/consultoria/:id?meta_error=${error}`
  - Valida `state` (JWT signature + expiry)
  - Extract `consultancyId`, `userId` do state
  - Roda `exchangeCodeForToken(code)` → short-lived + igUserId
  - Roda `exchangeForLongLivedToken(shortToken)` → long-lived (60d)
  - Roda `fetchInstagramUserInfo(longToken)` → username, account_type, profile_picture_url
  - Valida `account_type === 'BUSINESS'`; se PERSONAL redireciona com `?meta_error=not_business`
  - Encripta token via `encryptToken()`
  - Insere/atualiza row em `instagram_official_connections`:
    - `auth_flow = 'instagram_business_login'`
    - `page_id = NULL`, `page_name = NULL` (não aplicável neste fluxo)
    - `expires_at = now() + (expiresIn segundos)` (~60d)
    - `status = 'active'`
    - `scopes = ['instagram_business_basic', 'instagram_business_manage_insights', ...]` (dos scopes confirmados pelo Meta)
  - Redireciona pro frontend `/consultoria/:id?meta_connected=1`
- [ ] `GET /api/meta/connections/:consultancyId` (autenticado):
  - Retorna row da conexão SEM o token (campos seguros apenas: `ig_username`, `account_type`, `status`, `expires_at`, `connected_at`, `last_error`)
- [ ] `DELETE /api/meta/connections/:consultancyId` (autenticado):
  - Decripta token
  - Chama `revokeToken()`
  - Apaga row de `instagram_official_connections`
  - Apaga snapshots associados (ON DELETE CASCADE pela FK em consultancy_id, mas tabelas usam consultancy_id direto — adicionar cleanup explícito ou ajustar schema)
- [ ] `POST /api/meta/webhooks/deauthorize`:
  - Endpoint público (Meta chama sem auth)
  - Valida `X-Hub-Signature-256` com `META_APP_SECRET`
  - Body inclui `signed_request` com `user_id` (Facebook user ID)
  - Marca conexões desse usuário como `status = 'revoked'`
  - Log audit em `audit_logs` (tabela já existe)

### AC4 — Frontend `ConnectInstagramButton`
- [ ] Componente em `frontend/src/features/consultorias/components/ConnectInstagramButton/`
- [ ] Props: `consultancyId: string`
- [ ] Estado: usa `useMetaConnection(consultancyId)` para saber status
- [ ] Renderização:
  - `status === undefined` (loading): spinner
  - Sem conexão: botão "Conectar Instagram" (ícone IG + texto). Click → POST `/api/meta/oauth/start` → `window.location.href = response.url`
  - Conectado (`status === 'active'`): card com `@username`, account_type, expires_at, botão "Desconectar" (confirma via Modal antes de DELETE)
  - `status === 'expired' | 'revoked' | 'error'`: card com mensagem + botão "Reconectar" (mesmo fluxo do start)
- [ ] Tratamento de query params `?meta_connected=1` e `?meta_error=...` ao montar:
  - Sucesso: toast verde "Instagram conectado com sucesso"
  - Erro: toast vermelho com mensagem
  - Limpa query param via `useNavigate` (replace)

### AC5 — Hook `useMetaConnection`
- [ ] `useMetaConnection(consultancyId)` em `frontend/src/features/consultorias/hooks/`
- [ ] React Query com `staleTime: 30_000`, `queryKey: ['meta-connection', consultancyId]`
- [ ] Fetch via `api.client.get('/api/meta/connections/' + consultancyId)`
- [ ] Mutation `connect()` chama start endpoint + redirect
- [ ] Mutation `disconnect()` chama DELETE + invalida queries

### AC6 — Integração na tab Instagram
- [ ] No componente `ConsultoriaDetailInstagram`, renderizar `<ConnectInstagramButton consultancyId={...} />` no topo
- [ ] Conteúdo existente (Apify) continua abaixo como fallback
- [ ] Badge sutil indicando "dados oficiais" quando conectado

### AC7 — Validações e segurança
- [ ] State JWT expira em 10 min — testar replay
- [ ] Callback rejeita state inválido com 400
- [ ] Token NUNCA aparece em logs (mascarar em logger.ts via interceptor)
- [ ] Endpoint `/api/meta/oauth/callback` tem CSRF protection implícita via state JWT (state nunca exposto ao client)
- [ ] Webhook deauthorize valida assinatura HMAC-SHA256
- [ ] Rate limit no `/api/meta/oauth/start`: 5/min/user (anti-abuse)

---

## Checklist Técnico

- [ ] Sem token logado em texto plano em nenhum logger
- [ ] Sem token armazenado em texto plano (sempre `bytea` via pgcrypto)
- [ ] Tipos TypeScript em `backend/src/types/metaApi.ts` (compartilhado com 10.3, 10.4, 10.6)
- [ ] Service tests para `buildAuthUrl`, `exchangeCodeForToken` (mock fetch)
- [ ] Cobertura mínima do `metaOAuthService.ts`: 60%
- [ ] Documentação do fluxo OAuth em `docs/integrations/meta-oauth.md`

---

## Dependências

- **Story 10.1** (migration) — bloqueante (precisa coluna `auth_flow`, `page_id` nullable)
- **App Meta:** Standard Access nas 5 permissões `instagram_business_*` é suficiente para dev/teste; Advanced Access apenas antes de go-live público
- **Env vars:** `IG_APP_ID`, `IG_APP_SECRET` (sub-config Instagram do app principal — não confundir com `META_APP_ID`/`SECRET` que são do app Facebook), `META_OAUTH_REDIRECT_URI`, `META_TOKEN_ENCRYPTION_KEY`, `META_OAUTH_STATE_SECRET`, `META_GRAPH_API_VERSION=v25.0`
- **App Meta Dashboard:** redirect URI registrado em **Casos de uso → Gerenciar mensagens e conteúdo no Instagram → Configuração da API com login do Instagram → OAuth Redirect URIs**
- **Conta de teste:** IG Business adicionada como "Testador" no caso de uso (aba Funções)

---

## Definição de Pronto

- [ ] OAuth flow testado E2E com conta IG Business real em staging
- [ ] Token long-lived persistido encriptado
- [ ] Frontend mostra estado correto pré e pós-conexão
- [ ] Desconectar funciona + apaga snapshots
- [ ] Webhook deauthorize testado via mock (curl com signed_request fake)
- [ ] PR aberto via @devops, CodeRabbit clean, QA PASS

---

## Riscos

| Risco | Mitigação |
|---|---|
| Conta de teste é PERSONAL (não BUSINESS) | Documentar passo-a-passo de conversão para Business em `docs/integrations/meta-oauth.md` |
| Cliente do Iris tem conta CREATOR (não suportado por IBL) | Mensagem clara redirect `?meta_error=creator_not_supported`. Considerar fallback para Facebook Login em fase futura |
| User aprova mas nega scope crítico | Validar lista de scopes retornada no token; se faltou `instagram_business_manage_insights`, redirect com erro específico |
| Token expirado entre OAuth e primeiro uso | Improvável (token = 60d); refresh job em 10.4 cobre |
| Webhook deauthorize chega antes de signature validation funcionar | Logar todos e processar manualmente até signature funcionar |
| Confusão entre IG_APP_ID (sub-config Instagram) e META_APP_ID (app principal Facebook) | Documentar diferença claramente no `.env.example` e em `docs/integrations/meta-oauth.md`. IG_APP_ID está em **Casos de uso → Instagram → Personalizar** (ex: 1226345842764674) |
| Refresh só funciona após 24h da criação do token | Documentar restrição; refresh job (10.4) já considera isso ao checar `last_refreshed_at` |
