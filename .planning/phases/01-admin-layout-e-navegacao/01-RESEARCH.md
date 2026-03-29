# Phase 1: Admin Layout e Navegacao - Research

**Researched:** 2026-03-28
**Domain:** React admin shell redesign (sidebar navigation, routing, design system)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMN-06 | Admin consegue navegar entre todas as seções em < 3 cliques | Sidebar flat (seções diretas sem accordion) garante 1 clique para qualquer seção; sub-rotas (ex: curso detail) exigem 2 cliques no máximo |
</phase_requirements>

---

## Summary

O projeto já tem um `AdminShell` funcional em `frontend/src/components/layout/AdminShell.tsx` com sidebar colapsável por grupos (accordion), drawer mobile animado com Framer Motion e tokens CSS do sistema de design. O problema é de arquitetura de navegação: as 11 páginas estão agrupadas em 4 grupos colapsáveis ("Área de Membros", "Pagamentos", "Configurações", "Integrações") o que impõe 2 cliques apenas para expandir o grupo antes de navegar — violando o critério de < 3 cliques dependendo do estado de expansão.

A solução é converter a navegação de accordion-por-grupo para **seções top-level diretas com ícones**, onde cada uma das 6 seções é acessível em 1 clique. Sub-páginas (ex: detalhe de curso, detalhe de usuária) permanecem como rotas filhas acessíveis em 2 cliques. Isso mantém o AdminShell existente como ponto de partida (reutilizando layout, drawer mobile, tokens CSS), alterando apenas a estrutura de `NAV_GROUPS` para `NAV_ITEMS` diretos.

A fase é puramente frontend — zero mudanças de backend, zero migrations. O trabalho real é: (1) refatorar a estrutura de nav do AdminShell, (2) mover as 11 páginas que ainda estão fora do padrão 3 camadas para `features/admin/`, (3) adicionar rotas faltando para `AdminFormacaoPage` na sidebar, e (4) criar a rota `/admin/ia` como placeholder para Phase 5.

**Primary recommendation:** Refatorar `NAV_GROUPS` accordion em `NAV_ITEMS` flat com 6 seções de nível único. Reutilizar 100% do layout shell existente (drawer, sticky sidebar, tokens CSS, Framer Motion).

---

## Standard Stack

### Core (já presente no projeto)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Router v6 | `^6.x` | Navegação declarativa com `<Outlet>` | Já usado; nested routes para admin shell |
| Framer Motion | já instalado | Animação do drawer mobile e page transitions | Já em uso no AdminShell e PageTransition |
| Tailwind CSS | v4 (Vite plugin) | Estilização utility-first | Stack confirmado do projeto |

### Design System Tokens (já definidos em `index.css`)
| Token | Light | Dark (admin) | Uso |
|-------|-------|-------------|-----|
| `--bg-base` | `#ffffff` | `#050505` | Background geral |
| `--bg-surface-1` | `#f5f5f7` | `#0a0a0a` | Background da sidebar |
| `--bg-hover` | `#e8e8ed` | `#2c2c2e` | Hover e item ativo |
| `--border-hairline` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.05)` | Divisores |
| `--text-primary` | `#1d1d1f` | `#e5e5e7` | Label ativo |
| `--text-secondary` | `#6e6e73` | `#a1a1a6` | Label padrão |
| `--text-tertiary` | `#86868b` | `#6e6e73` | Ícones, labels inativos |
| `--accent` | `#0f4c4d` | `#2dd4a8` | Indicador de item ativo |

O admin já força `[data-admin="true"]` no wrapper (`AdminShell.tsx` linha 333), o que garante o tema OLED dark independente do tema global do usuário.

**Sem novas instalações necessárias para esta fase.**

---

## Architecture Patterns

### Estrutura de Arquivos Resultante

