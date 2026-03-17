# Epic 4 — Aplicações v2: Intelligence & Growth

**Status:** Planejamento
**Dependência:** Epic 3 (MVP Aplicações) concluído
**Objetivo:** Transformar o Form Builder de uma ferramenta de coleta em uma plataforma de conversão e análise

---

## Contexto

O Epic 3 entregou o MVP: criar, editar, publicar e coletar respostas de formulários conversacionais. O Epic 4 adiciona as camadas que convertem o produto de "funcional" para "indispensável": análise de dados, integrações nativas, personalização avançada e recursos de crescimento.

---

## Features por Prioridade

### P0 — Desbloqueiam receita e retenção imediata

#### 4.1 Upload de logo e imagem de fundo (Supabase Storage)
- **O que:** Campo de upload no painel Aparência para logo (PNG/SVG) e imagem de fundo
- **Por que:** PRD original tinha no MVP mas dependia de Supabase Storage não configurado
- **Onde armazenar:** bucket `application-assets` (público, RLS por user_id)
- **Schema DB:** adicionar `logo_url` e `background_image_url` no JSONB `theme_config`
- **Preview:** logo renderizada no canto configurável (esquerda/centro/direita); fundo com overlay de opacidade ajustável
- **Acceptance:** upload ≤2MB, formatos PNG/JPG/SVG/WebP, exibido imediatamente no preview

#### 4.2 Dashboard de Analytics por Aplicação
- **O que:** Tela `/aplicacoes/:id/analytics` com métricas de conversão
- **Métricas:** visualizações, inicializações, completudes, taxa de conclusão, tempo médio, drop-off por campo
- **Implementação:** novo endpoint `GET /api/applications/:id/analytics`; agregar de `application_responses` + eventos de sessão
- **Visualização:** linha do tempo (Chart.js ou Recharts), funil de campos (bar), cards de métricas topo
- **Acceptance:** dados atualizados a cada 30min; período: 7d / 30d / 90d

#### 4.3 Webhooks nativos
- **O que:** Ao receber uma resposta, disparar POST para URL configurada pelo usuário
- **Payload:** `{ application_id, response_id, answers: [{field_label, value}], submitted_at }`
- **Configuração:** aba "Integrações" no ApplicationShell; campo URL + secret para HMAC; toggle ativo/inativo
- **Retry:** 3 tentativas com backoff exponencial; log de últimas 50 entregas com status
- **DB:** nova tabela `webhook_configs` e `webhook_deliveries`

#### 4.4 Notificações por e-mail ao criador
- **O que:** E-mail automático ao criador quando nova resposta chegar
- **Configuração:** toggle na aba Opções; campo CC adicional
- **Template:** tabela com campo→valor, link para ver respostas completas
- **Provider:** Resend (já no ecossistema ou configurar novo)

---

### P1 — Aumentam valor percebido e diferenciação

#### 4.5 Lógica condicional (pular campos)
- **O que:** Campo pode ser exibido/ocultado baseado na resposta de campo anterior
- **Suporte inicial:** apenas `multiple_choice` → mostra/oculta campo seguinte
- **UI:** no painel FieldOptions, seção "Lógica" com "Se [campo X] for [opção Y] → [Ir para campo Z / Pular]"
- **Runtime:** `FormPublicoPage` avalia condições antes de avançar para próximo campo
- **DB:** `conditional_logic` JSONB já existe nas tabelas — aproveitar

#### 4.6 Tracking pixels (FB Pixel, GA4, TikTok Pixel)
- **O que:** Injetar scripts de rastreamento na página pública `/f/:slug`
- **Configuração:** aba "Integrações" → campos para ID de cada pixel
- **Eventos disparados:** `FormView` (abertura), `FormStart` (primeiro campo), `FormSubmit` (envio)
- **DB:** campo `tracking` no JSONB `settings`

#### 4.7 Captura automática de UTM
- **O que:** Parâmetros UTM da URL (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) capturados automaticamente e armazenados junto com cada resposta
- **Implementação:** `FormPublicoPage` lê `URLSearchParams`; passa como metadata no payload de submit
- **DB:** coluna `metadata JSONB` em `application_responses`; exibido na tela de Respostas como colunas opcionais

