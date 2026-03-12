# Story 3.5 — Admin Navigation Reorganization (Sidebar com Seções Macro)

**Epic:** 3 — Admin Polish & Content Tools
**Story ID:** 3.5
**Status:** Ready for Review
**Created by:** @sm (River)
**Date:** 2026-03-11
**Branch sugerida:** `feat/3.5-admin-nav-reorganization`

---

## Contexto

O admin atualmente usa uma **top-bar plana** com 6 links (`Dashboard`, `Cursos`, `Ofertas`, `Turmas`, `Usuários`, `Stripe Logs`). À medida que a plataforma cresce (liberações, relatórios, integrações, configurações), essa navegação vai saturar e perder a hierarquia visual.

O objetivo é migrar para uma **sidebar esquerda colapsável** com **seções macro** (grupos de páginas relacionadas) e **sub-menus expansíveis**, mantendo toda a funcionalidade existente e sem quebrar nenhuma rota.

---

## Estrutura de Navegação Proposta

```
┌─ Admin Sidebar ──────────────────────────────┐
│                                               │
│  [A] Dashboard              /admin            │
│                                               │
│  [≡] Área de Membros                          │
│       ├── Cursos            /admin/cursos      │
│       ├── Usuários          /admin/usuarios    │
│       ├── Turmas            /admin/turmas      │
│       └── Liberações        /admin/liberacoes  │
│                                               │
│  [≡] Pagamentos                               │
│       ├── Ofertas           /admin/ofertas     │
│       └── Logs & Webhooks   /admin/stripe      │
│                                               │
│  [≡] Configurações  (placeholder)             │
│                                               │
│  [≡] Integrações    (placeholder)             │
│                                               │
└───────────────────────────────────────────────┘
```

> **Nota:** "Liberações" é um placeholder para futura gestão de entitlements em bulk. Pode ser exibido como link desabilitado (em breve).
> "Configurações" e "Integrações" são seções placeholder para futuras stories.

---

## Acceptance Criteria

### AC1 — Layout Sidebar (Desktop ≥ 768px)
- [ ] `AdminShell` muda de top-bar para layout de **2 colunas**: sidebar fixa à esquerda + conteúdo à direita
- [ ] Sidebar tem largura fixa de `220px` e ocupa `100dvh` (`sticky top-0`)
- [ ] Sidebar tem fundo `var(--bg-surface-1)` com borda direita `var(--border-hairline)`
- [ ] Topo da sidebar: logo/brand "Admin" igual ao atual (ícone + texto)
- [ ] Rodapé da sidebar: email do usuário + botão "Sair" + link "Voltar ao app"

### AC2 — Grupos e Sub-menus
- [ ] Cada seção macro é renderizada como um **grupo colapsável** (accordion)
- [ ] Estado de expansão persiste em `localStorage` por chave `admin_nav_expanded`
- [ ] Seção é auto-expandida se algum filho estiver ativo
- [ ] Item de grupo mostra ícone SVG + label + chevron (rotaciona 90° quando aberto)
- [ ] Sub-itens mostram apenas label, com indentação de `12px` e destaque quando ativos
- [ ] "Dashboard" é item direto (sem grupo)
- [ ] Itens placeholder (Liberações, Configurações, Integrações) são visíveis mas `pointer-events-none opacity-50` com badge "(em breve)" opcional

### AC3 — Layout Mobile (< 768px)
- [ ] Sidebar fica **oculta** por padrão no mobile
- [ ] Header topo com botão hamburger (☰) que abre sidebar como **drawer** deslizante da esquerda
- [ ] Drawer abre com animação `translateX(0)` e tem overlay semi-transparente atrás
- [ ] Clicar em link ou overlay fecha o drawer
- [ ] Comportamento de grupos idêntico ao desktop

### AC4 — Rotas preservadas
- [ ] Todas as rotas existentes (`/admin`, `/admin/cursos`, `/admin/cursos/:id`, `/admin/ofertas`, `/admin/ofertas/nova`, `/admin/turmas`, `/admin/usuarios`, `/admin/stripe`) continuam funcionando **sem alteração**
- [ ] Nenhuma rota nova é adicionada nesta story (exceto se `AdminShell` precisar de subrotas)
- [ ] `App.tsx` não precisa de alterações de rotas

### AC5 — Design System
- [ ] Sidebar usa as mesmas CSS variables do admin: `--bg-base`, `--bg-surface-1`, `--border-hairline`, `--text-primary/secondary/tertiary`, `--bg-hover`
- [ ] Animações de expand/collapse com `framer-motion` (`AnimatePresence` + `motion.div` com `height`)
- [ ] Item ativo: `bg-[var(--bg-hover)] text-[var(--text-primary)]`
- [ ] Item inativo: `text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]`
- [ ] Transições `duration-[var(--duration-fast)]`

### AC6 — Remoção da top-bar plana
- [ ] A top-bar com os 6 NavLinks inline é **removida** do `AdminShell`
- [ ] O header mobile com scroll horizontal é **removido**
- [ ] O layout muda de `flex-col` (top-bar + content) para `flex-row` (sidebar + content)

---

## Dev Notes

### Arquivo principal a modificar
- `frontend/src/components/layout/AdminShell.tsx` — reescrita completa

### Estrutura de dados da navegação