```
frontend/src/
├── components/layout/
│   └── AdminShell.tsx            ← ALTERAR: substituir NAV_GROUPS accordion por NAV_ITEMS flat
├── features/admin/
│   ├── components/
│   │   ├── AdminHomePage/        ← JA EXISTE (conforme 3 camadas)
│   │   ├── AdminCursoDetailPage/ ← JA EXISTE
│   │   ├── AdminUserDetailPage/  ← JA EXISTE
│   │   ├── AdminDashboardPage/   ← MOVER de pages/ (atualmente monolítico em pages/)
│   │   ├── AdminCursosPage/      ← MOVER de pages/ (249 linhas — precisa decomposição)
│   │   ├── AdminFormacaoPage/    ← MOVER de pages/ (468 linhas — precisa decomposição)
│   │   ├── AdminOfertasPage/     ← MOVER de pages/ (364 linhas — precisa decomposição)
│   │   ├── AdminNovaOfertaPage/  ← MOVER de pages/ (96 linhas — OK ou mover)
│   │   ├── AdminTurmasPage/      ← MOVER de pages/ (452 linhas — precisa decomposição)
│   │   ├── AdminUsuariosPage/    ← MOVER de pages/ (132 linhas — OK)
│   │   ├── AdminStripePage/      ← MOVER de pages/ (253 linhas — OK ou mover)
│   │   └── AdminIAPage/          ← CRIAR placeholder para Phase 5
│   ├── hooks/
│   │   ├── useAdminHome.ts       ← JA EXISTE
│   │   ├── useAdminCursoDetail.ts← JA EXISTE
│   │   └── useAdminUserDetail.ts ← JA EXISTE
│   └── services/
│       └── admin.api.ts          ← JA EXISTE (verificar)
└── pages/admin/
    ├── AdminDashboardPage.tsx    ← VIRAR shell de 2 linhas (re-export)
    ├── AdminCursosPage.tsx       ← VIRAR shell de 2 linhas
    ├── AdminFormacaoPage.tsx     ← VIRAR shell de 2 linhas
    ├── AdminOfertasPage.tsx      ← VIRAR shell de 2 linhas
    ├── AdminNovaOfertaPage.tsx   ← VIRAR shell de 2 linhas
    ├── AdminTurmasPage.tsx       ← VIRAR shell de 2 linhas
    ├── AdminUsuariosPage.tsx     ← VIRAR shell de 2 linhas
    ├── AdminStripePage.tsx       ← VIRAR shell de 2 linhas
    ├── AdminCursoDetailPage.tsx  ← JA É 2 linhas (re-export correto)
    ├── AdminHomePage.tsx         ← JA É 2 linhas (re-export correto)
    └── AdminUserDetailPage.tsx   ← JA É 2 linhas (re-export correto)
```

### Padrão 1: NAV_ITEMS Flat (substituir accordion)

**O que:** Trocar o array `NAV_GROUPS` (accordion colapsável) por `NAV_ITEMS` com seções diretas. Cada item tem ícone, label e rota direta.

**Quando usar:** Quando há 6 ou menos seções top-level — accordion só vale para 10+ itens.

```typescript
// Source: padrão existente em AdminShell.tsx adaptado
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  disabled?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin',          label: 'Dashboard',    icon: <IconGrid />,     end: true },
  { to: '/admin/cursos',   label: 'Cursos',       icon: <IconPlay /> },
  { to: '/admin/usuarios', label: 'Usuárias',     icon: <IconUsers /> },
  { to: '/admin/planos',   label: 'Planos/Stripe', icon: <IconCreditCard /> },
  { to: '/admin/ia',       label: 'IA Global',    icon: <IconSparkles />, badge: 'em breve' },
  { to: '/admin/config',   label: 'Configurações', icon: <IconSettings />, disabled: true },
];
```

### Padrão 2: NavItem com indicador de ativo e active-match

O React Router `<NavLink>` com `className` como função já resolve ativo/inativo. Para sub-rotas (ex: `/admin/cursos/123`), usar `end={false}` (default) para que o pai fique ativo.

```typescript
// Mesmo padrão já no AdminShell.tsx — reutilizar
<NavLink
  to={item.to}
  end={item.end}
  className={({ isActive }) =>
    cn(
      'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-sm)] text-sm transition-colors',
      isActive
        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
    )
  }
>
  <span className="text-[var(--text-tertiary)]">{item.icon}</span>
  {item.label}
</NavLink>
```