#### 4.8 Templates de formulário
- **O que:** Biblioteca de templates prontos para casos de uso comuns
- **Templates MVP:** Pesquisa de satisfação (NPS), Captação de leads, Quiz de diagnóstico, Formulário de contato, Inscrição de evento
- **Fluxo:** botão "Criar a partir de template" na AplicacoesPage → seleciona template → abre editor pré-populado
- **DB:** tabela `application_templates` (sistema, não editável por usuário)

---

### P2 — Fidelização e expansão de uso

#### 4.9 Randomização de opções (multiple_choice)
- **O que:** Toggle "Randomizar ordem das opções" no MultipleChoiceSettings
- **Implementação:** `FormPublicoPage` embaralha opções no cliente (Fisher-Yates) se flag ativa
- **DB:** flag `randomize_options` no `conditional_logic` JSONB (padrão: false)

#### 4.10 Exportação de respostas via e-mail
- **O que:** Botão "Exportar CSV" na RespostasPage envia arquivo por e-mail ao invés de download direto
- **Por que:** Permite exportação assíncrona para bases grandes sem timeout
- **Fallback:** para bases pequenas (<500 respostas), manter download direto

#### 4.11 Domínio personalizado para formulários públicos
- **O que:** Usuário configura CNAME próprio (ex: `forms.suaempresa.com`) que serve os formulários
- **Implementação:** Vercel Edge Config ou middleware de rewrite; verificação de DNS ownership
- **Restrito a plano:** Pro ou superior

#### 4.12 Colaboradores por aplicação
- **O que:** Compartilhar acesso de edição/visualização com outro usuário da plataforma
- **Papéis:** Editor (editar campos, ver respostas), Viewer (só ver respostas)
- **DB:** tabela `application_collaborators (application_id, user_id, role)`

---

## Tabelas / Migrações Necessárias

```sql
-- 016_application_assets.sql
-- Adiciona suporte a logo e background image
ALTER TABLE applications ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS background_image_url TEXT;

-- 017_webhook_configs.sql
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES application_responses(id) ON DELETE CASCADE,
  status INTEGER, -- HTTP status code
  payload JSONB,
  error TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- 018_response_metadata.sql
ALTER TABLE application_responses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 019_application_templates.sql
CREATE TABLE application_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  thumbnail_url TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  theme_config JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Rotas Novas

### Backend
```
GET  /api/applications/:id/analytics          → métricas agregadas
GET  /api/applications/:id/webhooks           → listar configs webhook
POST /api/applications/:id/webhooks           → criar config
PUT  /api/applications/:id/webhooks/:wid      → atualizar
DELETE /api/applications/:id/webhooks/:wid    → remover
GET  /api/applications/:id/webhooks/:wid/deliveries → histórico
GET  /api/templates                            → listar templates públicos
POST /api/applications/from-template/:tid     → criar app a partir de template
```

### Frontend
```
/aplicacoes/:id/analytics   → AnalyticsPage
/aplicacoes/templates       → TemplatesPage (modal ou página)
```

---

## Critérios de Saída do Epic 4

- [ ] Taxa de conclusão dos formulários visível no dashboard de analytics
- [ ] Webhook funcional: entregar payload para URL em <5s após submit
- [ ] Logo do criador exibida na página pública do formulário
- [ ] Ao menos 3 templates disponíveis na galeria
- [ ] Lógica condicional funcional para multiple_choice

---

## Dependências Técnicas

| Feature | Dependência |
|---|---|
| Upload logo/fundo | Supabase Storage bucket configurado |
| Analytics | Evento de `form_view` capturado no `FormPublicoPage` |
| Webhooks | Worker/queue ou Vercel Cron para retry |
| E-mail notificações | Resend API key configurada |
| Tracking pixels | Política CSP ajustada para permitir scripts externos |
| Domínio personalizado | Plano Vercel Pro (Edge Middleware) |
