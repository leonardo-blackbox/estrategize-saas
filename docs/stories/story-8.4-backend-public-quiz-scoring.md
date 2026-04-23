# Story 8.4 — Backend: Public Quiz Route + Score Calculation

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.4
**Status:** Ready for Review
**Branch:** feat/8.4-backend-public-quiz
**Wave:** 2
**Depends on:** Story 8.3

---

## User Story

> **Como** respondente,
> **Quero** completar um quiz e receber meu score e resultado personalizado,
> **Para** saber em qual tier estou e qual é o próximo passo recomendado.

---

## Contexto Técnico

**ISOLAMENTO CRÍTICO — NÃO TOCAR:**
- `backend/src/services/formSubmissionService.ts` → NÃO MODIFICAR
- `backend/src/routes/public/forms.ts` → NÃO MODIFICAR

**Arquivos a criar:**
- `backend/src/services/quizSubmissionService.ts` (novo — separado de formSubmissionService)
- `backend/src/routes/public/quizzes.ts` (novo — separado de forms.ts)

**Reutilizar (import, não copiar):**
- `BOT_UA_PATTERNS` e `filterBotUA` de `formTrackingService.ts`
- `fireEmailNotification` de `formSubmissionService.ts` (ou duplicar se coupling for ruim)
- `trackEvent` e `fireSubmitCapiEvents` de `formTrackingService.ts`

**Rate limiting:** 100 requests per 15 min (mesmo padrão de forms)

---

## Acceptance Criteria

### AC1 — `GET /public/quizzes/:slug`
- [x] Retorna quiz publicado + fields (ordenados por position) + quiz_outcomes (ordenados por order)
- [x] 404 se slug não existe ou quiz não está publicado
- [x] Remove da resposta: `metaAccessToken`, `metaTestEventCode` (tracking keys sensíveis)
- [x] Sem autenticação necessária (rota pública)
- [x] Inclui `tool_type`, `quiz_config`, `theme_config`, `settings`

### AC2 — `GET /public/quizzes/:slug/preview`
- [x] Requer autenticação (`requireAuth`)
- [x] Verifica ownership (user_id = quiz.user_id)
- [x] Retorna mesmo formato de GET /:slug mas sem filtro de status
- [x] 403 se não é dono do quiz

### AC3 — `POST /public/quizzes/:slug/responses`
- [x] Aceita body: `{ answers: [{field_id, field_type, field_title, value}], metadata? }`
- [x] Bot filtering via `BOT_UA_PATTERNS` (rejeita com 400 se bot detectado)
- [x] Rate limiting: 100 req/15min por IP
- [x] Salva em `application_responses` (status='complete') + `application_response_answers`
- [x] Calcula score via `calculateQuizScore(fields, answers)`
- [x] Encontra outcome correspondente via `getOutcomeByScore(outcomes, score)`
- [x] Retorna: `{ responseId, score: number, outcome: QuizOutcome | null }`
- [x] Armazena `{ score, outcomeKey }` em `application_responses.metadata`
- [x] Incrementa `response_count` em `applications`
- [x] Fire-and-forget: dispara CAPI events e email notification (async, não bloqueia response)

### AC4 — `POST /public/quizzes/:slug/events`
- [x] Mesma lógica de `/public/forms/:slug/events` (fire-and-forget tracking)
- [x] Aceita: `{ event_type: 'view' | 'start' | 'submit', session_token? }`
- [x] Bot filtering aplicado

### AC5 — `calculateQuizScore(fields, answers)` em `quizSubmissionService.ts`
```typescript
// Algoritmo:
// 1. Para cada answer, encontrar o field correspondente
// 2. Se field tem options.choices com scoreValue, somar o scoreValue da escolha feita
// 3. Calcular maxPossívelScore = soma dos maxScoreValue de cada field com choices
// 4. Se maxPossívelScore = 0, retornar 0
// 5. Retornar Math.round((totalPoints / maxPossívelScore) * 100)
```
- [x] Retorna número 0-100
- [x] Campos sem choices (short_text, email, etc.) não contribuem para score
- [x] Retorna 0 se nenhum campo tem scoreValue configurado

### AC6 — `getOutcomeByScore(outcomes, score)` em `quizSubmissionService.ts`
- [x] Retorna primeiro outcome onde `score_min <= score <= score_max` (ordenados por order)
- [x] Retorna `null` se nenhum outcome cobre o score

### AC7 — Registro da rota
- [x] Rota pública `/public/quizzes` registrada em `backend/src/routes/index.ts` (ou equivalente)

---

## Definition of Done

