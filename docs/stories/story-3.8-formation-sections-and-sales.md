# Story 3.8 — Seções Personalizáveis na Formação + Configurações de Vendas do Curso

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.8
**Status:** Ready for Development
**Created by:** @sm (River)
**Date:** 2026-03-12
**Branch sugerida:** `feat/3.8-formation-sections-and-sales`

---

## Contexto

A `FormacaoPage` exibe atualmente uma única seção fixa chamada "Seus Cursos" com todos os cursos do catálogo. O admin não tem controle sobre como organizar o conteúdo da área de membros.

Além disso, cursos bloqueados mostram apenas um cadeado — não há nenhum CTA de compra. O admin precisa conseguir configurar um link de vendas por curso para que usuários sem acesso possam ser direcionados à compra.

Esta story cobre dois entregáveis interdependentes:

1. **Seções personalizáveis**: Admin cria/renomeia/reordena seções na Formação. Cada seção agrupa cursos. A FormacaoPage exibe essas seções dinamicamente.
2. **Configurações de vendas por curso**: Aba "Vendas" na página de detalhe do curso no admin — permite configurar URL de vendas, ativar "selo de oferta" e seu texto. Cursos bloqueados com `sales_url` configurado exibem um botão "Comprar" para o membro.

---

## Arquitetura Proposta

### DB — Migration 011

```sql
-- Seções da Formação (organizadas pelo admin)
CREATE TABLE public.formation_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Cursos associados a cada seção
CREATE TABLE public.formation_section_courses (
  section_id  UUID NOT NULL REFERENCES public.formation_sections(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (section_id, course_id)
);

-- RLS: admin lê/escreve, qualquer autenticado lê
ALTER TABLE public.formation_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections_read_auth" ON public.formation_sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sections_admin_all" ON public.formation_sections USING (true) WITH CHECK (true); -- via service_role

ALTER TABLE public.formation_section_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "section_courses_read_auth" ON public.formation_section_courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "section_courses_admin_all" ON public.formation_section_courses USING (true) WITH CHECK (true);

-- Inserir seção padrão "Seus Cursos" para não quebrar existente
INSERT INTO public.formation_sections (title, sort_order) VALUES ('Seus Cursos', 0);
```

```sql
-- Adicionar campos de vendas na tabela courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS sales_url           TEXT,
  ADD COLUMN IF NOT EXISTS offer_badge_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_badge_text    TEXT DEFAULT 'Oferta';
```

### Backend — Novos endpoints

**Seções (admin)** — em novo arquivo `backend/src/routes/admin/formacao.ts`:
- `GET /api/admin/formacao/sections` — lista seções com cursos associados
- `POST /api/admin/formacao/sections` — cria seção
- `PATCH /api/admin/formacao/sections/:id` — renomeia ou reordena seção
- `DELETE /api/admin/formacao/sections/:id` — deleta seção (desassociar cursos antes)
- `PUT /api/admin/formacao/sections/:id/courses` — substitui lista de cursos da seção (array `[{course_id, sort_order}]`)
- `PATCH /api/admin/formacao/sections/reorder` — atualiza sort_order de múltiplas seções em batch

**Seções (membro)** — em `backend/src/routes/api/courses.ts`:
- `GET /api/courses/sections` — retorna seções ativas com cursos + access check por seção

**Cursos (admin vendas)** — endpoints adicionais em `backend/src/routes/admin/courses.ts`:
- `PATCH /api/admin/courses/:id/sales` — atualiza `sales_url`, `offer_badge_enabled`, `offer_badge_text`

---

## Acceptance Criteria

### AC1 — DB e migration
- [ ] Migration `011_formation_sections.sql` criada e versionada
- [ ] Tabelas `formation_sections` e `formation_section_courses` criadas com RLS
- [ ] Colunas `sales_url`, `offer_badge_enabled`, `offer_badge_text` adicionadas em `courses`
- [ ] Seção padrão "Seus Cursos" inserida na migration (para não quebrar estado atual)

