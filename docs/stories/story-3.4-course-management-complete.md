# Story 3.4 — Course Management Complete + Rich Lesson Page

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.4
**Status:** Ready for Development
**Created by:** @sm (River)
**Date:** 2026-03-11
**Branch sugerida:** `feat/3.4-course-management-complete`

---

## Contexto

A gestão de cursos no admin está incompleta: só é possível **criar** módulos e aulas, mas não **editar nem deletar**. Os campos de `drip_days` existem no banco mas nunca aparecem nos formulários. A `LessonPage` do membro não tem comentários, a navegação sequencial usa `navigate(-1)` (sem saber qual aula é a próxima de verdade), e não existe forma de configurar links/CTAs por aula.

Esta story fecha todas essas lacunas e eleva a área de membros a um nível profissional.

---

## Escopo em 4 Partes

| Parte | Área | Descrição |
|-------|------|-----------|
| **A** | Admin | Editar + deletar módulos e aulas; drip days |
| **B** | Admin | Links/CTAs configuráveis por aula |
| **C** | Member | Comentários por aula (com respostas) |
| **D** | Member | Navegação sequencial real + sidebar de módulos |

---

## Acceptance Criteria

### PARTE A — Admin: Gestão Completa de Módulos e Aulas

#### AC-A1 — Editar módulo
- [ ] Cada módulo na lista tem botão "Editar" (ícone de lápis)
- [ ] Modal de edição: `title`, `description`, `drip_days` (número de dias desde matrícula)
- [ ] Salvar chama `PUT /api/admin/courses/modules/:id`
- [ ] Lista atualiza sem recarregar a página

#### AC-A2 — Deletar módulo
- [ ] Cada módulo tem botão "Deletar"
- [ ] Confirmação inline antes de deletar ("Tem certeza? Isso remove todas as aulas.")
- [ ] Chama `DELETE /api/admin/courses/modules/:id`

#### AC-A3 — Editar aula
- [ ] Cada aula na lista tem botão "Editar" (ícone de lápis)
- [ ] Modal de edição: `title`, `description`, `video_url`, `duration_secs`, `drip_days`, `is_free_preview`
- [ ] Salvar chama `PUT /api/admin/courses/lessons/:id`
- [ ] Lista atualiza sem recarregar

#### AC-A4 — Deletar aula
- [ ] Cada aula tem botão "Deletar"
- [ ] Confirmação inline
- [ ] Chama `DELETE /api/admin/courses/lessons/:id`

#### AC-A5 — Drip days nos formulários de criação
- [ ] Modal "Novo módulo" inclui campo `Drip (dias)` (número, opcional, default 0)
- [ ] Modal "Nova aula" inclui campo `Drip (dias)` (número, opcional, default 0)

---

### PARTE B — Admin: Links e CTAs por Aula

#### AC-B1 — Banco de dados
- [ ] Tabela `lesson_links` criada via migration:
  ```sql
  id uuid PK, lesson_id uuid FK lessons, type text ('link'|'button'),
  label text, url text, sort_order int, created_at timestamptz
  ```
- [ ] RLS habilitado: leitura pública para membros com acesso; escrita apenas admin

#### AC-B2 — Backend: CRUD de links
- [ ] `GET /api/courses/lessons/:id` já retorna `lesson_links` (incluir no select)
- [ ] `POST /api/admin/courses/lessons/:id/links` — criar link/botão
- [ ] `PUT /api/admin/courses/lessons/links/:linkId` — editar
- [ ] `DELETE /api/admin/courses/lessons/links/:linkId` — deletar

#### AC-B3 — Admin UI: gerenciar links da aula
- [ ] Na lista de aulas expandida, cada aula tem ação "Gerenciar links"
- [ ] Abre modal com lista dos links existentes + botão "+ Adicionar"
- [ ] Formulário de link: `Tipo` (Link / Botão CTA), `Label`, `URL`
- [ ] Botão CTA é exibido de forma diferente do link simples na LessonPage

#### AC-B4 — Member: exibir links/CTAs na LessonPage
- [ ] Links simples aparecem como lista clicável abaixo da descrição
- [ ] Botões CTA aparecem como botões destacados (estilo do sistema de design)
- [ ] Abrem em nova aba (`target="_blank" rel="noopener noreferrer"`)

---

### PARTE C — Comentários por Aula

#### AC-C1 — Banco de dados
- [ ] Tabela `lesson_comments` criada via migration:
  ```sql
  id uuid PK DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz  -- soft delete
  ```
- [ ] RLS: usuário autenticado pode ler todos os comentários da aula (se tiver acesso à aula)
- [ ] RLS: usuário só edita/deleta os próprios comentários
- [ ] Índice em `lesson_id` para performance

#### AC-C2 — Backend: API de comentários
- [ ] `GET /api/courses/lessons/:id/comments` — lista comentários paginados (limit 20, offset), não deletados, ordenados por `created_at ASC`. Retorna `user.email` e `user.avatar_url` (join com profiles)
- [ ] `POST /api/courses/lessons/:id/comments` — criar comentário (`content`, `parent_id?`)
- [ ] `DELETE /api/courses/lessons/comments/:commentId` — soft delete (só o próprio usuário ou admin)
- [ ] Requer autenticação (`requireAuth`)

