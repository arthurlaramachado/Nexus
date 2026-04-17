import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// We'll control the pathname return value per test
let mockPathname = '/dashboard'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

// Must import AFTER mock setup
import NavItem from '@/components/layout/NavItem'

describe('NavItem', () => {
  beforeEach(() => {
    mockPathname = '/dashboard'
    cleanup()
  })

  it('renders label and icon', () => {
    render(
      <NavItem
        label="Dashboard"
        href="/dashboard"
        icon={<span data-testid="icon">icon</span>}
      />
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  describe('dark theme styling', () => {
    it('active item has white text and semi-transparent bg', () => {
      render(
        <NavItem
          label="Dashboard"
          href="/dashboard"
          icon={<span>icon</span>}
        />
      )
      const link = screen.getByText('Dashboard').closest('a')!
      expect(link.className).toContain('text-white')
      expect(link.className).toContain('bg-white/8')
    })

    it('active item has golden left border indicator', () => {
      render(
        <NavItem
          label="Dashboard"
          href="/dashboard"
          icon={<span>icon</span>}
        />
      )
      const link = screen.getByText('Dashboard').closest('a')!
      expect(link.className).toContain('border-l-[3px]')
      expect(link.className).toContain('border-[#F0C14B]')
    })

    it('inactive item has muted text', () => {
      render(
        <NavItem
          label="Clients"
          href="/dashboard/clients"
          icon={<span>icon</span>}
        />
      )
      const link = screen.getByText('Clients').closest('a')!
      expect(link.className).toContain('text-[#A8A8BB]')
    })
  })

  it('uses 8px border radius', () => {
    render(
      <NavItem
        label="Dashboard"
        href="/dashboard"
        icon={<span>icon</span>}
      />
    )
    const link = screen.getByText('Dashboard').closest('a')!
    expect(link.className).toContain('rounded-lg')
  })

  describe('Dashboard exact match fix', () => {
    it('Dashboard is NOT active when on /dashboard/clients', () => {
      mockPathname = '/dashboard/clients'

      render(
        <NavItem
          label="Dashboard"
          href="/dashboard"
          icon={<span>icon</span>}
        />
      )
      const link = screen.getByText('Dashboard').closest('a')!
      expect(link.className).toContain('text-[#A8A8BB]')
      expect(link.className).not.toContain('border-[#F0C14B]')
    })

    it('Clients IS active when on /dashboard/clients', () => {
      mockPathname = '/dashboard/clients'

      render(
        <NavItem
          label="Clients"
          href="/dashboard/clients"
          icon={<span>icon</span>}
        />
      )
      const link = screen.getByText('Clients').closest('a')!
      expect(link.className).toContain('text-white')
      expect(link.className).toContain('border-[#F0C14B]')
    })

    it('Clients IS active when on /dashboard/clients/123', () => {
      mockPathname = '/dashboard/clients/123'

      render(
        <NavItem
          label="Clients"
          href="/dashboard/clients"
          icon={<span>icon</span>}
        />
      )
      const link = screen.getByText('Clients').closest('a')!
      expect(link.className).toContain('text-white')
    })
  })
})