### AC2 — Backend admin: CRUD de seções
- [ ] `GET /api/admin/formacao/sections` retorna seções ordenadas por `sort_order` com cursos
- [ ] `POST /api/admin/formacao/sections` cria seção (valida `title` non-empty)
- [ ] `PATCH /api/admin/formacao/sections/:id` atualiza `title` ou `sort_order` ou `is_active`
- [ ] `DELETE /api/admin/formacao/sections/:id` remove seção (permite se não tiver cursos, ou force=true)
- [ ] `PUT /api/admin/formacao/sections/:id/courses` substitui cursos da seção
- [ ] `PATCH /api/admin/formacao/sections/reorder` atualiza sort_order em batch

### AC3 — Backend membro: seções com cursos
- [ ] `GET /api/courses/sections` retorna apenas seções `is_active = true`
- [ ] Cada seção retorna seus cursos com `access` check (mesmo formato de `GET /api/courses`)
- [ ] Cursos sem seção associada retornam na seção padrão (se existir) OU em seção implícita
- [ ] Ordenados por `formation_section_courses.sort_order`

### AC4 — Backend admin: configurações de vendas do curso
- [ ] `PATCH /api/admin/courses/:id/sales` atualiza os 3 campos de vendas
- [ ] Valida: `sales_url` deve ser URL válida se fornecida; `offer_badge_text` max 30 chars
- [ ] `GET /api/admin/courses/:id` já retorna os novos campos (sem alteração adicional)

### AC5 — Frontend Admin: `AdminFormacaoPage` (nova página)
- [ ] Rota `/admin/formacao` adicionada em `App.tsx` e no grupo "Área de Membros" do sidebar
- [ ] Lista seções com drag-to-reorder (ou botões ↑↓ para simplicidade)
- [ ] Botão "+ Nova Seção" → modal com campo `title`
- [ ] Cada seção tem: editar nome (inline ou modal), ativar/desativar, deletar
- [ ] Cada seção tem: botão "Gerenciar cursos" → abre modal que lista todos os cursos com checkbox para incluir/excluir da seção + drag para reordenar
- [ ] Feedback de sucesso/erro em todas as operações

### AC6 — Frontend Admin: aba "Vendas" em `AdminCursoDetailPage`
- [ ] Nova aba "Vendas" adicionada ao tabset existente
- [ ] Campos: "URL da página de vendas" (text/url input), "Ativar selo de oferta" (toggle), "Texto do selo" (text input, max 30 chars, aparece apenas se toggle ativo)
- [ ] Botão salvar chama `PATCH /api/admin/courses/:id/sales`
- [ ] Preview do badge de oferta visível na aba ao ativar

### AC7 — Frontend Membro: `FormacaoPage` com seções dinâmicas
- [ ] `FormacaoPage` chama `GET /api/courses/sections` ao carregar
- [ ] Renderiza cada seção com seu título e grid de cursos
- [ ] Fallback: se API falhar ou retornar vazio, mantém comportamento atual (todos os cursos em uma seção)
- [ ] Loading skeleton por seção
- [ ] Seções sem cursos não são renderizadas

### AC8 — Frontend Membro: CTA de compra em curso bloqueado
- [ ] Cursos com `status === 'locked'` E `sales_url` configurado exibem botão "Comprar" na área do cadeado
- [ ] Botão abre `sales_url` em nova aba (`target="_blank"`)
- [ ] Cursos com `offer_badge_enabled = true` exibem o `offer_badge_text` no badge de status (substitui "Bloqueado")
- [ ] Cursos sem `sales_url` mantêm comportamento atual (cadeado sem botão)

---

## Dev Notes

### Estrutura backend `formacao.ts`

```ts
// backend/src/routes/admin/formacao.ts
import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const sectionSchema = z.object({
  title: z.string().min(1).max(100),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

router.get('/sections', async (_req, res) => {
  const { data, error } = await supabaseAdmin!
    .from('formation_sections')
    .select(`
      id, title, sort_order, is_active, created_at,
      formation_section_courses (
        sort_order,
        courses (id, title, cover_url, status)
      )
    `)
    .order('sort_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST, PATCH, DELETE, PUT /:id/courses, PATCH reorder
// ...
```