```ts
type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  disabled?: boolean;
  badge?: string;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'membros',
    label: 'Área de Membros',
    icon: <PlayCircleIcon />,
    items: [
      { to: '/admin/cursos', label: 'Cursos' },
      { to: '/admin/usuarios', label: 'Usuários' },
      { to: '/admin/turmas', label: 'Turmas' },
      { to: '/admin/liberacoes', label: 'Liberações', disabled: true, badge: 'em breve' },
    ],
  },
  {
    id: 'pagamentos',
    label: 'Pagamentos',
    icon: <CreditCardIcon />,
    items: [
      { to: '/admin/ofertas', label: 'Ofertas' },
      { to: '/admin/stripe', label: 'Logs & Webhooks' },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <SettingsIcon />,
    items: [
      { to: '/admin/configuracoes', label: 'Geral', disabled: true, badge: 'em breve' },
    ],
  },
  {
    id: 'integracoes',
    label: 'Integrações',
    icon: <PlugIcon />,
    items: [
      { to: '/admin/integracoes', label: 'Webhooks', disabled: true, badge: 'em breve' },
    ],
  },
];
```

### LocalStorage para estado de grupos

```ts
// Chave: 'admin_nav_expanded'
// Valor: string[] com ids dos grupos expandidos
// Ex: ['membros', 'pagamentos']
const [expanded, setExpanded] = useState<string[]>(() => {
  try {
    return JSON.parse(localStorage.getItem('admin_nav_expanded') ?? '["membros"]');
  } catch {
    return ['membros'];
  }
});

useEffect(() => {
  localStorage.setItem('admin_nav_expanded', JSON.stringify(expanded));
}, [expanded]);
```

### Auto-expand quando filho está ativo

```ts
// Usar useLocation() para detectar rota ativa
// Para cada grupo, checar se algum item.to está incluso na pathname atual
// Se sim, garantir que o grupo está nos expanded[]
```

### Animação de accordion (framer-motion)

```tsx
<AnimatePresence initial={false}>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      {/* sub-items */}
    </motion.div>
  )}
</AnimatePresence>
```

### Mobile Drawer

```tsx
// Estado: const [drawerOpen, setDrawerOpen] = useState(false)
// Header mobile: apenas brand + hamburger button (sem NavLinks)
// Drawer: fixed inset-y-0 left-0 z-50 w-[220px] bg-[var(--bg-surface-1)]
// Overlay: fixed inset-0 z-40 bg-black/40
// Animação: motion.div com x: drawerOpen ? 0 : -220
```

### Layout principal

```tsx
<div data-admin="true" className="min-h-[100dvh] flex bg-[var(--bg-base)]">
  {/* Sidebar — hidden on mobile, visible on md+ */}
  <aside className="hidden md:flex flex-col w-[220px] shrink-0 sticky top-0 h-[100dvh] border-r border-[var(--border-hairline)] bg-[var(--bg-surface-1)]">
    {/* ... */}
  </aside>

  {/* Main content */}
  <div className="flex-1 flex flex-col min-w-0">
    {/* Mobile header (hamburger) */}
    <header className="md:hidden sticky top-0 z-40 flex h-12 items-center px-4 glass border-b border-[var(--border-hairline)]">
      {/* hamburger + brand */}
    </header>

    {/* Page content */}
    <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6">
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </AnimatePresence>
    </main>
  </div>

  {/* Mobile drawer overlay + sidebar */}
</div>
```

---

## Tasks

- [x] **Task 1** — Redesenhar `AdminShell.tsx`
  - [x] Definir tipos `NavItem` e `NavGroup`
  - [x] Definir array `NAV_GROUPS` com todos os grupos e items
  - [x] Implementar hook de estado `expanded` com localStorage
  - [x] Implementar auto-expand via `useLocation`
  - [x] Implementar componente `NavGroupItem` (accordion)
  - [x] Implementar componente `NavSubItem` (link com destaque ativo)
  - [x] Implementar componente `AdminSidebar` (sidebar completa com brand + nav + rodapé)
  - [x] Implementar layout desktop: `flex-row` com `<AdminSidebar>` + conteúdo
  - [x] Implementar layout mobile: header com hamburger + `<AdminSidebar>` como drawer
  - [x] Drawer: overlay + animação `motion.div` com `x` transform
  - [x] Remover top-bar plana e mobile nav scroll

- [x] **Task 2** — Ícones SVG inline
  - [x] Adicionar ícones para cada grupo (Heroicons inline)
  - [x] Ícone hamburger para mobile
  - [x] Chevron para accordion (rotaciona 90° quando aberto)

- [x] **Task 3** — Validação final
  - [x] TypeScript compila sem erros (`tsc --noEmit` limpo)

---

## Dev Agent Record

### Status
Ready for Development

### Agent Model Used
claude-sonnet-4-6

### Completion Notes
- Reescrita completa de `AdminShell.tsx` — único arquivo alterado
- Sidebar desktop 220px com `sticky top-0 h-[100dvh]`
- 4 grupos colapsáveis: Área de Membros, Pagamentos, Configurações, Integrações
- Estado de expansão em `localStorage` (`admin_nav_expanded`)
- Auto-expand de grupo quando filho está ativo via `useLocation`
- Mobile: header com hamburger + drawer animado (`motion.div` com `x` transform) + overlay
- Drawer fecha ao clicar em link ou overlay
- Items placeholder com `disabled: true` — sem `pointer-events`, opacidade reduzida
- TypeScript limpo (`tsc --noEmit` sem erros)

### Debug Log
Nenhum bloqueio encontrado.

### File List
- `frontend/src/components/layout/AdminShell.tsx` (reescrita completa)

### Change Log
| Data | Alteração |
|------|-----------|
| 2026-03-11 | Story criada pelo @sm (River) |