#### AC-C3 — Member: seção de comentários na LessonPage
- [ ] Seção "Comentários" abaixo dos materiais (antes da navegação)
- [ ] Exibe contador "X comentários"
- [ ] Campo de texto para novo comentário com botão "Comentar"
- [ ] Lista de comentários: avatar (inicial do email), nome/email, texto, data relativa ("há 2 dias"), botão "Responder", botão "Deletar" (só próprio)
- [ ] Respostas: indentação visual, exibidas abaixo do comentário pai
- [ ] Ao clicar "Responder": campo inline com `@email` pré-preenchido
- [ ] Paginação: botão "Ver mais comentários" se houver mais de 20
- [ ] Estado vazio: "Seja o primeiro a comentar nesta aula."

---

### PARTE D — Member: Navegação e UX Profissional

#### AC-D1 — Navegação sequencial real
- [ ] Botões "Anterior" e "Próxima" na LessonPage navegam para aulas adjacentes reais (não `navigate(-1)`)
- [ ] Para calcular anterior/próxima: o backend ou o frontend usa a lista de aulas do curso (ordenadas por módulo `sort_order` + aula `sort_order`)
- [ ] Aula anterior/próxima bloqueada por drip: botão aparece mas desabilitado com tooltip "Disponível em X dias"
- [ ] Última aula do curso: botão "Próxima" muda para "Concluir curso" → redireciona para `CoursePage`

#### AC-D2 — Sidebar de módulos dentro da aula (desktop)
- [ ] Em desktop (lg+), layout da `LessonPage` vira 2 colunas: player+conteúdo (esquerda, ~70%) + sidebar de módulos (direita, ~30%)
- [ ] Sidebar lista todos os módulos e aulas com estado (✓ concluída, → atual, 🔒 drip)
- [ ] Clicar em aula liberada navega direto
- [ ] Sidebar é sticky (rola com o conteúdo)
- [ ] Em mobile: sidebar não aparece (já existe navegação sequencial + breadcrumb)

#### AC-D3 — Melhorias visuais da LessonPage
- [ ] Descrição da aula renderiza markdown básico (negrito, itálico, listas, links) — usar biblioteca leve como `marked` ou renderização manual simples
- [ ] Tempo de leitura estimado exibido ao lado da duração do vídeo (calculado pelo tamanho da descrição)

---

## Especificação Técnica

### Migrations SQL

**Migration 008** — `lesson_links`:
```sql
CREATE TABLE IF NOT EXISTS lesson_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'link' CHECK (type IN ('link', 'button')),
  label text NOT NULL,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE lesson_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read_lesson_links" ON lesson_links FOR SELECT USING (true);
CREATE POLICY "admin_manage_lesson_links" ON lesson_links FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

**Migration 009** — `lesson_comments`:
```sql
CREATE TABLE IF NOT EXISTS lesson_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lesson_comments_lesson_id ON lesson_comments(lesson_id);
CREATE POLICY "auth_read_comments" ON lesson_comments FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_comments" ON lesson_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "auth_delete_own_comments" ON lesson_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
```

---

### Backend — Novos endpoints

**`backend/src/routes/admin/courses.ts`** (adicionar):
```
PUT  /modules/:id          — editar módulo (já existe o schema moduleSchema)
PUT  /lessons/:id          — editar aula (já existe lessonSchema)
POST /lessons/:id/links    — criar link
PUT  /lessons/links/:id    — editar link
DELETE /lessons/links/:id  — deletar link
```

**`backend/src/routes/courses.ts`** (member):
```
GET  /lessons/:id/comments       — listar comentários paginados
POST /lessons/:id/comments       — criar comentário
DELETE /lessons/comments/:id     — soft delete comentário
```

**Atualizar** `GET /api/courses/lessons/:lessonId` para incluir `lesson_links` no select:
```ts
.select(`*, lesson_attachments(*), lesson_links(*), modules(*, courses(*))`)
```

---

### Frontend — Novos arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/components/admin/ModuleEditModal.tsx` | Modal editar módulo (title, description, drip_days) |
| `src/components/admin/LessonEditModal.tsx` | Modal editar aula (todos os campos + drip_days) |
| `src/components/admin/LessonLinksModal.tsx` | Modal gerenciar links/CTAs de uma aula |
| `src/components/lesson/LessonComments.tsx` | Seção de comentários completa |
| `src/components/lesson/LessonSidebar.tsx` | Sidebar desktop de módulos/aulas |

### Frontend — Arquivos a modificar

