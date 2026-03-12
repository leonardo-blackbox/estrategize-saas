# Story 3.3 — Dual Course Banners (Vertical + Horizontal)

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.3
**Status:** Ready for Review
**Created by:** @sm (River)
**Date:** 2026-03-11
**Branch sugerida:** `feat/3.3-course-dual-banners`

---

## Contexto

Cada curso precisa de dois tipos de imagem com usos distintos:

| Campo | Proporção | Onde é usado |
|-------|-----------|--------------|
| `cover_url` | Vertical (portrait ~2:3) | Cards na `FormacaoPage` |
| `banner_url` | Horizontal (landscape ~16:9) | Hero na `CoursePage` ao abrir o curso |

Atualmente só existe `cover_url`. O campo `banner_url` não existe no banco nem na API.
Além disso, nenhum dos dois é obrigatório hoje — o modal de criação permite salvar sem imagem.

---

## User Story

**Como** administrador da plataforma,
**Quero** ser obrigado a subir um banner vertical e um banner horizontal ao criar ou editar um curso,
**Para** garantir que todos os cursos tenham visual consistente no catálogo e na página do curso.

---

## Acceptance Criteria

### AC1 — Banco de dados
- [ ] Coluna `banner_url text` adicionada à tabela `courses` via migration SQL
- [ ] Migration é reversível (inclui rollback `DROP COLUMN`)

### AC2 — Backend: endpoint de upload do banner horizontal
- [ ] `POST /api/admin/courses/:id/banner` funciona igual ao `POST /:id/cover`
- [ ] Aceita `multipart/form-data` com campo `file`
- [ ] Faz upload para o mesmo bucket `course-covers` no path `courses/{id}/banner-{timestamp}.{ext}`
- [ ] Valida tipo (jpeg/png/webp) e tamanho (max 5 MB)
- [ ] Atualiza `courses.banner_url` se o curso já existir (mesma lógica do cover)
- [ ] Retorna `{ banner_url: string }`
- [ ] Protegido por `requireAuth` + `requireAdmin`

### AC3 — Backend: schema Zod atualizado
- [ ] `courseSchema` no backend aceita o campo `banner_url` em `POST /` e `PUT /:id`

### AC4 — Frontend API
- [ ] Função `adminUploadCourseBanner(courseId, file)` adicionada em `courses.ts`
- [ ] Interfaces `Course` e `CatalogCourse` incluem o campo `banner_url?: string`

### AC5 — Componente de upload genérico
- [ ] Componente `CourseCoverUpload` é generalizado para aceitar uma prop `label` descritiva
- [ ] Uma prop `aspectHint` opcional exibe a dica de proporção esperada ("Vertical 2:3" / "Horizontal 16:9")
- [ ] Comportamento e visual permanecem idênticos

### AC6 — Modal "Criar curso" (`AdminCursosPage`)
- [ ] Exibe **dois** campos de upload: "Capa vertical (card)" e "Banner horizontal (hero)"
- [ ] Botão "Criar curso" fica **desabilitado** enquanto `cover_url` ou `banner_url` estiverem vazios
- [ ] Ambos usam o mesmo `pendingId` para o path de upload temporário

### AC7 — Modal "Editar curso" (`AdminCursoDetailPage`)
- [ ] Exibe **dois** campos de upload: capa e banner
- [ ] Botão "Salvar" fica **desabilitado** enquanto qualquer um dos dois estiver vazio
- [ ] Preview do banner atual carregado a partir do `course.banner_url`

### AC8 — CoursePage: hero usa `banner_url`
- [ ] O hero da `CoursePage` exibe `banner_url` no lugar de `cover_url`
- [ ] Se `banner_url` não existir (cursos legados), usa `cover_url` como fallback
- [ ] **Remove** `grayscale` e `mix-blend-luminosity` da imagem do hero (mesmos filtros problemáticos da story 3.2)
- [ ] Mantém o gradiente `from-black via-black/70 to-transparent` para legibilidade do texto

