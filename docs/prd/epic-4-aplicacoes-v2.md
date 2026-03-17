# Epic 4 — Aplicações v1 Completa: Assets, Tracking, UX & Polish

**Status:** Planejamento (turbinado)
**Dependência:** Epic 3 concluído (MVP funcional em produção)
**Objetivo:** Entregar 100% da v1 da ferramenta — completa tanto para o criador quanto para o leitor do formulário, com tracking de pixel funcional, UX polida e design system consistente

---

## Definição de "v1 Completa"

O Epic 3 entregou a mecânica central. A v1 completa significa:

> **Criador:** cria, personaliza com sua identidade visual, configura pixels de rastreamento, recebe notificações de respostas, analisa resultados e exporta dados.
> **Leitor:** tem uma experiência conversacional fluida, mobile-first, acessível, com feedback claro em cada etapa.

---

## Análise de Lacunas — O que o Epic 3 NÃO entregou

### Perspectiva do Criador

| Lacuna | Impacto | Prioridade |
|--------|---------|-----------|
| Logo e imagem de fundo não implementados (dependia de Storage) | Formulário sem identidade visual | P0 |
| Tracking pixels (FB/GA4/TikTok) ausentes do codebase | Sem dados de campanha | P0 |
| Captura de UTM não implementada | Sem atribuição de tráfego | P0 |
| Notificações por e-mail ausentes | Criador não sabe de respostas | P0 |
| Aba "Integrações" não existe no ApplicationShell | Configs de pixel/webhook sem casa | P0 |
| Analytics (view count, taxa conclusão, drop-off) | Sem métricas de conversão | P1 |
| Webhooks nativos | Sem integração externa | P1 |
| Templates de formulário | Criação lenta do zero | P1 |
| RespostasPage sem filtro por data | Difícil analisar campanhas | P1 |
| Colunas UTM ausentes na TableView de respostas | Não conecta resposta à origem | P1 |
| CompartilharPage — embed não funciona (sem iframe mode) | Recurso prometido quebrado | P1 |
| CompartilharPage — QR code ausente | Sem compartilhamento offline | P2 |
| Lógica condicional UI ausente | Formulários lineares apenas | P2 |
| Opções do formulário: sem redirect pós-envio | Fluxo incompleto | P2 |
| OpcoesPage: sem data de fechamento | Sem controle temporal | P2 |

### Perspectiva do Leitor (FormPublicoPage)

| Lacuna | Impacto | Prioridade |
|--------|---------|-----------|
| Font-size < 16px nos inputs → auto-zoom iOS Safari | Mobile quebrado no iPhone | P0 |
| Safe area insets ausentes (iPhone notch/home bar) | Botões cortados em iPhone | P0 |
| Sem ARIA labels nos inputs | Inacessível para screen readers | P0 |
| Sem `lang="pt-BR"` na página | SEO e a11y incorretos | P0 |
| Sem OG tags (title/description/image) para `/f/:slug` | Preview feio no WhatsApp/Slack | P0 |
| Sem contador de caracteres quando maxLength configurado | Usuário não sabe limite | P1 |
| Sem hint de formato para data e telefone | Confusão no preenchimento | P1 |
| Sem mensagem de erro inline para campo obrigatório | Silencioso — UX confusa | P1 |
| Progress bar não mostra "X de Y" | Sensação de progresso fraca | P1 |
| Thank you screen: sem redirect automático configurável | Fluxo de funil quebrado | P1 |
| Keyboard obscurece input no mobile (viewport não ajusta) | Texto invisível ao digitar | P1 |
| Animações de transição iguais para frente e trás | Sensação de navegação estranha | P1 |
| `multiple_choice` hint "pressione Enter" não aparece mobile | Confusão sobre como avançar | P2 |
| Sem skeleton loading | Flash de conteúdo vazio | P2 |

---

## Stories por Fase de Execução

---

### FASE A — Foundation: Assets Visuais + Tracking (P0)

#### US-4.1 Upload de logo (Supabase Storage)

**Como** criador, **quero** fazer upload da logo da minha empresa para que o formulário tenha minha identidade visual.

**Acceptance criteria:**
- [ ] Campo de upload na seção Aparência do painel FieldOptions (quando nenhum campo selecionado)
- [ ] Aceita PNG, JPG, SVG, WebP — máximo 2MB
- [ ] Preview imediato após upload no painel AppearanceSettings
- [ ] Logo exibida no FormPublicoPage nas telas Welcome e ThankYou
- [ ] Posicionamento: esquerda (padrão) / centro / direita via `theme_config.logoPosition`
- [ ] Botão "Remover logo" limpa o campo e remove do Storage
- [ ] Upload stored em bucket `application-assets/{user_id}/logos/{application_id}/{filename}`

**Implementação:**
```
Backend: POST /api/applications/:id/assets/logo
  - Recebe multipart/form-data
  - Valida tipo MIME e tamanho
  - Faz upload para Supabase Storage via supabaseAdmin.storage
  - Retorna { url: string }
  - Salva url em theme_config.logoUrl

DELETE /api/applications/:id/assets/logo
  - Remove do Storage
  - Limpa theme_config.logoUrl

Frontend: UploadLogoButton component
  - <input type="file" accept="image/*" /> oculto
  - Preview com <img> + botão remover
  - useMutation para upload
  - Atualiza editorStore.themeConfig.logoUrl após sucesso
```

---

#### US-4.2 Upload de imagem de fundo (Supabase Storage)

**Como** criador, **quero** usar uma imagem como fundo do formulário para criar uma experiência mais imersiva.

**Acceptance criteria:**
- [ ] Campo de upload na seção Aparência após a seção de cores
- [ ] Aceita PNG, JPG, WebP — máximo 5MB
- [ ] Slider de opacidade do overlay (0%–80%, padrão 50%) para garantir legibilidade
- [ ] Preview imediato no LivePreview
- [ ] FormPublicoPage aplica background-image + overlay com a opacidade configurada
- [ ] Se background-image presente, ignorar backgroundColor para o fundo da página (mas manter para os cards/inputs se aplicável)