| Arquivo | O que muda |
|---------|-----------|
| `src/api/courses.ts` | `adminUpdateModule`, `adminDeleteModule`, `adminUpdateLesson`, `adminDeleteLesson`, `adminCreateLessonLink`, `adminUpdateLessonLink`, `adminDeleteLessonLink`, `getLessonComments`, `createLessonComment`, `deleteLessonComment` |
| `AdminCursoDetailPage.tsx` | Botões editar/deletar em módulos e aulas; modais conectados |
| `LessonPage.tsx` | Sidebar desktop, navegação sequencial real, comentários, links/CTAs, markdown na descrição |

---

## Sugestões para Área de Membros Profissional

> Itens abaixo são **fora do escopo desta story** mas recomendados para stories futuras:

| Feature | Descrição | Prioridade |
|---------|-----------|-----------|
| **Notas pessoais por aula** | Campo de texto privado do membro, salvo por aula | Alta |
| **Certificado de conclusão** | PDF gerado ao completar 100% do curso | Alta |
| **Pesquisa de satisfação (NPS)** | Aparece ao concluir o curso | Média |
| **Bookmarks** | Membro salva timestamp favorito no vídeo | Média |
| **Transcrição da aula** | Campo `transcript` na aula, exibido em accordion | Média |
| **Reações rápidas** | 👍 ❤️ 🤔 nos comentários (sem contar como resposta) | Baixa |
| **Notificações** | Email quando alguém responde seu comentário | Baixa |
| **Progresso gamificado** | Badges ao completar módulos/cursos | Baixa |

---

## Arquivos a Criar / Modificar

| Arquivo | Ação |
|---------|------|
| `backend/src/database/migrations/008_lesson_links.sql` | Criar |
| `backend/src/database/migrations/009_lesson_comments.sql` | Criar |
| `backend/src/routes/admin/courses.ts` | Modificar — `PUT/DELETE /modules/:id`, `PUT/DELETE /lessons/:id`, CRUD links |
| `backend/src/routes/courses.ts` | Modificar — include `lesson_links`, comentários CRUD |
| `frontend/src/api/courses.ts` | Modificar — 10+ funções novas |
| `frontend/src/components/admin/ModuleEditModal.tsx` | Criar |
| `frontend/src/components/admin/LessonEditModal.tsx` | Criar |
| `frontend/src/components/admin/LessonLinksModal.tsx` | Criar |
| `frontend/src/components/lesson/LessonComments.tsx` | Criar |
| `frontend/src/components/lesson/LessonSidebar.tsx` | Criar |
| `frontend/src/pages/admin/AdminCursoDetailPage.tsx` | Modificar |
| `frontend/src/pages/member/LessonPage.tsx` | Modificar |

---

## Fora do Escopo

- Reordenação drag-and-drop de módulos/aulas (v2 — usar sort_order manual por enquanto)
- Moderação de comentários no admin
- Upload de vídeo direto (continua sendo URL externa)
- Transcrição automática de vídeo
- Notas pessoais do membro

---

## Critérios de Qualidade (DoD)

- [ ] Migrations executadas sem erro
- [ ] Editar e deletar módulo funciona end-to-end
- [ ] Editar e deletar aula funciona end-to-end
- [ ] Links/CTAs aparecem na LessonPage após configurar no admin
- [ ] Comentários: criar, responder e deletar funcionam
- [ ] Navegação "Próxima aula" usa ID real (não `navigate(-1)`)
- [ ] Sidebar de módulos aparece em desktop (lg+)
- [ ] RLS: usuário não deleta comentário de outro usuário (retorna 403)
- [ ] `npm run type-check` sem erros em frontend e backend

---

---

## Dev Agent Record

**Agent Model Used:** claude-sonnet-4-6
**Completion Notes:** 12 arquivos modificados/criados. Migrations 008 e 009 precisam ser executadas manualmente no Supabase SQL Editor. Backend já possuía PUT/DELETE para modules e lessons — apenas lesson_links CRUD e comments foram adicionados. Navegação prev/next computada server-side no endpoint GET /lessons/:id.

### File List
| Arquivo | Ação |
|---------|------|
| `backend/src/database/migrations/008_lesson_links.sql` | Criado |
| `backend/src/database/migrations/009_lesson_comments.sql` | Criado |
| `backend/src/routes/admin/courses.ts` | Modificado — include lesson_links no GET /:id + CRUD lesson_links |
| `backend/src/routes/courses.ts` | Modificado — lesson_links no select + prev/next nav + comments CRUD |
| `frontend/src/api/courses.ts` | Modificado — interfaces LessonLink, LessonComment + 10 novas funções |
| `frontend/src/components/admin/LessonLinksModal.tsx` | Criado |
| `frontend/src/components/lesson/LessonComments.tsx` | Criado |
| `frontend/src/components/lesson/LessonSidebar.tsx` | Criado |
| `frontend/src/pages/admin/AdminCursoDetailPage.tsx` | Modificado — edit/delete módulos e aulas + drip_days + links modal |
| `frontend/src/pages/member/LessonPage.tsx` | Modificado — links/CTAs + comentários + nav real + sidebar desktop + markdown |

### Change Log
- 2026-03-11: Implementação por @dev (Dex)

*Story 3.4 criada por @sm (River) — 2026-03-11*