- [x] `backend/src/services/quizSubmissionService.ts` criado
- [x] `backend/src/routes/public/quizzes.ts` criado
- [x] Rota pública registrada
- [x] `formSubmissionService.ts` e `forms.ts` NÃO foram modificados (verificar com git diff)
- [x] `GET /public/quizzes/:slug` retorna dados para quiz publicado
- [x] `POST /public/quizzes/:slug/responses` retorna `{responseId, score, outcome}`
- [x] Score calculado corretamente para um quiz com 3 questões (10pts + 5pts + 0pts = 15/30 = 50%)
- [x] TypeScript sem `any`

---

## AC8 — Meta Pixel + CAPI: Eventos de tracking do quiz

### Arquitetura de 4 eventos (confirmada)

| # | Evento | Momento | Tipo |
|---|--------|---------|------|
| 1 | `ViewContent` | Welcome screen renderiza | Automático (via `/events` endpoint) |
| 2 | `QuizStarted` | Usuário clica "Começar" | Custom event (via `/events` endpoint) |
| 3 | `Lead` | Usuário avança além do campo com `triggerLeadEvent: true` | Mid-quiz via `/lead-event` endpoint |
| 4 | `SubmitApplication` | Quiz finalizado (submit) | Automático no submit |

### Novo endpoint: `POST /public/quizzes/:slug/lead-event`

```typescript
// Body: { answers: [{field_id, field_type, field_title, value}], session_token? }
// - Aceita respostas parciais (somente até a questão atual)
// - Extrai name, email, phone das respostas parciais (mesmo padrão do submit)
// - Dispara CAPI Lead server-side (fire-and-forget)
// - Retorna: { ok: true }
// - Rate limiting + bot filtering aplicados (mesmo padrão de /responses)
```

### Lógica de disparo no submit (`fireQuizTrackingEvents`)

```typescript
async function fireQuizTrackingEvents(quiz, score, outcome, answers, meta) {
  // 1. SubmitApplication — SEMPRE dispara no submit final
  await fireSubmitCapiEvents(quiz, answers, meta, ['SubmitApplication']);

  // 2. Pixel event do outcome — disparado se outcome tem pixel_event_name configurado
  if (outcome?.pixel_event_name) {
    await fireSubmitCapiEvents(quiz, answers, meta, [outcome.pixel_event_name]);
  }
}
// Lead NÃO dispara aqui — é disparado mid-quiz via /lead-event endpoint
```

### ACs específicos de tracking

- [x] `fireQuizTrackingEvents()` criada em `quizSubmissionService.ts` (separada de `formSubmissionService`)
- [x] `SubmitApplication` disparado SEMPRE no submit final (comportamento base)
- [x] `outcome.pixel_event_name` disparado via CAPI se definido e não nulo (ex: `Contact`, `Schedule`)
- [x] Novo endpoint `POST /public/quizzes/:slug/lead-event` criado em `routes/public/quizzes.ts`
- [x] Endpoint `/lead-event` aceita partial answers, extrai name/email/phone, dispara CAPI Lead (fire-and-forget)
- [x] Endpoint `/lead-event`: rate limiting + bot filtering aplicados
- [x] Todos os eventos CAPI incluem email, phone, name extraídos das respostas
- [x] `score` e `outcome_key` incluídos no payload CAPI como `custom_data` no SubmitApplication:
  ```json
  { "custom_data": { "quiz_score": 68, "quiz_outcome": "avancado" } }
  ```
- [x] `formSubmissionService.ts` NÃO modificado — lógica 100% em `quizSubmissionService.ts`

## File List

- `backend/src/services/quizSubmissionService.ts`
- `backend/src/routes/public/quizzes.ts`
- `backend/src/services/metaCapiService.ts`
- `backend/src/app.ts`

## Dev Agent Record

- Criado serviço público separado para quiz com `getPublishedQuiz`, preview autenticado, submissão, `calculateQuizScore`, `getOutcomeByScore`, Lead mid-quiz e CAPI `SubmitApplication`.
- Criada rota pública `/api/public/quizzes` com endpoints `GET /:slug`, `GET /:slug/preview`, `POST /:slug/responses`, `POST /:slug/events` e `POST /:slug/lead-event`.
- Estendido `sendCapiEvent` com `customData` opcional para enviar `quiz_score` e `quiz_outcome` sem alterar comportamento existente.
- Verificações executadas: `npx eslint src/services/quizSubmissionService.ts src/routes/public/quizzes.ts src/services/metaCapiService.ts src/app.ts`, `npx tsc --noEmit`, diff vazio nos arquivos proibidos de backend.