**Implementação:**
```
Backend: POST /api/applications/:id/assets/background
  - Upload para application-assets/{user_id}/backgrounds/{application_id}/{filename}
  - Retorna { url: string }

Frontend: UploadBackgroundButton
  - Semelhante ao UploadLogoButton
  - Adicional: OpacitySlider (0-80)
  - themeConfig: { backgroundImageUrl?: string, backgroundOverlayOpacity?: number }
```

**Nota de schema:** `ThemeConfig` frontend já tem `logoUrl` no tipo. Adicionar `backgroundImageUrl: string | undefined` e `backgroundOverlayOpacity: number | undefined` (default: 50).

---

#### US-4.3 Tracking Pixels — Spec Completa

**Como** criador, **quero** configurar pixels de rastreamento (Meta/Facebook, Google Analytics 4, TikTok) para medir o desempenho das campanhas que direcionam para meus formulários.

##### 4.3.1 Configuração pelo criador

**Onde:** Nova aba "Integrações" no `ApplicationShell` (entre "Compartilhar" e "Respostas")

**UI da aba Integrações:**
```
┌─ Integrações ────────────────────────────────────┐
│                                                   │
│  ▣ Meta Pixel (Facebook / Instagram)              │
│  Pixel ID  [________________] [Testar] [Guia]     │
│  ☑ Ativo                                         │
│                                                   │
│  ▣ Google Analytics 4                             │
│  Measurement ID  [G-___________] [Testar] [Guia]  │
│  ☑ Ativo                                         │
│                                                   │
│  ▣ TikTok Pixel                                   │
│  Pixel ID  [________________] [Testar] [Guia]     │
│  ☑ Ativo                                         │
│                                                   │
│  ─────────────────────────────────────────        │
│                                                   │
│  Eventos rastreados automaticamente:              │
│  • Visualização do formulário    (PageView)        │
│  • Início do formulário          (Lead)            │
│  • Envio completo                (CompleteRegistration) │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Acceptance criteria — Configuração:**
- [ ] Campos para Meta Pixel ID, GA4 Measurement ID, TikTok Pixel ID
- [ ] Toggle ativo/inativo por pixel
- [ ] Validação de formato: Meta (`^\d{15,16}$`), GA4 (`^G-[A-Z0-9]{6,10}$`), TikTok (`^[A-Z0-9]{20}$`)
- [ ] Botão "Testar" — abre modal com instruções de como verificar via Facebook Pixel Helper / GA4 DebugView
- [ ] Save automático (sem botão extra) — debounced 1s
- [ ] Persistido em `settings.tracking` JSONB

**Schema de tracking em settings:**
```typescript
interface TrackingConfig {
  metaPixelId?: string
  metaPixelActive: boolean
  ga4MeasurementId?: string
  ga4Active: boolean
  tiktokPixelId?: string
  tiktokPixelActive: boolean
}
```

##### 4.3.2 Injeção de pixels no FormPublicoPage

**Estratégia:** Scripts injetados dinamicamente via `useEffect` na montagem do componente. Usar abordagem de script append ao `document.head` (não `react-helmet-async` para evitar dependência — fetch da configuração já retorna `settings.tracking`).

**Implementação completa — hook `useTrackingPixels`:**

```typescript
// frontend/src/hooks/useTrackingPixels.ts

interface PixelEvents {
  trackFormView: () => void      // Chamado quando FormPublicoPage monta
  trackFormStart: () => void     // Chamado quando usuário clica "Começar" / 1ª pergunta
  trackFormSubmit: () => void    // Chamado após submit bem-sucedido
}

export function useTrackingPixels(tracking: TrackingConfig | undefined): PixelEvents {
  const initialized = useRef(false)

  useEffect(() => {
    if (!tracking || initialized.current) return
    initialized.current = true

    // ── Meta Pixel ──
    if (tracking.metaPixelActive && tracking.metaPixelId) {
      injectMetaPixel(tracking.metaPixelId)
    }

    // ── GA4 ──
    if (tracking.ga4Active && tracking.ga4MeasurementId) {
      injectGA4(tracking.ga4MeasurementId)
    }

    // ── TikTok ──
    if (tracking.tiktokPixelActive && tracking.tiktokPixelId) {
      injectTikTokPixel(tracking.tiktokPixelId)
    }
  }, [tracking])

  return {
    trackFormView: () => {
      fireMetaEvent('PageView')
      fireGA4Event('page_view')
      fireTikTokEvent('ViewContent')
    },
    trackFormStart: () => {
      fireMetaEvent('Lead', { content_name: 'form_start' })
      fireGA4Event('generate_lead', { form_event: 'start' })
      fireTikTokEvent('ClickButton', { content_name: 'form_start' })
    },
    trackFormSubmit: () => {
      fireMetaEvent('CompleteRegistration', { status: true })
      fireGA4Event('sign_up', { method: 'form' })
      fireTikTokEvent('CompleteRegistration')
    }
  }
}
```

**Funções de injeção (mesma estratégia do snippet nativo de cada plataforma):**

```typescript
// Meta Pixel
function injectMetaPixel(pixelId: string) {
  if (window.fbq) return // já iniciado
  const script = document.createElement('script')
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){...};
    /* snippet completo oficial do Meta */
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `
  document.head.appendChild(script)
  // noscript pixel fallback
}

// GA4
function injectGA4(measurementId: string) {
  if (window.gtag) return
  const s1 = document.createElement('script')
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  s1.async = true
  document.head.appendChild(s1)
  const s2 = document.createElement('script')
  s2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `
  document.head.appendChild(s2)
}