### Roteamento em `backend/src/index.ts`

```ts
import formacaoRouter from './routes/admin/formacao.js';
// ...
app.use('/api/admin/formacao', formacaoRouter);
```

### Endpoint membro `GET /api/courses/sections`

```ts
// Adicionar em backend/src/routes/api/courses.ts
router.get('/sections', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  // 1. Buscar seções ativas com cursos
  const { data: sections, error } = await supabaseAdmin!
    .from('formation_sections')
    .select(`
      id, title, sort_order,
      formation_section_courses (
        sort_order,
        courses (id, title, total_lessons, cover_url, sales_url, offer_badge_enabled, offer_badge_text)
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // 2. Para cada curso, verificar acesso do usuário (reusar lógica do getCatalog)
  // Retornar seções com cursos enriquecidos com access info
  res.json(sections ?? []);
});
```

### Frontend: `AdminFormacaoPage` estrutura

```tsx
// frontend/src/pages/admin/AdminFormacaoPage.tsx
// Lista de seções com accordion
// Modal de criar seção
// Modal de gerenciar cursos da seção (checklist com todos os cursos do catálogo)
// Botões ↑↓ para reordenar seções (sem lib de drag — simplicidade)
```

### Frontend: Aba Vendas em `AdminCursoDetailPage`

```tsx
// Nova aba adicionada ao TABS array existente:
const TABS = ['Conteúdo', 'Vendas']; // (atual tem apenas conteúdo implícito)

// SalesTab component:
function SalesTab({ course, courseId }) {
  const [form, setForm] = useState({
    sales_url: course.sales_url ?? '',
    offer_badge_enabled: course.offer_badge_enabled ?? false,
    offer_badge_text: course.offer_badge_text ?? 'Oferta',
  });
  // PATCH /api/admin/courses/:id/sales
}
```

### Frontend: CTA de compra em `FormacaoPage`

```tsx
// No card de curso bloqueado, adicionar abaixo do lock icon:
{isBlocked && course.salesUrl && (
  <a
    href={course.salesUrl}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="absolute bottom-3 left-3 right-3 z-20 ..."
  >
    Comprar
  </a>
)}