### Padrão 3: Mapeamento de páginas para as 6 seções

| Seção Sidebar | Rotas Admin | Páginas existentes |
|---------------|-------------|-------------------|
| Dashboard | `/admin` | `AdminDashboardPage` |
| Cursos | `/admin/cursos`, `/admin/cursos/:id`, `/admin/formacao`, `/admin/home` | `AdminCursosPage`, `AdminCursoDetailPage`, `AdminFormacaoPage`, `AdminHomePage` |
| Usuárias | `/admin/usuarios`, `/admin/usuarios/:id` | `AdminUsuariosPage`, `AdminUserDetailPage` |
| Planos/Stripe | `/admin/planos`(novo), `/admin/ofertas`, `/admin/ofertas/nova`, `/admin/turmas`, `/admin/stripe` | `AdminOfertasPage`, `AdminNovaOfertaPage`, `AdminTurmasPage`, `AdminStripePage` |
| IA Global | `/admin/ia` (novo placeholder) | `AdminIAPage` (criar) |
| Configurações | `/admin/config` (disabled) | — |

**Nota sobre rotas de cursos:** `/admin/formacao` e `/admin/home` são sub-funções da gestão de cursos (Home da formação e configuração da seção). Elas devem ser linkadas dentro da seção "Cursos" ou como sub-nav, mas o item sidebar "Cursos" fica ativo quando qualquer uma dessas rotas está ativa.

### Anti-Padrões a Evitar

- **Accordion no lugar de flat nav:** Accordion impõe 1 clique para expandir + 1 para navegar = potencial 2 cliques antes de chegar à página. Com 6 seções flat, é sempre 1 clique.
- **Criar novo AdminShell do zero:** O shell existente tem lógica correta de drawer mobile, lock de scroll, auto-close em route change. Reutilizar e alterar apenas a estrutura de nav.
- **Páginas gordas em `src/pages/admin/`:** `AdminCursosPage.tsx` tem 249 linhas, `AdminFormacaoPage.tsx` tem 468 linhas, `AdminTurmasPage.tsx` tem 452 linhas — todos violam o limite de 20 linhas de página. Esta fase deve converter esses arquivos para thin shells (2 linhas) movendo a lógica para `features/admin/`.
- **Criar feature de "admin-nav" separada:** A nav é parte do shell (`components/layout/`), não uma feature. Features são para domínio de negócio.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Active state na nav | Lógica manual de comparação de pathname | `NavLink` com `className` como função | React Router já resolve incluindo sub-rotas |
| Drawer mobile | CSS drawer customizado | `AnimatePresence` + `motion.aside` (já existe) | Já implementado no AdminShell com scroll lock correto |
| Ícones SVG | Biblioteca de ícones externa (Lucide, Heroicons) | Inline SVGs já no padrão do AdminShell | Projeto usa inline SVGs nos componentes — consistência |
| Accordion de grupos | Re-implementar colapsável | Simplesmente não usar accordion — flat nav é melhor | Flat nav = menos cliques = atende ADMN-06 diretamente |

---

## Common Pitfalls

### Pitfall 1: `end` prop no Dashboard
**What goes wrong:** `/admin` sem `end={true}` fica sempre ativo porque todo path `/admin/*` começa com `/admin`.
**Why it happens:** `NavLink` usa `startsWith` por padrão.
**How to avoid:** Sempre passar `end={true}` para o item Dashboard (`/admin`).
**Warning signs:** Dashboard fica marcado como ativo em todas as páginas do admin.

### Pitfall 2: Sidebar ativa errada ao acessar sub-rotas de cursos
**What goes wrong:** `/admin/formacao` e `/admin/home` não trigam o item "Cursos" como ativo porque o `to` do item aponta para `/admin/cursos`.
**Why it happens:** `NavLink` match é por prefixo. `/admin/formacao` não é prefixo de `/admin/cursos`.
**How to avoid:** Usar lógica de `isActive` customizada com `useMatch` para verificar múltiplos prefixos, OU criar sub-nav para Cursos com links diretos para `/admin/formacao` e `/admin/home`.
**Warning signs:** Usuário navega para Home da Formação e nenhum item da sidebar fica ativo.

