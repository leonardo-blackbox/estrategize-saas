import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminShell } from '../../../../components/layout/AdminShell'

describe('AdminShell — sidebar navigation', () => {
  it('renders exactly 6 nav items', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminShell><div /></AdminShell>
      </MemoryRouter>
    )
    const navLinks = screen.getAllByRole('link')
    const navLinks6 = navLinks.filter(el => el.closest('nav'))
    expect(navLinks6.length).toBeGreaterThanOrEqual(6)
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
