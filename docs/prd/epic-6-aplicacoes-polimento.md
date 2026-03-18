# Epic 6 — Aplicações: Pente Fino & Publicação Completa

**Status:** Em Execução  
**Prioridade:** P0 — Crítico  
**Contexto:** O módulo de Aplicações (Form Builder) estava com bugs críticos impedindo o uso. Este epic consolida os fixes + refinamentos visuais + funcionalidades de tracking e publicação.

---

## Diagnóstico dos Bugs Encontrados

### Bug #1 — Tela Preta no Leitor (Root Cause Principal) ✅ CORRIGIDO
**Arquivo:** `frontend/src/api/applications.ts`  
**Root cause:** `fetchPublicForm` não desempacotava a resposta da API. O backend retorna `{ data: { application, fields } }` mas o frontend fazia `return res` ao invés de `return res.data`. Resultado: `application = undefined`, `fields = []`, tela preta.  
**Fix:** `return res.data` adicionado.

### Bug #2 — Null render defensivo ✅ CORRIGIDO
**Arquivo:** `frontend/src/pages/public/FormPublicoPage.tsx`  
**Root cause:** `if (!currentField) return null` causava tela preta em formulários com 0 campos.  
**Fix:** Substituído por `<ErrorScreen>` com mensagem amigável.

### Bug #3 — Auto-start sem campos ✅ CORRIGIDO
**Root cause:** Auto-start effect disparava `setCurrentIndex(0)` mesmo quando `fields` era vazio, levando ao null render.  
**Fix:** Guard adicionado — só dispara se `first >= 0`.

### Bug #4 — URLs de eventos relativas ✅ CORRIGIDO
**Root cause:** 3 chamadas `fetch('/api/forms/:slug/events')` usavam path relativo → chamavam o Vercel (frontend) ao invés do Railway (backend) → 404.  
**Fix:** Prefixo `VITE_API_URL` adicionado em todas as 3 chamadas.

### Bug #5 — "Ver" desabilitado para rascunhos ✅ CORRIGIDO
**Root cause:** O botão "Ver" estava com `pointer-events-none` para formulários em rascunho, impedindo preview antes da publicação.  
**Fix:** Botão "Ver/Prévia" sempre habilitado. Rascunhos abrem `/f/:slug?preview=1` que chama endpoint autenticado. Banner amarelo-roxo indica modo prévia.

---

## Stories Pendentes

### S6.1 — Refinamento Visual do Editor e Tabs [P1]
- [ ] Melhorar empty states em todas as tabs (Editor sem campos, Respostas sem dados, Analytics sem eventos)
- [ ] Melhorar loading skeletons com animação mais suave
- [ ] Melhorar AplicacoesPage: cards com gradiente suave de status
- [ ] Alinhar tipografia e espaçamentos com design system

### S6.2 — Analytics Tab Funcional [P1]
- [ ] Conectar `AnalyticsPage` com dados reais via `fetchAnalytics`
- [ ] Gráfico de linha (views/starts/submits por dia)
- [ ] Cards de KPI: taxa de início, taxa de conclusão, total de respostas
- [ ] Filtro de período (7d / 30d / 90d)

### S6.3 — Templates Pré-definidos [P1]
- [ ] Aplicar migration 020 para tabelas de templates (já existe no banco)
- [ ] Criar 4 templates: Qualificação de Lead, Pesquisa de Satisfação, Diagnóstico Rápido, Captação Simples
- [ ] Conectar modal de novo formulário com seleção de template

### S6.4 — Webhooks Nativos [P2]
- [ ] UI na aba Integrações para configurar webhook URL
- [ ] Disparar webhook ao receber nova resposta
- [ ] Registrar tentativas em `webhook_deliveries`
- [ ] Mostrar log de entregas na UI

### S6.5 — Refinamento Visual do Formulário Público [P1]
- [ ] Suporte a modo claro no formulário público
- [ ] Melhor fallback quando campo de tipo desconhecido aparece
- [ ] Animação de transição mais suave entre campos
- [ ] Keyboard shortcut hint mais elegante (Tab/Enter)

### S6.6 — Compartilhamento Avançado [P2]
- [ ] QR Code real (dependência `qrcode.react`)
- [ ] Embed code com altura automática via postMessage
- [ ] Preview do embed dentro da aba

### S6.7 — Notificações Email Funcionais [P1]
- [ ] Verificar `emailNotificationService` com template HTML bonito
- [ ] Adicionar campo "Nome do remetente" nas notificações
- [ ] Suporte a digest diário

---

## Contexto Técnico

### Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind + Framer Motion + React Query
- Backend: Node.js + Express + TypeScript
- DB: PostgreSQL (Supabase) — todas as migrations aplicadas (015–021)
- Form público: `/f/:slug` (rota pública) | Preview autenticado: `/f/:slug?preview=1`

### Rotas Backend (Aplicações)
| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/forms/:slug` | Não | Form publicado + campos |
| GET | `/api/forms/:slug/preview` | Sim (owner) | Form em rascunho (preview) |
| POST | `/api/forms/:slug/responses` | Não | Submeter resposta |
| POST | `/api/forms/:slug/events` | Não | Rastrear view/start/submit |
| GET | `/api/applications/:id/analytics` | Sim | Dados de analytics |

### Design Tokens Específicos de Aplicações
```css
--iris-violet: #7c5cfc;
--form-bg: #000000 (default dark);
--form-question: #f5f5f7;
--form-answer: #f5f5f7;
--form-button: #7c5cfc;
```

---

## Definition of Done

- [ ] Formulário publicado carrega corretamente (tela preta resolvida)
- [ ] Preview de rascunho funciona com banner visível
- [ ] Pixels de rastreamento disparam corretamente (URLs absolutas)
- [ ] Analytics mostra dados reais
- [ ] Todos os tipos de campo renderizam sem erro
- [ ] Notificações por email funcionam ao receber resposta
- [ ] Exportação CSV funcional
- [ ] TypeScript sem erros
- [ ] Build Vite sem erros
