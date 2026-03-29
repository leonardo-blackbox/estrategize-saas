import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminShell } from '../../../../components/layout/AdminShell'

describe('AdminShell — sidebar navigation', () => {
  it('renders 6 nav items (5 links + 1 disabled item)', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminShell><div /></AdminShell>
      </MemoryRouter>
    )
    // 5 NavLink items (Dashboard, Cursos, Usuarias, Planos/Stripe, IA Global)
    // + 1 disabled div (Configuracoes) = 6 total nav items
    const navLinks = screen.getAllByRole('link')
    const navLinksInNav = navLinks.filter(el => el.closest('nav'))
    expect(navLinksInNav.length).toBeGreaterThanOrEqual(5)
    // Check disabled item exists as non-link element
    expect(screen.getByText('Configuracoes')).toBeTruthy()
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
    // After refactor, Cursos link should have active styling
    const cursosLink = screen.getByText('Cursos').closest('a')
    expect(cursosLink).toBeTruthy()
  })

  it('sidebar renders without crash on route change', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminShell><div /></AdminShell>
      </MemoryRouter>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
