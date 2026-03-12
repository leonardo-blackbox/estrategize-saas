# Story 3.9 — Visibilidade de Curso + UX de Matrículas

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.9
**Status:** Ready for Development
**Created by:** @aios-master (Orion) via post-audit de Story 3.8
**Date:** 2026-03-12
**Branch sugerida:** `feat/3.9-visibility-and-enrollment-ux`

---

## Contexto

Após auditoria da Story 3.8, dois gaps funcionais foram identificados que ficaram fora do escopo original mas são esperados pelo produto:

1. **Visibilidade de curso**: Atualmente só existe `status` (draft/published/archived). Não há controle sobre quem pode VER o curso no catálogo — todos os membros autenticados veem todos os cursos publicados. Algumas situações requerem um curso visível apenas para determinados planos ou usuários, sem necessariamente ter acesso ao conteúdo.

2. **UX de matrículas**: A `AdminTurmasPage` recebeu a feature de criar/remover matrículas (Story 3.8 bugfix), mas ainda falta melhorar a experiência — adicionar busca na lista de matrículas por nome/email e exibir o email do usuário diretamente (hoje mostra apenas UUID parcial).

---

## Arquitetura Proposta

### DB — Migration 012

```sql
-- Adicionar campo de visibilidade em courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'all'
  CHECK (visibility IN ('all', 'enrolled_only', 'hidden'));

-- 'all'           → aparece para todos os membros autenticados (comportamento atual)
-- 'enrolled_only' → só aparece para quem tem entitlement/enrollment
-- 'hidden'        → não aparece no catálogo (admin ainda vê)
```

### Backend

**Endpoint existente a modificar** — `GET /api/courses/sections` e `GET /api/courses` (`getUserCoursesCatalog`):
- Filtrar cursos com `visibility = 'hidden'` para não-admins
- Cursos com `visibility = 'enrolled_only'` só aparecem se o usuário tiver acesso

**Endpoint novo** — `PATCH /api/admin/courses/:id/visibility`:
- Atualiza campo `visibility`
- Alternativa: incluir `visibility` no `PATCH /api/admin/courses/:id/sales` existente (mais simples)

**Melhor abordagem**: Adicionar `visibility` ao schema do `PATCH /:id/sales` já existente (renomear para `/settings`) OU criar campo separado no `PUT /:id` geral.

### Frontend Admin

**`AdminCursoDetailPage`** — aba "Vendas" ou nova aba "Configurações":
- Adicionar select de Visibilidade: `Todos os membros` / `Apenas matriculados` / `Oculto`
- Salvar junto com as configurações de vendas (mesmo endpoint PATCH /:id/sales ou PUT /:id)

### Frontend Membro

**`FormacaoPage` / `getCatalog` / `getFormacaoSections`**:
- Backend já deve filtrar — frontend não precisa mudar se o backend filtrar corretamente

---

## Acceptance Criteria

### AC1 — DB: Migration 012
- [ ] Coluna `visibility` adicionada em `courses` com CHECK constraint
- [ ] Default `'all'` para não quebrar cursos existentes

### AC2 — Backend: filtro por visibilidade no catálogo
- [ ] `GET /api/courses` (e `getUserCoursesCatalog`) filtra `hidden` para não-admins
- [ ] `GET /api/courses` filtra `enrolled_only` para usuários sem acesso ao curso
- [ ] `GET /api/courses/sections` aplica o mesmo filtro
- [ ] Admin vê todos os cursos independente de visibilidade

### AC3 — Backend: salvar visibilidade
- [ ] `visibility` adicionado ao schema de `PATCH /api/admin/courses/:id/sales` (ou `PUT /:id`)
- [ ] Validação: apenas os 3 valores permitidos

### AC4 — Frontend Admin: controle de visibilidade
- [ ] Select de visibilidade na aba "Vendas" do `AdminCursoDetailPage`
- [ ] Labels amigáveis: "Todos os membros" / "Apenas matriculados" / "Oculto"
- [ ] Salvo junto com as outras configs de vendas
- [ ] Preview/explicação do que cada opção faz

### AC5 — Frontend Admin: UX de matrículas melhorada
- [ ] `AdminTurmasPage`: coluna "Usuário" exibe email (não apenas UUID)
- [ ] Busca/filtro por email ou nome do usuário na lista de matrículas
- [ ] Badge de status visual por enrollment (enrolled/active)

---

## Dev Notes

### Filtro de visibilidade no catálogo (backend)

```typescript
// Em getUserCoursesCatalog (entitlementsService.ts) ou no router
// Adicionar condição ao SELECT:

// Para não-admins, filtrar visibility
let coursesQuery = supabaseAdmin
  .from('courses')
  .select('...')
  .eq('status', 'published');

if (!isAdmin) {
  // 'hidden' → nunca aparece
  // 'enrolled_only' → só aparece se tiver acesso
  coursesQuery = coursesQuery.neq('visibility', 'hidden');
}

// Depois do fetch, para enrolled_only:
const filtered = courses.filter(c => {
  if (c.visibility === 'enrolled_only') {
    return checkAccess(c.id).allowed;
  }
  return true;
});
```

### Adicionar visibility ao salesSchema (backend/src/routes/admin/courses.ts)

```typescript
const salesSchema = z.object({
  sales_url: z.string().url().optional().nullable(),
  offer_badge_enabled: z.boolean().optional(),
  offer_badge_text: z.string().max(30).optional().nullable(),
  visibility: z.enum(['all', 'enrolled_only', 'hidden']).optional(), // NOVO
});
```

### Frontend: VisibilitySelect component

```tsx
const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'Todos os membros', description: 'Aparece no catálogo para qualquer membro autenticado.' },
  { value: 'enrolled_only', label: 'Apenas matriculados', description: 'Só aparece para quem já tem acesso ao curso.' },
  { value: 'hidden', label: 'Oculto', description: 'Não aparece no catálogo. Apenas admins podem ver.' },
];
```

---

## Tasks

- [ ] **Task 1 — DB: Migration 012** — coluna `visibility` em `courses`
- [ ] **Task 2 — Backend: filtro** — `getUserCoursesCatalog` + `GET /api/courses/sections` respeitam visibility
- [ ] **Task 3 — Backend: PATCH sales** — adicionar `visibility` ao salesSchema
- [ ] **Task 4 — Frontend Admin: aba Vendas** — adicionar select de visibilidade em `AdminCursoDetailPage`
- [ ] **Task 5 — Frontend Admin: AdminTurmasPage** — exibir email, adicionar filtro por email/nome

---

## Dev Agent Record

### Status
Ready for Development

### Agent Model Used
_preencher ao implementar_

### Completion Notes
_preencher ao implementar_

### File List
- `backend/src/database/migrations/012_course_visibility.sql` (criar)
- `backend/src/services/entitlementsService.ts` (modificar — filtro visibility)
- `backend/src/routes/courses.ts` (modificar — GET /sections filtro visibility)
- `backend/src/routes/admin/courses.ts` (modificar — salesSchema + visibility)
- `frontend/src/api/courses.ts` (modificar — visibility em adminUpdateCourseSales)
- `frontend/src/pages/admin/AdminCursoDetailPage.tsx` (modificar — aba Vendas: visibility select)
- `frontend/src/pages/admin/AdminTurmasPage.tsx` (modificar — email + filtro por nome)

### Change Log
| Data | Alteração |
|------|-----------|
| 2026-03-12 | Story criada pelo @aios-master (Orion) — post-audit story 3.8 |