### Pitfall 3: Páginas gordas violando regra de 20 linhas
**What goes wrong:** `AdminCursosPage.tsx` (249 linhas), `AdminFormacaoPage.tsx` (468 linhas), `AdminTurmasPage.tsx` (452 linhas) — todos na pasta `pages/` violando a regra da arquitetura.
**Why it happens:** Foram implementadas antes da regra de 3 camadas estar estabelecida.
**How to avoid:** Mover toda a lógica para `features/admin/components/[NomePage]/` e converter o arquivo `pages/admin/X.tsx` para thin shell de 2 linhas (re-export).
**Warning signs:** Arquivo em `src/pages/` com mais de 20 linhas.

### Pitfall 4: Rota `/admin/planos` não existe ainda
**What goes wrong:** Sidebar tem link para `/admin/planos` mas nenhuma rota está registrada no `App.tsx`.
**Why it happens:** Planos/Stripe é Phase 2. A Phase 1 deve criar a rota como placeholder.
**How to avoid:** Adicionar rota `/admin/planos` apontando para `AdminPlaceholderPage` ou redirecionar para `/admin/ofertas` como fallback. A Phase 2 substituirá isso.
**Warning signs:** Clique em "Planos/Stripe" na sidebar leva para página 404 ou redirect catch-all.

### Pitfall 5: Drawer mobile não fecha em sub-rotas
**What goes wrong:** Drawer fecha ao navegar para `/admin/cursos` mas não ao navegar de `/admin/cursos` para `/admin/cursos/123`.
**Why it happens:** `useEffect` no AdminShell já fecha o drawer em `location.pathname` change — isso funciona DESDE que pathname mude, o que acontece normalmente.
**How to avoid:** Confirmar que a implementação existente do `useEffect([location.pathname])` cobre sub-rotas — ela cobre. Não alterar esse comportamento.

---

## Code Examples

### Thin Shell Pattern (páginas corretas)

```typescript
// Source: padrão já adotado em AdminHomePage.tsx e AdminCursoDetailPage.tsx
// frontend/src/pages/admin/AdminCursosPage.tsx (resultado final)
export { AdminCursosPage } from '../../features/admin/components/AdminCursosPage/index.ts';
```

### Placeholder para rota futura

```typescript
// frontend/src/features/admin/components/AdminIAPage/AdminIAPage.tsx
// Placeholder para Phase 5
export function AdminIAPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-3">
      <p className="text-sm font-medium text-[var(--text-primary)]">IA Global</p>
      <p className="text-xs text-[var(--text-tertiary)]">
        Esta seção estará disponível após a Phase 10 (pipeline de embeddings).
      </p>
    </div>
  );
}
```

### NavItem com match múltiplo (cursos + sub-páginas)

```typescript
// Usando useMatch para ativar "Cursos" em /admin/formacao e /admin/home também
import { useMatch } from 'react-router-dom';

function NavItemWithMultiMatch({ item }: { item: NavItemWithExtraPaths }) {
  const mainMatch = useMatch({ path: item.to, end: item.end ?? false });
  const extraMatches = item.extraPaths?.map(p => useMatch({ path: p, end: false })) ?? [];
  const isActive = !!mainMatch || extraMatches.some(Boolean);
  // ...
}
```

**Nota:** Hooks não podem ser chamados em loops. A alternativa mais simples é usar `useLocation` e checar `pathname.startsWith()` manualmente dentro do componente `NavItemComponent`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Accordion nav (NAV_GROUPS) | Flat nav (NAV_ITEMS diretos) | Phase 1 | Remove 1 clique extra para chegar em qualquer seção |
| Páginas gordas em `pages/admin/` | Thin shells em `pages/` + lógica em `features/admin/` | Phase 1 | Compliance com regra de 3 camadas |
| Sem rota de IA | Placeholder `/admin/ia` | Phase 1 | Sidebar completa desde o início; Phase 5 substitui o conteúdo |