### AC9 — Sem regressão
- [ ] `FormacaoPage` continua usando `cover_url` nos cards (sem mudança)
- [ ] Cursos sem `banner_url` não quebram a UI

---

## Especificação Técnica

### DB Migration

Arquivo: `backend/src/database/migrations/007_course_banner.sql`

```sql
-- Up
ALTER TABLE courses ADD COLUMN IF NOT EXISTS banner_url text;

-- Down
-- ALTER TABLE courses DROP COLUMN IF EXISTS banner_url;
```

> Executar manualmente no Supabase Dashboard (SQL Editor) ou via script de migration.

---

### Backend — `backend/src/routes/admin/courses.ts`

**1. Atualizar `courseSchema`:**
```ts
const courseSchema = z.object({
  // ... campos existentes ...
  banner_url: z.string().url().optional().nullable(),  // NOVO
});
```

**2. Novo endpoint (colar logo após o endpoint `POST /:id/cover`):**
```ts
router.post('/:id/banner', (req, res, next) => {
  upload.single('file')(req, res, (err) => { /* mesma lógica do cover */ next(); });
}, async (req, res) => {
  // idêntico ao /:id/cover, mas:
  // - storagePath: `courses/${courseId}/banner-${Date.now()}.${ext}`
  // - atualiza courses.banner_url
  // - retorna { banner_url }
});
```

---

### Frontend API — `frontend/src/api/courses.ts`

**Atualizar interfaces:**
```ts
export interface Course {
  // ...
  banner_url?: string;  // NOVO
}

export interface CatalogCourse {
  // ...
  banner_url?: string;  // NOVO (opcional, para uso futuro)
}
```

**Nova função:**
```ts
export async function adminUploadCourseBanner(
  courseId: string,
  file: File,
): Promise<{ banner_url: string }> {
  // idêntica a adminUploadCourseCover, mas POST /api/admin/courses/${courseId}/banner
}
```

---

### Componente — `frontend/src/components/admin/CourseCoverUpload.tsx`

Adicionar props:
```ts
interface CourseCoverUploadProps {
  courseId: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
  label?: string          // default: "Capa do curso"
  aspectHint?: string     // ex: "Vertical 2:3" ou "Horizontal 16:9"
  uploadFn?: (courseId: string, file: File) => Promise<{ cover_url: string } | { banner_url: string }>
}
```

> **Alternativa mais simples (preferida):** criar um segundo componente `CourseBannerUpload.tsx` copiando `CourseCoverUpload.tsx` e trocando `adminUploadCourseCover` → `adminUploadCourseBanner` e `cover_url` → `banner_url`. Evita quebrar o componente existente.

---

### `AdminCursosPage.tsx` — Modal "Criar curso"

```tsx
// Estado do form: adicionar banner_url
const initialForm = { title: '', description: '', cover_url: '', banner_url: '' };

// Dois uploads no modal
<CourseCoverUpload
  courseId={pendingIdRef.current}
  currentUrl={form.cover_url}
  onUploaded={(url) => setForm((f) => ({ ...f, cover_url: url }))}
  label="Capa vertical (card)"
  aspectHint="Proporção 2:3 recomendada"
/>
<CourseBannerUpload
  courseId={pendingIdRef.current}
  currentUrl={form.banner_url}
  onUploaded={(url) => setForm((f) => ({ ...f, banner_url: url }))}
  label="Banner horizontal (hero)"
  aspectHint="Proporção 16:9 recomendada"
/>

// Botão desabilitado se qualquer um vazio
disabled={!form.title.trim() || !form.cover_url || !form.banner_url || createMutation.isPending}
```

---

### `AdminCursoDetailPage.tsx` — Modal "Editar curso"