// TikTok
function injectTikTokPixel(pixelId: string) {
  if (window.ttq) return
  const script = document.createElement('script')
  script.innerHTML = `
    !function(w,d,t){/* snippet oficial TikTok */
    }(window, document, 'https://analytics.tiktok.com/i18n/pixel/events.js');
    ttq.load('${pixelId}');
    ttq.page();
  `
  document.head.appendChild(script)
}
```

**Onde chamar os eventos no FormPublicoPage:**
```typescript
// Monta o hook na raiz do componente
const { trackFormView, trackFormStart, trackFormSubmit } = useTrackingPixels(settings.tracking)

// Em useEffect quando data carrega:
useEffect(() => {
  if (data) trackFormView()
}, [data])

// No handleStart (quando usuário clica "Começar"):
const handleStart = () => {
  trackFormStart()
  // ... navigate to first question
}

// No onSuccess do submitMutation:
onSuccess: () => {
  trackFormSubmit()
  setSubmitted(true)
}
```

**CSP (Content Security Policy):**
- O Vercel frontend precisará de `vercel.json` com headers CSP permitindo:
  - `connect-facebook.net`, `fbcdn.net` (Meta)
  - `googletagmanager.com`, `google-analytics.com` (GA4)
  - `analytics.tiktok.com` (TikTok)
- Adicionar ao `vercel.json`:
```json
{
  "headers": [{
    "source": "/f/(.*)",
    "headers": [{
      "key": "Content-Security-Policy",
      "value": "script-src 'self' 'unsafe-inline' connect.facebook.net *.google-analytics.com googletagmanager.com analytics.tiktok.com"
    }]
  }]
}
```

**Acceptance criteria — Tracking:**
- [ ] Meta Pixel ID configurado → pixel injeta no `<head>` quando form carrega
- [ ] Evento `PageView` dispara ao abrir `/f/:slug`
- [ ] Evento `Lead` dispara ao clicar em "Começar" (welcome screen) ou ao entrar na 1ª pergunta
- [ ] Evento `CompleteRegistration` dispara após submit bem-sucedido (onSuccess do mutation)
- [ ] GA4 ID configurado → gtag inicializa e `page_view` evento dispara
- [ ] TikTok Pixel ID configurado → ttq inicializa e `ViewContent` dispara
- [ ] Pixels NÃO injetados se o campo estiver vazio ou toggle inativo
- [ ] Script não quebra se Pixel ID inválido (try/catch em cada injeção)
- [ ] `window.fbq`, `window.gtag`, `window.ttq` não redeclarados se já existem na página

---

#### US-4.4 Captura automática de UTM

**Como** criador, **quero** ver de qual campanha veio cada resposta automaticamente.

**Acceptance criteria:**
- [ ] `FormPublicoPage` lê `URLSearchParams` ao montar: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- [ ] UTMs guardados em `sessionStorage` (key: `iris_utm_{slug}`) para persistência entre páginas
- [ ] Enviados no payload do submit em `metadata.utm`
- [ ] `application_responses` já tem coluna `metadata JSONB` (migration 015) — usar diretamente
- [ ] Backend valida e persiste metadata (sanitização de keys)
- [ ] RespostasPage TableView: colunas UTM exibidas somente se ao menos 1 resposta tem UTM (toggle "Mostrar colunas UTM")
- [ ] RespostasPage CSV export inclui colunas UTM
- [ ] IndividualView mostra seção "Origem" com utm_source, utm_medium, utm_campaign se presentes

---

#### US-4.5 Notificações por e-mail ao criador

**Como** criador, **quero** receber um e-mail cada vez que alguém preencher meu formulário.

**Acceptance criteria:**
- [ ] Toggle "Notificar por e-mail" na aba Integrações (seção "Notificações")
- [ ] Campo "E-mail para notificação" (padrão: e-mail do usuário logado; editável)
- [ ] Campo CC adicional (opcional)
- [ ] E-mail disparado pelo backend após inserção bem-sucedida em `application_responses`
- [ ] Conteúdo do e-mail: nome do formulário, data/hora, tabela campo→resposta, botão "Ver respostas"
- [ ] Template HTML responsivo (design escuro com cores do design system)
- [ ] Digest diário como opção alternativa (toggle: "Imediato" vs "Resumo diário às 8h")
- [ ] Provider: Resend (`RESEND_API_KEY` env var no backend)

**Schema settings:**
```typescript
interface NotificationConfig {
  emailEnabled: boolean
  emailTo?: string       // padrão: user.email
  emailCc?: string
  digestMode: 'instant' | 'daily'
}
```

---

#### US-4.6 Aba "Integrações" no ApplicationShell

**Como** criador, **quero** uma aba dedicada para configurar integrações (pixels, webhooks, notificações) sem precisar sair do editor.

**Acceptance criteria:**
- [ ] Nova tab "Integrações" entre "Compartilhar" e "Respostas" no ApplicationShell header
- [ ] `IntegracaoPage.tsx` como nova page dentro do shell
- [ ] Layout com seções colapsáveis: "Rastreamento", "Notificações", "Webhooks"
- [ ] Saves independentes por seção (sem misturar estado)
- [ ] Indicador visual de "configurado" nas seções ativas (dot verde ao lado do título da seção)
- [ ] Rota: `/aplicacoes/:id/integracoes`

---

### FASE B — Criador: Gaps Críticos de UX

#### US-4.7 RespostasPage — Filtros e Melhorias

**Acceptance criteria:**
- [ ] Filtro por período: Hoje / 7 dias / 30 dias / Custom date range
- [ ] Filtro por status: Todas / Completas / Parciais
- [ ] Busca por texto dentro das respostas
- [ ] Colunas UTM na TableView (toggle, hidden por padrão)
- [ ] Paginação infinite scroll ou load more (evitar carregar tudo de uma vez)
- [ ] Exibir contagem total e filtrada: "Exibindo 12 de 48 respostas"
- [ ] Bulk actions: selecionar múltiplas → excluir
- [ ] IndividualView mostra seção "Metadados" (IP, user-agent, UTM, timestamp) expansível

---

#### US-4.8 CompartilharPage — Embed funcional + QR Code

**Acceptance criteria:**

**Embed:**
- [ ] Código de embed gerado com iframe apontando para `/f/:slug?embed=1`
- [ ] `FormPublicoPage` detecta `?embed=1` → oculta progress bar fixa, ajusta height para 100% do iframe
- [ ] Opções de embed: largura (px ou %), altura (px ou auto)
- [ ] Preview visual no painel direito da página
- [ ] Botão copiar código com feedback visual

**QR Code:**
- [ ] Gerado client-side via `qrcode` npm package (sem API externa)
- [ ] Download PNG (256x256 e 512x512)
- [ ] Estilo: fundo branco, cor `#7c5cfc` (iris-violet)
- [ ] Exibido ao lado do link de compartilhamento

