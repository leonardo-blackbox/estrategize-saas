# Story 3.1 — Course Cover Image Upload (Admin)

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.1
**Status:** Ready for Review
**Created by:** @sm (River)
**Date:** 2026-03-11
**Branch sugerida:** `feat/3.1-course-cover-upload`

---

## Contexto

Atualmente, o admin precisa inserir a URL de uma imagem externamente hospedada para definir a capa de um curso (`AdminCursoDetailPage.tsx` → modal "Editar curso" → campo `cover_url`). Isso impede testar capas reais sem um servidor de imagens externo. A story adiciona upload direto de arquivo para o Supabase Storage.

---

## User Story

**Como** administrador da plataforma,
**Quero** fazer upload direto de um arquivo de imagem como capa de um curso,
**Para** poder testar e gerenciar capas sem depender de URLs externas.

---

## Acceptance Criteria

### AC1 — Upload via interface
- [ ] No modal "Editar curso", o campo "URL da capa" é substituído (ou complementado) por uma zona de upload
- [ ] O admin pode clicar na zona de upload para selecionar uma imagem
- [ ] Formatos aceitos: `image/jpeg`, `image/png`, `image/webp`
- [ ] Tamanho máximo: **5 MB** — exibe mensagem de erro clara se excedido
- [ ] A capa atual é exibida como preview antes do upload

### AC2 — Feedback visual
- [ ] Enquanto o upload ocorre, exibe estado de loading (spinner ou progress bar)
- [ ] Após upload bem-sucedido, exibe preview da nova imagem imediatamente
- [ ] Erro de upload exibe mensagem legível ao admin

### AC3 — Backend: endpoint de upload
- [ ] `POST /api/admin/courses/:id/cover` recebe `multipart/form-data` com campo `file`
- [ ] Faz upload para Supabase Storage bucket `course-covers` (público)
- [ ] Salva a URL pública retornada no campo `cover_url` da tabela `courses`
- [ ] Retorna `{ cover_url: string }` com status `200`
- [ ] Valida tipo (só imagens) e tamanho (max 5 MB) no backend
- [ ] Requer autenticação + role `admin` (`requireAuth` + `requireAdmin`)

### AC4 — Exibição na área de membros
- [ ] Após upload, a capa aparece corretamente nos cards da `FormacaoPage` e na `CoursePage`
- [ ] Imagens antigas (URL externa) continuam funcionando sem quebrar

### AC5 — Compatibilidade com URL
- [ ] O campo de URL externa (`cover_url`) continua disponível como alternativa (input colapsável ou tab)
- [ ] Se o admin preencher uma URL manual, ela sobrescreve normalmente

---

## Especificação Técnica

### Backend — `backend/src/routes/admin/courses.ts`

**Novo endpoint:**
```
POST /api/admin/courses/:id/cover
Content-Type: multipart/form-data
Authorization: Bearer <admin-jwt>

Body: { file: <image file> }

Response 200: { cover_url: string }
Response 400: { error: "Tipo de arquivo inválido" | "Arquivo muito grande" }
Response 404: { error: "Curso não encontrado" }
Response 500: { error: string }
```

**Implementação:**
- Usar `multer` com `memoryStorage` (não salva em disco)
  - `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB)
  - `fileFilter`: aceitar apenas `image/jpeg`, `image/png`, `image/webp`
- Upload via `supabaseAdmin.storage.from('course-covers').upload(path, buffer, { contentType, upsert: true })`
- Caminho no bucket: `courses/${courseId}/${Date.now()}-${filename}`
- Obter URL pública: `supabaseAdmin.storage.from('course-covers').getPublicUrl(path)`
- Atualizar `courses.cover_url` com a URL pública
- Retornar `{ cover_url }`

**Dependência nova:**
```bash
npm install multer @types/multer   # no backend
```

**Variável de ambiente:**
```
STORAGE_BUCKET_COURSES=course-covers   # já prevista no Epic 2
```

> **Nota:** O bucket `course-covers` precisa existir no Supabase Storage e ter política pública de leitura. O dev deve criá-lo manualmente no dashboard ou via migration de storage.

---

### Frontend — `AdminCursoDetailPage.tsx`

**Modal "Editar curso" — seção de capa:**

Substituir:
```tsx
<Input label="URL da capa" value={courseForm.cover_url} ... />
```

Por um componente `<CourseCoverUpload>` (novo, em `src/components/admin/CourseCoverUpload.tsx`) que:
- Exibe preview da capa atual (se `courseForm.cover_url` preenchido)
- Zona clicável com ícone de câmera
- `<input type="file" accept="image/jpeg,image/png,image/webp" hidden ref=... />`
- Ao selecionar arquivo: chama `POST /api/admin/courses/:id/cover` imediatamente
- Durante upload: overlay de loading sobre o preview
- Sucesso: atualiza `courseForm.cover_url` com a nova URL (sem precisar salvar o form todo)
- Seção expansível "Ou insira uma URL" para manter compatibilidade com URL manual

**Função de API nova em `frontend/src/api/courses.ts`:**
```ts
export async function adminUploadCourseCover(courseId: string, file: File): Promise<{ cover_url: string }>
```
- Usa `FormData` com `formData.append('file', file)`
- Chama `POST /api/admin/courses/:courseId/cover` com o token JWT no header

---

## Arquivos a Modificar / Criar

| Arquivo | Ação |
|---------|------|
| `backend/src/routes/admin/courses.ts` | Adicionar endpoint `POST /:id/cover` + multer |
| `backend/package.json` | Adicionar `multer` + `@types/multer` |
| `frontend/src/api/courses.ts` | Adicionar `adminUploadCourseCover()` |
| `frontend/src/components/admin/CourseCoverUpload.tsx` | Criar componente novo |
| `frontend/src/pages/admin/AdminCursoDetailPage.tsx` | Substituir Input por `<CourseCoverUpload>` no modal |

---

## Fora do Escopo

- Upload de imagens para módulos ou aulas (só capa do curso)
- Redimensionamento/otimização de imagem (v2)
- Deleção de imagens antigas do bucket ao trocar capa (v2)
- Drag-and-drop de arquivos (v2 — apenas click-to-upload no v1)

---

## Critérios de Qualidade (DoD)

- [ ] Endpoint testado manualmente: upload funciona, URL salva no banco, capa aparece na área de membros
- [ ] Validação de tipo e tamanho funciona (testa arquivo .pdf e arquivo >5MB)
- [ ] Admin sem role não consegue acessar o endpoint (403)
- [ ] Sem regressão: campo de URL manual ainda funciona
- [ ] TypeScript sem erros (`npm run type-check`)

---

## Estimativa de Esforço

**Complexidade:** Baixa-Média
**Agente sugerido:** `@dev`

---

---

## Dev Agent Record

**Agent Model Used:** claude-sonnet-4-6
**Completion Notes:** Implementado em 5 arquivos. Bucket `course-covers` deve ser criado manualmente no Supabase Storage com política pública de leitura antes de testar.

### File List
| Arquivo | Ação |
|---------|------|
| `backend/src/routes/admin/courses.ts` | Modificado — endpoint `POST /:id/cover` + multer |
| `backend/package.json` | Modificado — dependências `multer` + `@types/multer` |
| `frontend/src/api/courses.ts` | Modificado — função `adminUploadCourseCover` |
| `frontend/src/components/admin/CourseCoverUpload.tsx` | Criado |
| `frontend/src/pages/admin/AdminCursoDetailPage.tsx` | Modificado — integração do componente |

### Change Log
- 2026-03-11: Implementação inicial por @dev (Dex)

*Story 3.1 criada por @sm (River) — 2026-03-11*