// O offer_badge_text substitui 'Bloqueado' no EntitlementBadge quando offer_badge_enabled
```

### Tipo atualizado `CatalogCourse`

```ts
// frontend/src/api/courses.ts — atualizar interface
export interface CatalogCourse {
  // ... campos existentes
  sales_url?: string | null;
  offer_badge_enabled?: boolean;
  offer_badge_text?: string | null;
}
```

---

## Tasks

- [ ] **Task 1 — DB: Migration 011**
  - [ ] Criar `backend/src/database/migrations/011_formation_sections.sql`
  - [ ] Tabelas `formation_sections` + `formation_section_courses` com RLS
  - [ ] Colunas `sales_url`, `offer_badge_enabled`, `offer_badge_text` em `courses`
  - [ ] Inserir seção padrão "Seus Cursos"

- [ ] **Task 2 — Backend: `routes/admin/formacao.ts`**
  - [ ] GET /sections — com cursos aninhados
  - [ ] POST /sections — criar com validação
  - [ ] PATCH /sections/:id — editar title/sort_order/is_active
  - [ ] DELETE /sections/:id — com guard (não deleta se tiver cursos, salvo force=true)
  - [ ] PUT /sections/:id/courses — substituir lista de cursos
  - [ ] PATCH /sections/reorder — batch update sort_order
  - [ ] Montar rota em `index.ts`

- [ ] **Task 3 — Backend: endpoint membro `GET /api/courses/sections`**
  - [ ] Busca seções ativas com cursos
  - [ ] Enriquecer com access check por curso (reusar lógica do getCatalog)
  - [ ] Retornar campos de vendas: `sales_url`, `offer_badge_enabled`, `offer_badge_text`

- [ ] **Task 4 — Backend: `PATCH /api/admin/courses/:id/sales`**
  - [ ] Adicionar em `backend/src/routes/admin/courses.ts`
  - [ ] Validar: url válida se fornecida, badge_text max 30 chars

- [ ] **Task 5 — Frontend API: atualizar `api/courses.ts`**
  - [ ] Adicionar `adminGetFormacaoSections()`, `adminCreateSection()`, `adminUpdateSection()`, `adminDeleteSection()`, `adminUpdateSectionCourses()`, `adminReorderSections()`
  - [ ] Adicionar `adminUpdateCoursesSales(id, data)`
  - [ ] Adicionar `getFormacaoSections()` (membro)
  - [ ] Atualizar `CatalogCourse` interface com campos de vendas

- [ ] **Task 6 — Frontend Admin: `AdminFormacaoPage.tsx`**
  - [ ] Criar `frontend/src/pages/admin/AdminFormacaoPage.tsx`
  - [ ] Lista de seções com accordion (cursos dentro)
  - [ ] Reorder via botões ↑↓
  - [ ] Modal criar seção (title input)
  - [ ] Edição inline de título (click para editar)
  - [ ] Toggle is_active por seção
  - [ ] Botão deletar seção (confirm dialog)
  - [ ] Modal "Gerenciar cursos": checklist de todos cursos do catálogo + reorder dentro da seção

- [ ] **Task 7 — Frontend Admin: aba Vendas em `AdminCursoDetailPage`**
  - [ ] Adicionar aba "Vendas" ao tabset
  - [ ] `SalesTab` component: URL, toggle badge, texto do badge
  - [ ] Preview do badge ao ativar
  - [ ] Salvar via `adminUpdateCoursesSales`

- [ ] **Task 8 — Frontend Membro: `FormacaoPage` com seções dinâmicas**
  - [ ] Substituir query `getCatalog` por `getFormacaoSections` como fonte principal
  - [ ] Fallback para `getCatalog` se seções retornarem vazio
  - [ ] Renderizar uma `<Section>` por seção retornada (título + grid de cursos)
  - [ ] Loading skeleton por seção
  - [ ] Não renderizar seções vazias

- [ ] **Task 9 — Frontend Membro: CTA de compra no card bloqueado**
  - [ ] Atualizar `mapCatalogToCard` para incluir `salesUrl` e `offerBadgeText`
  - [ ] `EntitlementBadge`: quando `offer_badge_enabled`, usar `offer_badge_text` em vez de "Bloqueado"
  - [ ] Card bloqueado + `salesUrl` → botão "Comprar" sobre o card
  - [ ] Botão `target="_blank"` + `stopPropagation()`

- [ ] **Task 10 — Routing: adicionar `/admin/formacao` no App + sidebar**
  - [ ] `App.tsx`: nova rota `<Route path="/admin/formacao" element={<AdminFormacaoPage />} />`
  - [ ] `AdminShell.tsx`: adicionar item `{ to: '/admin/formacao', label: 'Formação' }` no grupo "Área de Membros"

---

## Dev Agent Record

### Status
Ready for Development

### Agent Model Used
_preencher ao implementar_

### Completion Notes
_preencher ao implementar_

### Debug Log
_preencher se necessário_

### File List
- `backend/src/database/migrations/011_formation_sections.sql` (criar)
- `backend/src/routes/admin/formacao.ts` (criar)
- `backend/src/routes/admin/courses.ts` (modificar — adicionar PATCH /:id/sales)
- `backend/src/routes/api/courses.ts` (modificar — adicionar GET /sections)
- `backend/src/index.ts` (modificar — montar /api/admin/formacao)
- `frontend/src/api/courses.ts` (modificar — novos tipos + funções)
- `frontend/src/pages/admin/AdminFormacaoPage.tsx` (criar)
- `frontend/src/pages/admin/AdminCursoDetailPage.tsx` (modificar — aba Vendas)
- `frontend/src/pages/member/FormacaoPage.tsx` (modificar — seções dinâmicas + CTA compra)
- `frontend/src/components/layout/AdminShell.tsx` (modificar — novo item no sidebar)
- `frontend/src/App.tsx` (modificar — nova rota /admin/formacao)

### Change Log
| Data | Alteração |
|------|-----------|
| 2026-03-12 | Story criada pelo @sm (River) |