**Social sharing:**
- [ ] Links funcionais para WhatsApp (wa.me), Twitter/X, LinkedIn com URL do form + título
- [ ] Remover placeholders existentes e implementar de verdade

---

#### US-4.9 OpcoesPage — Configurações faltantes

**Acceptance criteria:**
- [ ] Campo "URL de redirecionamento após envio" (redirect URL) — persiste em `settings.redirectUrl`
- [ ] Campo "Fechar após X respostas" (número) — persiste em `settings.closeAfterResponses`
- [ ] Campo "Tempo estimado de preenchimento" (em minutos) — exibido na WelcomeScreen se configurado
- [ ] Toggle "Mostrar marca d'água 'Feito com Iris'" (padrão: true para plano free)
- [ ] Seção "Proteção contra spam" com toggle CAPTCHA (integração futura; apenas UI na v1)

---

#### US-4.10 Editor — Melhorias de UX

**Acceptance criteria:**
- [ ] Botão "Abrir formulário" no topbar (ícone de link externo) → abre `/f/:slug` em nova aba (já existe "Ver", verificar se funciona corretamente para drafts — deve mostrar preview interno, não público)
- [ ] Duplicar campo via botão no FieldOptions panel (não apenas no FieldsList)
- [ ] Scroll automático para campo recém-adicionado no FieldsList
- [ ] Toast de feedback quando campo é reordenado via drag-drop
- [ ] Contagem de campos no rodapé do FieldsList: "7 campos · 5 coletáveis"
- [ ] Warning visual quando formulário tem 0 campos coletáveis (apenas welcome + thank_you)

---

### FASE C — Leitor: Experiência Mobile e Acessibilidade

#### US-4.11 Mobile Experience Fix (CRÍTICO)

**Problema 1 — Auto-zoom iOS Safari:**
Todo `<input>` com `font-size < 16px` causa zoom automático no iOS Safari, quebrando o layout.

**Fix:**
- [ ] Todos os `<input>` e `<textarea>` em `FormPublicoPage` devem ter `font-size: 16px` minimum (já é 18px no `inputBaseStyle` — OK, mas verificar todos os casos)
- [ ] Adicionar `touch-action: manipulation` para eliminar delay de 300ms em botões
- [ ] Adicionar `user-scalable=no` no viewport meta tag da página pública (ou `maximum-scale=1`)

**Problema 2 — Safe Area (iPhone notch/home bar):**
- [ ] Botão de avançar (OK →) e barra de progresso devem respeitar `env(safe-area-inset-bottom)` e `env(safe-area-inset-top)`
- [ ] Adicionar ao CSS do `bgStyle`: `padding-bottom: env(safe-area-inset-bottom)`
- [ ] Meta tag viewport: `viewport-fit=cover`

**Problema 3 — Teclado mobile obscurece input:**
- [ ] Detectar `visualViewport` API para redimennsionar o container quando teclado abre
- [ ] Hook `useVisualViewport` que ajusta height do QuestionScreen para `window.visualViewport.height`
- [ ] Garantir que botão "OK →" fique sempre visível acima do teclado

---

#### US-4.12 Acessibilidade (WCAG 2.1 AA)

**Acceptance criteria:**
- [ ] `<html lang="pt-BR">` na página pública (`FormPublicoPage`)
- [ ] `<title>` dinâmico: "{título do formulário} — Iris" via `document.title = ...` em useEffect
- [ ] Todos os `<input>` com `aria-label` igual ao `field.title`
- [ ] `aria-required="true"` em campos com `field.required = true`
- [ ] `aria-live="polite"` na área de mensagem de erro
- [ ] Focus management: `useEffect` que faz `.focus()` no input ao entrar em nova pergunta
- [ ] Botão "OK →" com `aria-label="Próxima pergunta"` ou "Enviar formulário" quando isLast
- [ ] Navegação por teclado: Tab → campo, Enter → avançar, Shift+Tab → voltar
- [ ] Contraste: texto do placeholder deve ser pelo menos 4.5:1 (atualmente pode estar baixo)

---

#### US-4.13 Validation UX Inline

**Acceptance criteria:**
- [ ] Campo obrigatório não preenchido + clique em OK → exibe mensagem de erro abaixo do campo: "Este campo é obrigatório" (texto vermelho, animação shake no botão)
- [ ] Campo `email` com formato inválido → "Insira um e-mail válido"
- [ ] Campo `number` fora do range min/max → "O valor deve ser entre {min} e {max}"
- [ ] Campo `date` fora do range → "A data deve ser entre {minDate} e {maxDate}"
- [ ] Contador de caracteres para short_text/long_text quando maxLength configurado: "{current}/{max}" aparece abaixo do campo, fica vermelho quando ≥90%
- [ ] Hints de formato:
  - `phone`: placeholder automático "(11) 99999-9999" se placeholder não configurado
  - `date`: hint de formato "dd/mm/aaaa" abaixo do campo
  - `number`: hint de range se configurado: "Entre {min} e {max}"

---

#### US-4.14 Progress & Navigation Improvements

