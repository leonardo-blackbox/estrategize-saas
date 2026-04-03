# PRD — Epic 7: Market Intelligence (Pesquisa de Mercado)

> **Agente responsável:** @pm
> **Status:** Aprovado para execução
> **Versão:** 1.0
> **Data:** 2026-04-01
> **Executor GSD:** `/gsd:plan-phase` → `/gsd:execute-phase`

---

## 1. Visão Geral do Problema

Consultoras de negócios locais usam o Estrategize SaaS para gerenciar suas clientes. Hoje, quando uma consultora inicia uma nova consultoria, ela precisa **manualmente** pesquisar o Instagram da aluna, analisar concorrentes no Google Maps, acessar profiles de cada concorrente e montar um diagnóstico de mercado. Isso consome entre 30 e 90 minutos por consultoria — antes mesmo de qualquer estratégia real começar.

Esse tempo perdido reduz o NPS da consultora, limita a quantidade de clientes que ela consegue atender, e faz com que o SaaS seja percebido como mais um CRUD em vez de uma ferramenta de leverage real.

---

## 2. Objetivo da Solução

Entregar **inteligência de mercado automática e configurável** em dois tiers:

**Tier 1 — Gratuito (Instagram Auto-Scan):** No momento em que a consultora cadastra uma consultoria com um handle de Instagram, o sistema executa um scan completo do perfil automaticamente — sem nenhuma ação adicional. Em 60-120 segundos, a consultoria exibe dados estruturados: seguidores, bio, frequência de posts, engajamento médio, breakdown por tipo de conteúdo e os últimos N posts.

**Tier 2 — Pago (Pesquisa Profunda):** A consultora aciona a "Pesquisa Profunda" dentro de uma consultoria. O sistema descobre automaticamente concorrentes locais via Google Maps, analisa o Instagram de cada um, raspa os sites dos concorrentes via Firecrawl, e usa GPT-4 para gerar um relatório de mercado completo, contextualizado e estruturado. Todo o comportamento é controlável pelo admin via painel de configuração dedicado.

---

## 3. Contexto de Negócio

- **Produto:** Estrategize SaaS (Iris) — plataforma B2B para consultoras de negócios locais
- **Usuária principal:** Consultora de negócios (ex: mentora de nail studios, ateliês, salões)
- **Cliente da consultora:** Empreendedora local que recebe a consultoria
- **Modelo de monetização do plugin:** Plugin `pesquisa-mercado` vendido como add-on ou incluído em plano superior; Tier 1 gratuito como gancho de valor imediato
- **Diferencial competitivo:** Nenhum SaaS de consultoria local no Brasil entrega isso integrado nativamente

---

## 4. Escopo

### Incluído

- [ ] Instagram Auto-Scan disparado automaticamente no create de consultoria (Tier 1)
- [ ] Card de diagnóstico Instagram exibido na consultoria (Tier 1 UI)
- [ ] Admin Config Panel: painel completo e customizável no admin para controlar todos os parâmetros do plugin
- [ ] Pipeline completo de Pesquisa Profunda: Google Maps → Instagram concorrentes → Firecrawl sites → GPT-4 relatório (Tier 2)
- [ ] Tab "Pesquisa de Mercado" na Central da Cliente (aparece quando plugin instalado)
- [ ] Progresso em tempo real durante execução da pesquisa
- [ ] Relatório renderizado em Markdown com todas as seções configuráveis
- [ ] Integração RAG: relatório indexado automaticamente na base de conhecimento da consultoria
- [ ] Sistema de créditos integrado: custo configurável por tipo de pesquisa

### Fora do Escopo (MVP)

- Monitoramento contínuo (alertas automáticos quando concorrente postar)
- Export PDF do relatório
- Histórico de múltiplas pesquisas comparadas
- Scraping de TikTok, YouTube, Meta Ads Library
- Integração com Google Calendar
- Geração de conteúdo baseado na análise

---

## 5. Premissas

- `APIFY_API_KEY` já está configurada no `backend/.env` e funcional
- `FIRECRAWL_API_KEY` já está configurada no `backend/.env` (usuário confirmou)
- Plugin system já está construído (Phases 21-23): tabelas `plugins` e `consultancy_plugins`
- Pipeline RAG já está operacional: `knowledge_documents`, `knowledge_chunks`, `embeddingService`, `knowledgeService`
- `apifyService.ts` já existe com função genérica `runActor()`
- Admin já tem estrutura de rotas em `backend/src/routes/admin/`

---

## 6. Restrições

- **Não bloquear o create de consultoria:** scan IG é fire-and-forget — CREATE retorna em < 300ms
- **Sem filas externas (Redis/BullMQ):** processamento via `setImmediate` + status no banco
- **Arquitetura 3 camadas obrigatória:** Página ≤ 20 linhas, Agregador ≤ 200, Micro-módulo ≤ 80
- **TypeScript strict:** zero `any`
- **Sem novas dependências de UI além das já instaladas**
- **RLS obrigatório** em todas as novas tabelas
- A única nova dependência de backend permitida é `@mendable/firecrawl-js`

---

## 7. Perfis de Usuário

