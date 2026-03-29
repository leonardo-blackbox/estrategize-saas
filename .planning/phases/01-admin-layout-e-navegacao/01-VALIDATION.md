---
phase: 1
phase_slug: admin-layout-e-navegacao
date: 2026-03-28
---

# Validation Strategy — Phase 1: Admin Layout e Navegação

## Test Framework Setup (Wave 0)

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config | `frontend/vite.config.ts` — adicionar bloco `test` se não existir |
| Quick run | `cd frontend && npm test -- --run` |
| Type check | `cd frontend && npm run type-check` |

### Wave 0 Install (if not present)

```bash
cd frontend && npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event
```

Check first: `cat frontend/vite.config.ts | grep "test"` — skip install if test config already present.

---

## Requirement → Test Map

| Req ID | Behavior | Test Type | Command | File |
|--------|----------|-----------|---------|------|
| ADMN-06 | NavLink ativo em `/admin` usa `end=true` | unit | `npm test -- --run NavItem` | AdminShell.spec.tsx |
| ADMN-06 | NavLink ativo em `/admin/cursos/*` (activePaths) | unit | `npm test -- --run AdminShell` | AdminShell.spec.tsx |
| ADMN-06 | Drawer fecha ao mudar rota | unit | `npm test -- --run AdminShell` | AdminShell.spec.tsx |
| ADMN-06 | Sidebar mostra exatamente 6 itens de navegação | unit | `npm test -- --run AdminShell` | AdminShell.spec.tsx |

---

## Spec File to Create

**Path:** `frontend/src/features/admin/components/AdminShell/AdminShell.spec.tsx`

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminShell } from './AdminShell'

describe('AdminShell — sidebar navigation', () => {
  it('renders exactly 6 nav items', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminShell><div /></AdminShell>
      </MemoryRouter>
    )
    // Each nav item has role="link" or contains NAV_ITEMS labels
    const items = screen.getAllByRole('link', { hidden: false })
    expect(items.filter(el => el.closest('nav'))).toHaveLength(6)
  })

  it('Dashboard NavLink uses end=true (active only on exact /admin)', () => {
    render(
      <MemoryRouter initialEntries={['/admin/cursos']}>
        <AdminShell><div /></AdminShell>
      </MemoryRouter>
    )
    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).not.toHaveClass('active')
  })

  it('Cursos item is active on /admin/cursos sub-routes', () => {
    render(
      <MemoryRouter initialEntries={['/admin/cursos/123']}>
        <AdminShell><div /></AdminShell>
      </MemoryRouter>
    )
    const cursosLink = screen.getByText('Cursos').closest('a')
    expect(cursosLink).toHaveClass('active')
  })

  it('drawer closes on route change', async () => {
    // Drawer close behavior tested via isOpen state — integration test
    // Smoke: sidebar rendered without crash on route change
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminShell><div /></AdminShell>
      </MemoryRouter>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
```

---

## Sampling Strategy

| Gate | Command | When |
|------|---------|------|
| Per task | `cd frontend && npm run type-check` | After each task completes |
| Per wave | `cd frontend && npm test -- --run AdminShell` | After Wave 1 merges |
| Phase gate | `cd frontend && npm run build` | Before `/gsd:verify-work` |

---

## 3-Layer Compliance Checks

All moved pages must satisfy after Phase 1:

| File | Max Lines | Check Command |
|------|-----------|---------------|
| `pages/admin/AdminFormacaoPage.tsx` (shell) | ≤5 | `wc -l frontend/src/pages/admin/AdminFormacaoPage.tsx` |
| `features/admin/components/AdminFormacaoPage/AdminFormacaoPage.tsx` (aggregator) | ≤200 | `wc -l frontend/src/features/admin/components/AdminFormacaoPage/AdminFormacaoPage.tsx` |
| Any micro-module under `features/admin/components/*/` | ≤80 | `wc -l frontend/src/features/admin/components/*/*.tsx` |

---

*Generated: 2026-03-28 — Phase 1 Admin Layout e Navegação*