**Acceptance criteria:**
- [ ] ProgressBar exibe texto "X de Y" à direita da barra
- [ ] WelcomeScreen mostra "Tempo estimado: X min" se `settings.estimatedTime` configurado
- [ ] Transições: forward → slide left (`x: 40 → 0`), backward → slide right (`x: -40 → 0`) — já tem parcialmente, verificar consistência
- [ ] Hint "Pressione Enter ↵" não aparece em dispositivos touch (detectar via `navigator.maxTouchPoints > 0` ou media query `(pointer: coarse)`)
- [ ] Botão "Voltar" visível em mobile (não cortado pelo teclado)

---

#### US-4.15 OG Tags e SEO para Formulários Públicos

**Acceptance criteria:**
- [ ] Ao carregar `/f/:slug`, o backend deve retornar dados suficientes para o frontend gerar meta tags (já retorna `application.title`)
- [ ] `FormPublicoPage` usa `document.title = application.title + " — Iris"` em `useEffect` quando data carrega
- [ ] Implementar via SSR ou via prerender para OG tags (Vercel Edge Functions para `/f/:slug`)
- [ ] Meta tags geradas dinamicamente:
  ```html
  <title>{application.title} — Iris</title>
  <meta name="description" content="Responda o formulário {application.title}">
  <meta property="og:title" content="{application.title}">
  <meta property="og:description" content="Formulário criado com Iris">
  <meta property="og:image" content="{theme_config.logoUrl ou default OG image}">
  <meta property="og:url" content="https://app.estrategize.co/f/{slug}">
  <meta name="twitter:card" content="summary_large_image">
  ```
- [ ] Alternativa simplificada (sem SSR): `react-helmet-async` como dependência leve

---

#### US-4.16 Thank You Screen Improvements

**Acceptance criteria:**
- [ ] Se `settings.redirectUrl` configurado → redirecionar automaticamente após 3 segundos com countdown visível: "Redirecionando em 3s..."
- [ ] Botão "Ir agora" para redirecionar sem esperar
- [ ] `theme_config.logoUrl` exibida na ThankYouScreen (abaixo do check icon)
- [ ] Botão de compartilhamento social (WhatsApp, Twitter) na ThankYouScreen se `settings.showSocialShare` ativo
- [ ] Marca d'água "Feito com Iris ◉" → link clicável para a landing page se plano free

---

#### US-4.17 Skeleton Loading

**Acceptance criteria:**
- [ ] `FormPublicoPage` enquanto `isLoading = true` → exibir skeleton animado (não apenas spinner)
- [ ] Skeleton: retângulo de title (60% width, 40px height), retângulo de description (40% width, 20px height), botão de shape
- [ ] Animação: `@keyframes skeleton-pulse` com opacity 0.4 → 0.8 → 0.4

---

### FASE D — Features de Crescimento (P1/P2)

#### US-4.18 Analytics por Formulário

**Acceptance criteria:**
- [ ] Nova rota `/aplicacoes/:id/analytics` (tab no ApplicationShell)
- [ ] Rastreamento de visualizações: `FormPublicoPage` chama `POST /api/forms/:slug/events { event: 'view' }` ao montar (fire-and-forget, sem afetar UX)
- [ ] Rastreamento de inicio: `{ event: 'start' }` ao clicar Começar
- [ ] Métricas exibidas:
  - Total de visualizações
  - Total de inicializações (taxa de início = inicializações/visualizações)
  - Total de completudes
  - Taxa de conclusão = completudes/inicializações
  - Tempo médio de preenchimento (submittedAt - createdAt)
- [ ] Gráfico de linha: visualizações vs completudes por dia (últimos 30 dias) — usar `recharts`
- [ ] Funil: Visualizações → Início → Envio (cards com seta entre eles)
- [ ] Período selecionável: 7d / 30d / 90d / All time

**DB:** Nova tabela `application_events` simples:
```sql
CREATE TABLE application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view' | 'start' | 'submit'
  session_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON application_events(application_id, event_type, created_at);
```

---

#### US-4.19 Webhooks Nativos

**Acceptance criteria:**
- [ ] Seção "Webhooks" na aba Integrações
- [ ] Criar webhook: URL de destino + secret (para HMAC-SHA256) + toggle ativo
- [ ] Payload enviado ao receber resposta completa:
  ```json
  {
    "event": "form.response.completed",
    "application_id": "...",
    "application_title": "...",
    "response_id": "...",
    "submitted_at": "...",
    "answers": [
      { "field_title": "...", "field_type": "...", "value": "..." }
    ],
    "metadata": { "utm_source": "...", ... }
  }
  ```
- [ ] Header `X-Iris-Signature: sha256={hmac}` para verificação
- [ ] Retry automático: 3 tentativas com backoff (1min, 5min, 15min) via Vercel Cron ou Bull queue
- [ ] Log das últimas 50 entregas na UI (status HTTP, timestamp, botão "Reenviar")

---

#### US-4.20 Templates de Formulário

**5 templates obrigatórios para v1:**

| Template | Campos | Uso |
|----------|--------|-----|
| Captação de leads | welcome, name, email, phone, message, thank_you | Landing page |
| Pesquisa NPS | welcome, multiple_choice (0-10), long_text (motivo), thank_you | Satisfação |
| Quiz de diagnóstico | welcome, 5x multiple_choice, thank_you | Qualificação |
| Formulário de contato | welcome, name, email, short_text (assunto), long_text (mensagem), thank_you | Suporte |
| Inscrição de evento | welcome, name, email, phone, date (disponibilidade), thank_you | Eventos |

**Fluxo:**
- [ ] Botão "Criar a partir de template" na `AplicacoesPage` (ao lado de "Novo formulário")
- [ ] Modal/drawer com grid de template cards (thumbnail + nome + descrição + n° de campos)
- [ ] Clicar no template → `POST /api/applications/from-template/:templateId` → abre editor pré-populado
- [ ] Galeria expansível (mostrar 5 no lançamento, com "Ver mais" para futuros)