| Perfil | Ação | Expectativa |
|---|---|---|
| Consultora (membro) | Cadastra consultoria com IG | Vê card com diagnóstico IG em ~2 min sem fazer nada extra |
| Consultora (membro) | Instala plugin + inicia pesquisa profunda | Vê progresso, recebe relatório completo em < 5 min |
| Admin (Iris) | Acessa `/admin/plugins/pesquisa-mercado` | Controla todos os parâmetros: o que coletar, custo em créditos, quais seções do relatório, prompt customizado |

---

## 8. Fluxos Principais

### Fluxo 1 — Instagram Auto-Scan (Tier 1)

```
Consultora preenche wizard de criação de consultoria
  → Campo "Instagram" preenchido
  → POST /api/consultancies
  → Backend: cria consultoria normalmente (resposta imediata)
  → Backend: se instagram presente → instagramScanService.triggerScan(consultancyId, handle) [async, fire-and-forget]
    → Cria registro em instagram_snapshots (status: pending)
    → Chama Apify apify/instagram-profile-scraper
    → Atualiza instagram_snapshots (status: done | failed, raw_data)
  → Frontend: polling GET /api/market-research/instagram/:consultancyId a cada 5s
    → Skeleton loading enquanto status = pending/running
    → Exibe card de diagnóstico quando status = done
```

### Fluxo 2 — Pesquisa Profunda (Tier 2)

```
Consultora na Central da Cliente → aba "Pesquisa de Mercado" (plugin instalado)
  → Clica "Iniciar Pesquisa Profunda"
  → POST /api/market-research/:consultancyId/start
    → Verifica créditos (se custo > 0)
    → Cria registro em market_research (status: pending)
    → Carrega config do plugin
    → Inicia pipeline async:
      ETAPA 1: Google Maps → descobre concorrentes locais
      ETAPA 2: Instagram → scraping dos concorrentes
      ETAPA 3: Firecrawl → scraping dos sites (se habilitado)
      ETAPA 4: GPT-4 → gera relatório Markdown
      ETAPA 5: RAG → indexa relatório (se auto_index_rag = true)
    → Atualiza status a cada etapa
  → Frontend: polling GET /api/market-research/:consultancyId a cada 5s
    → Progress stepper mostra etapa atual
    → Exibe relatório + cards de concorrentes quando done
```

### Fluxo 3 — Admin Config Panel

```
Admin acessa /admin/plugins/pesquisa-mercado
  → GET /api/admin/plugins/pesquisa-mercado/config → carrega config atual
  → Edita campos nos formulários por seção
  → Clica "Salvar configurações"
  → PUT /api/admin/plugins/pesquisa-mercado/config → persiste no banco
  → Toast de confirmação
```

---

## 9. Regras de Negócio

| ID | Regra |
|---|---|
| RN-01 | Se scan IG falhar (perfil privado, Apify timeout), criar `instagram_snapshots` com status `failed` e `error_message` — não impede uso da consultoria |
| RN-02 | Se `credits_cost_basic = 0`, Tier 1 é sempre gratuito |
| RN-03 | Se `credits_cost_deep > 0`, verificar saldo antes de iniciar pesquisa profunda |
| RN-04 | Se `free_first_research = true`, primeira pesquisa profunda por consultoria é gratuita |
| RN-05 | Config é carregada no início de cada pipeline e usada como snapshot — mudanças na config não afetam pesquisas em andamento |
| RN-06 | Falha em uma etapa do pipeline não cancela as seguintes (graceful degradation) |
| RN-07 | Máximo 1 pesquisa profunda em status `running` por consultoria ao mesmo tempo |
| RN-08 | Relatório indexado no RAG é marcado com source_tag = config.rag_context_tag |
| RN-09 | `custom_system_prompt` substitui o prompt padrão completamente (não concatena) |
| RN-10 | Admin pode ativar/desativar o plugin inteiro (`enabled: false` → scan IG não roda + pesquisa profunda bloqueada) |

---

## 10. Requisitos Funcionais

| ID | Requisito |
|---|---|
| MKT-01 | Sistema dispara Instagram scan automaticamente ao criar consultoria com campo `instagram` preenchido |
| MKT-02 | Card de diagnóstico Instagram exibe: avatar, nome, seguidores, bio, posts totais, tipo de conta, taxa de engajamento, frequência semanal, grid dos últimos posts |
| MKT-03 | Admin visualiza e edita todos os parâmetros do plugin em painel dedicado `/admin/plugins/pesquisa-mercado` |
| MKT-04 | Admin controla: quais dados coletar no scan IG, quantos posts, fontes de descoberta de concorrentes, max concorrentes, sites habilitados, seções do relatório, prompt customizado, temperatura IA, idioma, custo em créditos, integração RAG |
| MKT-05 | Consultora inicia pesquisa profunda com 1 clique na aba do plugin |
| MKT-06 | UI exibe progresso em tempo real: etapas numeradas com status (pendente/rodando/concluída/falha) |
| MKT-07 | Relatório gerado é renderizado em Markdown formatado com seções separadas |
| MKT-08 | Seções do relatório são configuráveis pelo admin (checkboxes) |
| MKT-09 | Relatório pode ser indexado no RAG da consultoria (automático ou manual) |
| MKT-10 | Cards de concorrentes exibem: nome, seguidores, endereço (se Maps), rating (se Maps), preview do site (se Firecrawl) |
| MKT-11 | Admin pode digitar um prompt customizado que substitui o prompt padrão do GPT-4 para o relatório |
| MKT-12 | Admin define custo em créditos para Tier 1 (padrão: 0) e Tier 2 (padrão: 5) |