```tsx
// Estado: adicionar banner_url
const [courseForm, setCourseForm] = useState({ title: '', description: '', cover_url: '', banner_url: '' });

// Preencher ao abrir
const openEditCourse = () => {
  setCourseForm({
    title: course?.title ?? '',
    description: course?.description ?? '',
    cover_url: course?.cover_url ?? '',
    banner_url: course?.banner_url ?? '',  // NOVO
  });
  setEditingCourse(true);
};

// Dois uploads no modal
<CourseCoverUpload courseId={id!} currentUrl={courseForm.cover_url} ... label="Capa vertical (card)" />
<CourseBannerUpload courseId={id!} currentUrl={courseForm.banner_url} ... label="Banner horizontal (hero)" />

// Enviar banner_url no save
updateCourseMutation.mutate({
  title: courseForm.title,
  description: courseForm.description || undefined,
  cover_url: courseForm.cover_url || undefined,
  banner_url: courseForm.banner_url || undefined,  // NOVO
})

// Botão desabilitado
disabled={!courseForm.title.trim() || !courseForm.cover_url || !courseForm.banner_url || ...}
```

---

### `CoursePage.tsx` — Hero

```tsx
// Trocar cover_url por banner_url (com fallback)
const heroImage = course.banner_url ?? course.cover_url;

{heroImage && (
  <div className="absolute inset-0">
    <img
      src={heroImage}
      alt={course.title}
      className="w-full h-full object-cover"  // SEM grayscale, SEM mix-blend-luminosity, SEM opacity-30
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
  </div>
)}
```

---

## Arquivos a Modificar / Criar

| Arquivo | Ação |
|---------|------|
| `backend/src/database/migrations/007_course_banner.sql` | Criar — migration `ADD COLUMN banner_url` |
| `backend/src/routes/admin/courses.ts` | Modificar — `courseSchema` + endpoint `POST /:id/banner` |
| `frontend/src/api/courses.ts` | Modificar — interfaces + `adminUploadCourseBanner` |
| `frontend/src/components/admin/CourseBannerUpload.tsx` | Criar — componente de upload do banner |
| `frontend/src/pages/admin/AdminCursosPage.tsx` | Modificar — segundo upload + validação obrigatória |
| `frontend/src/pages/admin/AdminCursoDetailPage.tsx` | Modificar — segundo upload + validação obrigatória |
| `frontend/src/pages/member/CoursePage.tsx` | Modificar — hero usa `banner_url` + remove filtros |

---

## Fora do Escopo

- Upload de banner para módulos ou aulas
- Redimensionamento/crop automático de imagens
- Validação de proporção exata no frontend (usuário é responsável por subir a imagem correta)
- Cursos legados sem `banner_url` não precisam ser retroativamente preenchidos (fallback para `cover_url`)

---

## Critérios de Qualidade (DoD)

- [ ] Migration executada — `banner_url` existe no banco
- [ ] Upload de banner funciona end-to-end (cria e edita curso)
- [ ] Ambos os campos são obrigatórios — botões ficam desabilitados sem as duas imagens
- [ ] `CoursePage` exibe o banner horizontal a cores (sem grayscale)
- [ ] Cursos sem `banner_url` não quebram (fallback para `cover_url`)
- [ ] `npm run type-check` sem erros em frontend e backend

---

---

## Dev Agent Record

**Agent Model Used:** claude-sonnet-4-6
**Completion Notes:** 7 arquivos. Migration precisa ser executada manualmente no Supabase SQL Editor antes de testar.

### File List
| Arquivo | Ação |
|---------|------|
| `backend/src/database/migrations/007_course_banner.sql` | Criado |
| `backend/src/routes/admin/courses.ts` | Modificado — `banner_url` no schema + endpoint `POST /:id/banner` |
| `frontend/src/api/courses.ts` | Modificado — `banner_url` nas interfaces + `adminUploadCourseBanner` |
| `frontend/src/components/admin/CourseBannerUpload.tsx` | Criado |
| `frontend/src/pages/admin/AdminCursosPage.tsx` | Modificado — segundo upload + validação obrigatória |
| `frontend/src/pages/admin/AdminCursoDetailPage.tsx` | Modificado — segundo upload + validação obrigatória |
| `frontend/src/pages/member/CoursePage.tsx` | Modificado — `banner_url` no hero + remove grayscale |

### Change Log
- 2026-03-11: Implementação por @dev (Dex)

*Story 3.3 criada por @sm (River) — 2026-03-11*