---

#### US-4.21 Lógica Condicional

**Acceptance criteria (V1 simplificada — apenas skip logic):**
- [ ] Seção "Lógica" no painel FieldOptions (abaixo das configurações do campo)
- [ ] Disponível apenas para campos `multiple_choice` como condição, e todos os outros como destino
- [ ] UI: "Se resposta for [opção X] → Ir para [campo Y]"
- [ ] Múltiplas condições por campo (OR lógico)
- [ ] Default: "Caso contrário → próximo campo"
- [ ] `FormPublicoPage` avalia condições antes de `setCurrentIndex` no handleNext
- [ ] `conditional_logic` já existe como coluna JSONB na tabela — usar diretamente
- [ ] Schema:
  ```json
  {
    "enabled": true,
    "rules": [
      { "option_id": "uuid", "jump_to_field_id": "uuid" }
    ]
  }
  ```
- [ ] Editor visualiza setas de conexão entre campos condicionados (simplificado — label colorida, não diagrama gráfico)

---

#### US-4.22 Randomização de Opções (Multiple Choice)

**Acceptance criteria:**
- [ ] Toggle "Randomizar ordem das opções" em `MultipleChoiceSettings`
- [ ] Persiste em `conditional_logic.randomize_options: boolean`
- [ ] `FormPublicoPage` embaralha via Fisher-Yates se flag ativa
- [ ] Seed por session_token para consistência se usuário volta à mesma pergunta

---

### FASE E — Design System Polish (ui-ux-pro-max)

#### US-4.23 Design Tokens Audit e Consistência

**Problemas identificados:**

| Componente | Problema | Fix |
|------------|---------|-----|
| `FormPublicoPage` | Usa `#000000` hardcoded para fundo padrão (deve ser token) | `DEFAULT_THEME.backgroundColor = '#0a0a0a'` |
| `AppearanceSettings` | Color pickers pequenos (button 28px) | Aumentar para 36px, mostrar hex com 6 dígitos uppercase |
| `FieldOptionsPanel` | Sem scroll indicator quando conteúdo overflows | Adicionar `overflow-gradient` no rodapé |
| `AplicacoesPage` | Cards sem hover state suave | `transition: transform 0.15s, box-shadow 0.15s` + `translateY(-2px)` no hover |
| `RespostasPage` | TableView sem sticky header | `position: sticky; top: 0` nas `<th>` |
| `FormPublicoPage` | ThankYouScreen sem animação de entrada no checkmark | Spring animation já existe mas é muito rápida — ajustar stiffness |
| `ApplicationShell` | Tabs sem indicador de unsaved changes | Dot laranja no tab "Editor" quando `isDirty` |

**Tokens a adicionar/corrigir em `index.css`:**
```css
:root {
  /* Surfaces */
  --bg-surface-hover: rgba(255,255,255,0.06);

  /* Semantic colors */
  --color-success: #30d158;
  --color-warning: #ff9f0a;
  --color-error: #ff453a;
  --color-info: #64d2ff;

  /* Iris brand */
  --iris-violet: #7c5cfc;
  --iris-violet-light: rgba(124,92,252,0.15);
  --iris-violet-hover: #6b4cf0;

  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s ease;
  --transition-spring: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

#### US-4.24 AplicacoesPage — Visual Refresh

**Melhorias de design:**
- [ ] Cards com thumbnail mais elaborado: mostrar miniatura real do form theme (backgroundColor + primary color como gradiente)
- [ ] Response count badge mais visível: pill com número e ícone de resposta
- [ ] Status badge com dot colorido: verde (publicado), amarelo (rascunho), cinza (arquivado)
- [ ] Hover state nos cards: `translateY(-2px)` + sombra elevada
- [ ] Grid responsivo: 1 col mobile, 2 cols tablet, 3-4 cols desktop (já existe — verificar widths)
- [ ] Empty state: ilustração SVG + copy "Crie seu primeiro formulário em 2 minutos"
- [ ] Header da página com stats: "X formulários · Y respostas totais"
- [ ] Ação rápida: tooltip ao hover no card com "Editar", "Ver respostas", "Copiar link"

---

#### US-4.25 Editor — Visual Polish

**Melhorias:**
- [ ] FieldsList: highlight do campo selecionado mais contrastado (borda esquerda `--iris-violet` 3px + background levemente mais claro)
- [ ] Drag handle: apenas visível no hover, não sempre (reduce visual noise)
- [ ] FieldTypeSelector: animação de entrada com scale 0.95 → 1 + fade
- [ ] AppearanceSettings: label dos seletores de cor com preview swatch maior (24x24px)
- [ ] SaveStatus indicator: "Salvo" com checkmark verde, "Salvando..." com spinner, "Erro" com ícone de erro — todos com animação de fade
- [ ] LivePreview header: fundo levemente diferente do body do preview para melhor hierarquia
- [ ] FieldOptions: separator visual entre seções de configuração

---

#### US-4.26 FormPublicoPage — Visual Polish (Leitor)

**Melhorias:**
- [ ] Typography: título das perguntas com `letter-spacing: -0.025em` para headlines maiores
- [ ] Multiple choice options: hover state com `x: 4px` translateX (já existe) — adicionar `transition: all 0.12s ease`
- [ ] Answer input: focus ring mais suave (`box-shadow: 0 0 0 4px {buttonColor}22`) — verificar opacidade
- [ ] Progress bar: adicionar `border-radius: 2px` para ser mais sutil, não quadrado
- [ ] QuestionScreen: número da pergunta (01 →) com fonte monospace — já existe, verificar consistência de cor
- [ ] Welcome screen: button com `letter-spacing: -0.01em` — já existe mas verificar
- [ ] ThankYou: check icon container `border-radius: 20px` → mais circular, usar 50% para ícone centralizado
- [ ] Loading: substituir spinner simples por skeleton pulse

---

#### US-4.27 OpcoesPage — Visual Refresh

**Melhorias:**
- [ ] Seções com dividers mais claros (hairline border + section title com uppercase + tracking)
- [ ] Color pickers: usar mesmo `ColorPickerRow` do FieldOptions para consistência
- [ ] Danger zone: fundo `rgba(255,69,58,0.05)` + border `rgba(255,69,58,0.2)` + botão de excluir vermelho outlined → filled no hover
- [ ] Unsaved changes bar: melhorar styling — fundo `--iris-violet-light` com borda `--iris-violet`
- [ ] Toggles: usar o mesmo componente `Toggle` do FieldOptions (verificar se já está sendo usado)

---

#### US-4.28 RespostasPage — Visual Polish

**Melhorias:**
- [ ] IndividualView: header com número da resposta, data, status badge e botões de navegação em uma só linha compacta
- [ ] TableView: zebra striping sutil (`bg: rgba(255,255,255,0.02)` em rows alternadas)
- [ ] TableView: sticky header com `backdrop-filter: blur(8px)` para scroll legível
- [ ] Empty state: "Ainda não há respostas" com ícone de caixa + CTA de compartilhar
- [ ] CSV export button: ícone de download + texto, não apenas texto
- [ ] Sidebar de respostas: preview do primeiro campo da resposta em cada item da lista

---

## Dependências e Configuração de Infra

### Supabase Storage
```bash
# Criar bucket via Supabase CLI ou MCP
supabase storage create-bucket application-assets --public
# RLS policy: apenas dono pode write, todos podem read (public bucket)
```

### Variáveis de Ambiente Novas
```bash
# Backend
RESEND_API_KEY=re_...           # Notificações por e-mail
RESEND_FROM_EMAIL=noreply@...   # Remetente