---

## 11. Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| NFR-01 | Create de consultoria não é bloqueado pelo scan IG (latência adicional < 50ms) |
| NFR-02 | Timeout máximo do pipeline completo: 5 minutos |
| NFR-03 | Polling frontend a cada 5 segundos, timeout após 180s (exibe mensagem de retry) |
| NFR-04 | Config do plugin é cacheada por 5 minutos no backend (não bater no banco a cada request) |
| NFR-05 | RLS em todas as tabelas: user vê apenas snapshots/research da sua própria consultoria |
| NFR-06 | Nenhuma chave de API (Apify, Firecrawl) exposta para o frontend |
| NFR-07 | Relatório de até 50.000 caracteres suportado sem quebrar o Markdown renderer |
| NFR-08 | Zero `any` TypeScript em código novo |

---

## 12. Dependências Técnicas

| Dependência | Onde | Status |
|---|---|---|
| `APIFY_API_KEY` | `backend/.env` | ✅ Configurada |
| `FIRECRAWL_API_KEY` | `backend/.env` | ✅ Configurada |
| `@mendable/firecrawl-js` | backend package.json | ❌ Instalar (Story 7.2) |
| Plugin system (tabelas `plugins`, `consultancy_plugins`) | DB | ✅ Existe |
| Pipeline RAG (`knowledgeService`) | backend/src/services | ✅ Existe |
| `apifyService.ts` (runActor wrapper) | backend/src/services | ✅ Existe |
| Markdown renderer no frontend | A verificar (pode usar `react-markdown`) | Story 7.8 verifica |
| `consultancies` table com campo `instagram` | DB | ✅ Existe |

---

## 13. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Perfil Instagram privado — scan retorna vazio | Alta | Baixo | Status `failed` com mensagem clara; não bloqueia fluxo |
| Apify timeout (> 300s) em lote grande de concorrentes | Média | Médio | Timeout configurável; graceful degradation por etapa |
| GPT-4 gera relatório genérico sem contexto suficiente | Média | Alto | Prompt padrão inclui instruções de contextualização; admin pode customizar |
| Firecrawl retorna site sem conteúdo útil (só JS/SPA) | Média | Baixo | Graceful skip se conteúdo < 200 chars |
| Custo Apify acima do esperado em uso intenso | Baixa | Alto | Limites configuráveis no admin (max_competitors) |
| Usuária espera resultado mas pipeline falha silenciosamente | Média | Alto | Status explícito no banco + mensagem de erro no frontend |

---

## 14. Critérios de Aceitação (Epic-Level)

- [ ] Criar consultoria com Instagram → card de diagnóstico aparece em < 3 min sem ação adicional da consultora
- [ ] Admin acessa `/admin/plugins/pesquisa-mercado` e vê painel com todas as seções de configuração
- [ ] Admin salva configuração → mudança persiste e afeta próximas pesquisas
- [ ] Consultora com plugin instalado → aba "Pesquisa de Mercado" visível na Central
- [ ] Clicar "Iniciar Pesquisa Profunda" → progress bar com etapas numeradas
- [ ] Pesquisa completa → relatório renderizado em Markdown com seções corretas
- [ ] Config `auto_index_rag = true` → após pesquisa, documento aparece em documentos RAG da consultoria
- [ ] Config `credits_cost_deep = 5` → pesquisa debita 5 créditos
- [ ] Falha no Apify → consultoria ainda funciona normalmente, card exibe mensagem de erro

---

## 15. Observações para Execução

- **Ordem obrigatória das stories:** 7.1 primeiro (migration); depois 7.2 e 7.3 em paralelo; depois 7.4 e 7.5 em paralelo; depois 7.6 e 7.7 em paralelo; depois 7.8 e 7.9 em paralelo
- **Registro do plugin:** Story 7.1 inclui INSERT do plugin `pesquisa-mercado` na tabela `plugins`
- **Config caching:** usar variável de módulo com TTL simples (sem Redis) — suficiente para MVP
- **react-markdown:** já verificar se está instalado no frontend antes de Story 7.8; se não, instalar
- **Não criar novo sistema de jobs:** usar `setImmediate(() => pipeline())` com status no banco

---

## EPICS

### Epic 7-A — Fundação (DB + Serviços Core)
Stories: 7.1, 7.2

### Epic 7-B — Admin Config Panel
Stories: 7.3, 7.4

### Epic 7-C — Pipeline de Pesquisa Profunda
Stories: 7.5, 7.6

### Epic 7-D — Frontend Integration
Stories: 7.7, 7.8

### Epic 7-E — RAG Integration
Story: 7.9
