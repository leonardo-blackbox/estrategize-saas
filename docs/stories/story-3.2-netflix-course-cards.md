# Story 3.2 — Netflix-Style Course Cards (Formação Page)

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.2
**Status:** Ready for Review
**Created by:** @sm (River)
**Date:** 2026-03-11
**Branch sugerida:** `feat/3.2-netflix-course-cards`

---

## Contexto

Os cards de curso na `FormacaoPage` aplicam `grayscale + mix-blend-luminosity + opacity-40` na imagem e um gradiente com `opacity-95` da cor de fundo — o resultado é imagens completamente dessaturadas com um grande blur branco. Além disso, os cards têm proporção ~1:1 (thumbnail horizontal + área de texto abaixo), enquanto o padrão Netflix usa cards **verticais (portrait)** que mostram mais imagem e menos texto.

---

## User Story

**Como** membro da plataforma,
**Quero** ver os cards de cursos com as capas coloridas em formato vertical (portrait),
**Para** ter uma experiência visual similar ao Netflix, com a imagem sendo o elemento principal.

---

## Acceptance Criteria

### AC1 — Imagem a cores, sem filtros destrutivos
- [ ] A imagem do card **não tem** `grayscale`, `mix-blend-luminosity` nem `opacity` baixa
- [ ] No hover, um leve scale (1.04–1.06) na imagem é suficiente para feedback — sem mudar cor
- [ ] Cursos bloqueados (`locked` / `drip`) usam **apenas um overlay escuro semitransparente** sobre a imagem, sem grayscale no elemento `<img>`

### AC2 — Proporção portrait nos cards
- [ ] Mobile: card com `aspect-ratio: 2/3` (mais alto que largo) — ex: largura ~160px, altura ~240px
- [ ] Desktop: grid de 3–4 colunas com os mesmos cards portrait (sem mudar para landscape)
- [ ] O título e as informações do curso ficam **sobrepostos na parte inferior da imagem** com um gradiente escuro (`from-black/80 to-transparent`)
- [ ] Não há uma área de fundo separada abaixo da imagem para o texto

### AC3 — Badge e ícone de cadeado
- [ ] Badge de status (`EntitlementBadge`) permanece no canto superior do card
- [ ] Ícone de cadeado centralizado permanece para cursos `locked` / `drip`
- [ ] Ambos ficam **sobre a imagem**, não fora dela

### AC4 — Skeleton atualizado
- [ ] O `CourseCardSkeleton` usa a mesma proporção portrait do card real
- [ ] Sem área de content abaixo — apenas o retângulo portrait com shimmer

### AC5 — Sem regressão
- [ ] O hero "Continuar aprendendo" **não é afetado** (layout diferente, mantém o estilo atual)
- [ ] As seções "Jornada do Consultor" e "Materiais" não são alteradas

---

## Especificação Técnica

### Arquivo a modificar
`frontend/src/pages/member/FormacaoPage.tsx`

### Remover das classes da `<img>` no card
```
grayscale
mix-blend-luminosity
opacity-40
```

### Remover o gradiente branco/fundo
```tsx
// REMOVER esta div:
<div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-secondary)] via-[var(--color-bg-secondary)]/10 to-transparent opacity-95" />
```

### Novo layout do card — portrait com texto sobreporto

```tsx
// Container do card: portrait, sem área de texto separada
<Link
  className={cn(
    'relative block rounded-[16px] overflow-hidden',
    'aspect-[2/3]',   // portrait
    ...
  )}
>
  {/* Imagem full-bleed */}
  <img className="absolute inset-0 w-full h-full object-cover
    motion-safe:group-hover:scale-[1.05] transition-transform duration-500 ease-out" />

  {/* Gradiente escuro apenas no rodapé para legibilidade do texto */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

  {/* Overlay para bloqueados — substituir grayscale */}
  {(locked || drip) && (
    <div className="absolute inset-0 bg-black/50" />
  )}

  {/* Badge no topo */}
  <div className="absolute top-3 right-3 z-10"> ... </div>

  {/* Cadeado centralizado */}
  {(locked || drip) && (
    <div className="absolute inset-0 flex items-center justify-center z-10"> ... </div>
  )}

  {/* Texto sobreposto no rodapé */}
  <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
    <h3 className="text-[14px] font-semibold leading-tight text-white line-clamp-2 mb-1">
      {course.title}
    </h3>
    <p className="text-[11px] text-white/60">{course.lessons} aulas</p>
  </div>
</Link>
```

### Scroll horizontal mobile ajustado
```tsx
// Mobile: cards mais estreitos e portrait
className="w-[45vw] sm:w-auto shrink-0 snap-center sm:snap-align-none"
// (era "w-[85vw]" — muito largo para portrait)
```

### Grid desktop
```tsx
// Manter grid, mas pode aumentar para 4 colunas em telas grandes
className="flex sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 ..."
```

### Skeleton atualizado
```tsx
function CourseCardSkeleton() {
  return (
    <div className="w-[45vw] sm:w-auto shrink-0">
      <div className="aspect-[2/3] rounded-[16px] animate-pulse bg-[var(--color-bg-secondary)]" />
    </div>
  );
}
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `frontend/src/pages/member/FormacaoPage.tsx` | Refatorar cards de curso e skeleton |

---

## Fora do Escopo

- Hero "Continuar aprendendo" (manter como está)
- Seções Jornada e Materiais
- `CoursePage.tsx` e `LessonPage.tsx`

---

## Critérios de Qualidade (DoD)

- [ ] Cards exibem imagem a cores no mobile e desktop
- [ ] Proporção portrait (`aspect-[2/3]`) visível em mobile e desktop
- [ ] Cards bloqueados exibem overlay escuro semitransparente (não grayscale)
- [ ] Sem regressão visual nas outras seções da página
- [ ] `npm run type-check` sem erros

---

---

## Dev Agent Record

**Agent Model Used:** claude-sonnet-4-6
**Completion Notes:** 3 edições em 1 arquivo. Hero, Jornada e Materiais intocados.

### File List
| Arquivo | Ação |
|---------|------|
| `frontend/src/pages/member/FormacaoPage.tsx` | Modificado |

### Change Log
- 2026-03-11: Implementação por @dev (Dex)

*Story 3.2 criada por @sm (River) — 2026-03-11*
