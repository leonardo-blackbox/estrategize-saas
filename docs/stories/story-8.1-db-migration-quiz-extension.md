# Story 8.1 — DB Migration: Quiz Extension

**Épico:** Epic 8 — Ferramenta Quiz
**Story:** 8.1
**Status:** Done
**Branch:** feat/8.1-db-quiz-extension
**Wave:** 1 — BLOQUEIA TODAS AS OUTRAS STORIES

---

## User Story

> **Como** sistema,
> **Quero** que o banco de dados suporte quizzes com scoring e múltiplos resultados por tier,
> **Para** que todas as outras stories do Epic 8 possam construir sobre uma base sólida.

---

## Contexto Técnico

**Estado atual:**
- Tabela `applications` existe com tool_type NÃO existindo ainda
- Tabela `quiz_outcomes` NÃO existe
- Migrations numeradas até `015_applications.sql` (path: `backend/src/database/migrations/`)
- Supabase CLI disponível para aplicar migrations

**ISOLAMENTO:** Esta migration NÃO altera nenhum comportamento existente de Aplicações. Todas as colunas novas têm defaults. Registros existentes de forms ficam com `tool_type = 'form'` automaticamente.

**O que será construído:**
- `016_quiz_extension.sql` com 2 novas colunas em `applications` + 1 nova tabela `quiz_outcomes`

---

## Acceptance Criteria

### AC1 — Coluna `tool_type` em `applications`
- [x] `ALTER TABLE applications ADD COLUMN IF NOT EXISTS tool_type TEXT DEFAULT 'form' CHECK (tool_type IN ('form', 'quiz'))`
- [x] Registros existentes têm `tool_type = 'form'` (via default)
- [x] Constraint CHECK impede valores inválidos

### AC2 — Coluna `quiz_config` em `applications`
- [x] `ALTER TABLE applications ADD COLUMN IF NOT EXISTS quiz_config JSONB DEFAULT NULL`
- [x] Registros existentes têm `quiz_config = NULL`

### AC3 — Tabela `quiz_outcomes`
- [x] Tabela criada com colunas:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE`
  - `outcome_key TEXT NOT NULL`
  - `title TEXT NOT NULL`
  - `description TEXT`
  - `score_min INTEGER NOT NULL DEFAULT 0`
  - `score_max INTEGER NOT NULL DEFAULT 100`
  - `cta_type TEXT DEFAULT 'none' CHECK (cta_type IN ('url', 'whatsapp', 'none'))`
  - `cta_url TEXT`
  - `cta_label TEXT`
  - `image_url TEXT`
  - `background_color TEXT`
  - `"order" INTEGER DEFAULT 0`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`

### AC4 — RLS em `quiz_outcomes`
- [x] `ALTER TABLE quiz_outcomes ENABLE ROW LEVEL SECURITY`
- [x] Policy SELECT: usuário acessa apenas outcomes de applications que ele possui
  ```sql
  CREATE POLICY "Users manage own quiz outcomes" ON quiz_outcomes
    USING (application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()));
  ```
- [x] Policy INSERT/UPDATE/DELETE: mesma condição

### AC5 — Index de performance
- [x] `CREATE INDEX IF NOT EXISTS idx_quiz_outcomes_application_id ON quiz_outcomes(application_id)`

### AC6 — Idempotência
- [x] Migration usa `IF NOT EXISTS` em todas as operações
- [x] Rodar a migration duas vezes não causa erro

### AC7 — Aplicação sem erros
- [x] `supabase db push` ou migration aplicada sem erros
- [x] Verificar que tabela `applications` existente ainda funciona (SELECT * retorna dados)
- [x] Verificar que `quiz_outcomes` existe: `SELECT * FROM quiz_outcomes LIMIT 1` retorna 0 rows sem erro

---

## Score por opção — nota técnica

O score por opção de resposta NÃO precisa de nova coluna no DB. Fica armazenado no JSONB `options` existente de `application_fields`:

```json
{
  "choices": [
    { "label": "Iniciante", "value": "a", "scoreValue": 0 },
    { "label": "Avançado", "value": "c", "scoreValue": 10 }
  ]
}
```

Não é necessário alterar `application_fields` nesta story.

---

## Definition of Done

- [x] Arquivo `backend/src/database/migrations/016_quiz_extension.sql` criado
- [x] Migration aplica sem erros em ambiente remoto via `supabase db push`
- [x] Colunas existem em `applications`: `tool_type`, `quiz_config`
- [x] Tabela `quiz_outcomes` existe com RLS habilitado
- [x] Aplicações existentes não quebram (SELECT retorna dados normais)

## File List

- `backend/src/database/migrations/016_quiz_extension.sql`
- `supabase/migrations/20260422000008_quiz_extension.sql`

## Dev Agent Record

- Revisada migration idempotente com `tool_type`, `quiz_config`, `quiz_outcomes`, RLS, policy `FOR ALL`, índice e `pixel_event_name`.
- Aplicado `supabase db push`; migration `20260422000008_quiz_extension.sql` executada no remoto.
- Confirmado `SELECT * FROM quiz_outcomes LIMIT 1` via Supabase client: `{ ok: true, rows: 0 }`.