# Frontend (se necessário)
VITE_APP_URL=https://app.estrategize.co  # Para OG tags
```

### Dependências NPM Novas
```bash
# Frontend
npm install qrcode @types/qrcode        # QR code generation
npm install recharts                     # Gráficos analytics
npm install react-helmet-async           # OG/SEO tags
# (opcional) npm install react-use-clipboard  # clipboard API

# Backend
npm install resend                       # Email provider
npm install node-cron                    # Retry de webhooks (ou usar Vercel Cron)
```

---

## Migrações SQL (ordenadas)

```sql
-- 016_application_storage.sql
-- Suporte a assets visuais (logo e fundo são armazenados na theme_config JSONB)
-- theme_config já existe como JSONB em applications — apenas documentar novos campos:
-- theme_config.logoUrl: TEXT
-- theme_config.backgroundImageUrl: TEXT
-- theme_config.backgroundOverlayOpacity: INTEGER (0-80, default 50)
-- Sem ALTER necessário — JSONB schema-less

-- 017_application_tracking.sql
-- settings já existe como JSONB em applications — documentar novos campos:
-- settings.tracking: TrackingConfig JSONB
-- settings.redirectUrl: TEXT
-- settings.closeAfterResponses: INTEGER
-- settings.notifications: NotificationConfig JSONB
-- settings.showBranding: BOOLEAN (default true)
-- Sem ALTER necessário — JSONB schema-less

-- 018_application_events.sql (para analytics)
CREATE TABLE IF NOT EXISTS application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'submit')),
  session_token TEXT,
  ip_hash TEXT, -- IP hasheado para privacy (SHA-256)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_application_events_app_type
  ON application_events(application_id, event_type, created_at DESC);