**Deprecated/outdated:**
- `NAV_GROUPS` com accordion: não fornece navegação em < 3 cliques de forma confiável quando grupos estão colapsados
- `AdminDashboardPage` monolítico em `pages/admin/AdminDashboardPage.tsx` (131 linhas): deve virar thin shell

---

## Open Questions

1. **Sub-nav para Cursos (formacao + home)?**
   - What we know: `/admin/formacao` e `/admin/home` são páginas de gestão de cursos, mas têm paths que não são prefixo de `/admin/cursos`
   - What's unclear: A Iris quer ver links para "Home da Formação" e "Conteúdos" no item "Cursos" da sidebar, ou acessar via links dentro da página de Cursos?
   - Recommendation: Implementar flat nav com item único "Cursos" apontando para `/admin/cursos`, e dentro da `AdminCursosPage` adicionar links para Formação e Home. A sidebar não precisa de sub-nav para esta fase.

2. **Rota `/admin/planos` — redirect ou placeholder?**
   - What we know: Phase 2 implementa a página de planos; Phase 1 deve criar a rota
   - What's unclear: Redirecionar para `/admin/ofertas` (rota atual de planos/ofertas) é aceitável como fallback temporário?
   - Recommendation: Criar `AdminPlaceholderPage` genérico reutilizável com mensagem "em construção". Mais limpo que redirect.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Nenhum configurado — Wave 0 deve instalar Vitest |
| Config file | Nenhum — Wave 0 cria `vite.config.ts` com test config |
| Quick run command | `cd frontend && npm test -- --run` (após Wave 0) |
| Full suite command | `cd frontend && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMN-06 | NavLink ativo correto em `/admin` (end=true) | unit | `npm test -- --run NavItem` | Wave 0 |
| ADMN-06 | NavLink ativo em `/admin/cursos/*` | unit | `npm test -- --run AdminShell` | Wave 0 |
| ADMN-06 | Drawer fecha ao mudar rota | unit | `npm test -- --run AdminShell` | Wave 0 |
| ADMN-06 | 6 itens de navegação presentes na sidebar | unit | `npm test -- --run AdminShell` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npm run type-check`
- **Per wave merge:** `cd frontend && npm test -- --run` (após instalar Vitest)
- **Phase gate:** type-check limpo + build sem erros antes de `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/vite.config.ts` — adicionar bloco `test` com Vitest (se não existir)
- [ ] `frontend/src/features/admin/components/AdminShell.spec.tsx` — testes de nav
- [ ] Framework install: `cd frontend && npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event` — se não instalado

*(Verificar se vite.config.ts já tem configuração de test antes de instalar)*

---

## Sources

### Primary (HIGH confidence)
- Inspeção direta de `frontend/src/components/layout/AdminShell.tsx` — estrutura atual completa
- Inspeção de `frontend/src/App.tsx` — todas as 11 rotas admin mapeadas
- Inspeção de `frontend/src/index.css` — tokens CSS do design system (admin theme `[data-admin="true"]`)
- Inspeção de `frontend/src/pages/admin/*.tsx` — tamanhos e padrões das páginas existentes

### Secondary (MEDIUM confidence)
- Convenção de React Router v6 `NavLink` com `end` prop — documentação oficial (conhecimento verificado no código existente)
- Padrão 3 camadas do CLAUDE.md — regra do projeto

### Tertiary (LOW confidence)
- N/A — toda a pesquisa foi baseada em leitura direta do código fonte

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — lido diretamente do package.json e código existente
- Architecture: HIGH — AdminShell já existe; mudanças são cirúrgicas e bem delimitadas
- Pitfalls: HIGH — identificados por leitura direta do código (tamanhos de arquivo, lógica de routing)

**Research date:** 2026-03-28
**Valid until:** 2026-06-28 (stack estável; React Router v6 não tem breaking changes planejados)