-- RLS: dono da application pode SELECT; public pode INSERT (via route não-autenticada)
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_events" ON application_events
  FOR SELECT USING (
    application_id IN (
      SELECT id FROM applications WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "public_insert_events" ON application_events
  FOR INSERT WITH CHECK (true); -- validado na camada de aplicação

-- 019_webhook_configs.sql
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES application_responses(id) ON DELETE CASCADE,
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_webhook_configs" ON webhook_configs
  USING (application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()));

-- 020_application_templates.sql
CREATE TABLE IF NOT EXISTS application_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  thumbnail_color TEXT DEFAULT '#7c5cfc', -- cor do thumbnail gerado
  preview_image_url TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  theme_config JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Sem RLS — público para leitura (inserção apenas via seed/admin)
-- Seed com 5 templates via INSERT INTO
```

---

## Rotas Novas

### Backend
```
# Assets
POST   /api/applications/:id/assets/logo         → upload logo → retorna {url}
DELETE /api/applications/:id/assets/logo         → remove logo do Storage
POST   /api/applications/:id/assets/background   → upload bg image → retorna {url}
DELETE /api/applications/:id/assets/background   → remove bg do Storage

# Analytics
GET    /api/applications/:id/analytics           → métricas agregadas (period query param: 7d/30d/90d)
POST   /api/forms/:slug/events                   → registrar evento (view/start) — rate limited, fire-and-forget

# Webhooks
GET    /api/applications/:id/webhooks            → listar webhook configs
POST   /api/applications/:id/webhooks            → criar config
PUT    /api/applications/:id/webhooks/:wid       → atualizar config
DELETE /api/applications/:id/webhooks/:wid       → remover config
GET    /api/applications/:id/webhooks/:wid/deliveries → histórico de entregas
POST   /api/applications/:id/webhooks/:wid/retry → reenviar entrega

# Templates
GET    /api/templates                            → listar templates ativos
POST   /api/applications/from-template/:tid      → criar application a partir de template
```

### Frontend (React Router)
```
/aplicacoes/:id/integracoes  → IntegracaoPage (pixels + webhooks + notificações)
/aplicacoes/:id/analytics    → AnalyticsPage
```

---

## Arquivos a Criar / Modificar

### Novos arquivos
```
frontend/src/
  hooks/
    useTrackingPixels.ts            # Hook completo de pixel (US-4.3)
    useVisualViewport.ts            # Mobile keyboard detection (US-4.11)
  pages/member/aplicacoes/
    IntegracaoPage.tsx              # Aba Integrações (US-4.6)
    AnalyticsPage.tsx               # Aba Analytics (US-4.18)
  components/aplicacoes/
    integracoes/
      TrackingSection.tsx           # Config pixels
      WebhookSection.tsx            # Config webhooks
      NotificationSection.tsx       # Config notificações
    analytics/
      MetricCard.tsx
      FunnelChart.tsx
      TimelineChart.tsx
  api/
    analytics.ts                    # Funções API para analytics
    webhooks.ts                     # Funções API para webhooks

backend/src/routes/
  analytics.ts                      # GET /api/applications/:id/analytics
  webhooks.ts                       # CRUD webhook configs
  assets.ts                         # Upload logo/background
services/
  webhookDeliveryService.ts         # Envio + retry de webhooks
  emailNotificationService.ts       # Notificações via Resend
  analyticsService.ts               # Agregação de métricas
```

### Arquivos a modificar
```
frontend/src/
  api/applications.ts               # Adicionar TrackingConfig, NotificationConfig ao FormSettings
  stores/editorStore.ts             # Adicionar tracking config ao state
  pages/public/FormPublicoPage.tsx  # useTrackingPixels, OG tags, mobile fixes, validation UX
  pages/member/aplicacoes/
    ApplicationShell.tsx            # Nova tab "Integrações" + "Analytics"
    RespostasPage.tsx               # Filtros, UTM columns, bulk delete
    CompartilharPage.tsx            # Embed funcional, QR code real, social links
    OpcoesPage.tsx                  # Novos campos: redirect URL, close after X, show branding
    AplicacoesPage.tsx              # Template CTA, visual polish
  components/aplicacoes/editor/
    FieldOptions.tsx                # Upload de logo/bg na AppearanceSettings, conditional logic UI
    LivePreview.tsx                 # Logo no preview, background image no preview

backend/src/
  routes/applications.ts           # Adicionar suporte a settings.tracking na update route
  routes/public/forms.ts           # Adicionar POST /events + metadata persistência UTM
```

---

## Checklist de QA por Feature

### Tracking Pixels
- [ ] Abrir DevTools → Network → verificar requests para `connect.facebook.net` ao abrir form com Meta Pixel configurado
- [ ] `window.fbq` existe após carregamento
- [ ] Evento `PageView` nos events do Meta Pixel Helper
- [ ] Evento `Lead` ao clicar "Começar"
- [ ] Evento `CompleteRegistration` após envio
- [ ] Com Pixel ID vazio ou toggle inativo: NENHUM script injetado
- [ ] Sem erros no console para qualquer combinação de pixels

### Mobile (iOS Safari)
- [ ] Testar em iPhone SE (375px) e iPhone 14 Pro (393px)
- [ ] Inputs não causam zoom ao focar
- [ ] Botão OK → visível acima do teclado
- [ ] Safe area respeitada (home bar não sobreposta)
- [ ] Transition animations fluidas a 60fps

### UTM Capture
- [ ] Acessar `/f/slug?utm_source=facebook&utm_campaign=teste` → responder → ver na RespostasPage
- [ ] Sem UTM na URL → metadata.utm ausente (não `{}` com keys vazias)
- [ ] CSV exportado contém colunas UTM quando presentes

### Upload de Assets
- [ ] Upload logo 2MB → OK
- [ ] Upload logo 3MB → erro "Arquivo muito grande (máx 2MB)"
- [ ] Arquivo .exe ou .pdf → erro de tipo
- [ ] Preview imediato no LivePreview após upload
- [ ] Logo visível no FormPublicoPage (welcome + thank you)
- [ ] Remover logo → formulário volta ao padrão sem logo

---

## Critérios de Saída do Epic 4 (v1 Completa)

### Must-have (bloqueia release)
- [ ] Logo e background configuráveis e funcionando no formulário público
- [ ] Meta Pixel, GA4 e TikTok Pixel configuráveis e disparando os 3 eventos corretos
- [ ] UTM capturado e visível na tela de respostas e export CSV
- [ ] Notificação por e-mail ao criador quando nova resposta chega
- [ ] Mobile: sem auto-zoom, safe area respeitada, teclado não obstruindo input
- [ ] Acessibilidade: ARIA labels, `lang`, focus management
- [ ] OG tags no formulário público (título + imagem)
- [ ] Embed funcional (iframe mode)
- [ ] Validação inline (mensagens de erro por campo)

### Should-have (impacta qualidade mas não bloqueia)
- [ ] Analytics básico (visualizações, taxa de conclusão)
- [ ] QR code na página de compartilhamento
- [ ] Templates (ao menos 3)
- [ ] Conditional logic para multiple_choice
- [ ] Redirect pós-envio (settings.redirectUrl)
- [ ] Design polish completo por página

### Nice-to-have (backlog v2)
- [ ] Webhooks com retry
- [ ] Digest diário de e-mail
- [ ] Lógica condicional multi-step
- [ ] Domínio personalizado
- [ ] Colaboradores por aplicação
- [ ] A/B testing de campos

---

## Estimativa de Effort por Fase

| Fase | Stories | Complexity | Notes |
|------|---------|-----------|-------|
| A — Foundation | US-4.1 a 4.6 | Alta | Storage setup + pixel injection |
| B — Creator UX | US-4.7 a 4.10 | Média | Principalmente frontend |
| C — Reader UX | US-4.11 a 4.17 | Média-Alta | Mobile fixes são críticos |
| D — Growth | US-4.18 a 4.22 | Alta | Novos endpoints + tabelas |
| E — Polish | US-4.23 a 4.28 | Baixa | CSS + micro-interactions |

**Recomendação de execução:** A → C → E → B → D
(Priorizar experiência do leitor antes de features de crescimento)
