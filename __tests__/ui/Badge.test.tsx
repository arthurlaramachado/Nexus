import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  describe('status variants per design.json', () => {
    it('renders active variant with green bg and dot', () => {
      render(<Badge variant="active">Active</Badge>)
      const badge = screen.getByText('Active').closest('span')!
      expect(badge.className).toContain('bg-[#DCFCE7]')
      expect(badge.className).toContain('text-[#15803D]')
      // Should have a dot indicator
      expect(badge.querySelector('[data-dot]')).toBeTruthy()
    })

    it('renders nearExpire variant with yellow bg', () => {
      render(<Badge variant="nearExpire">Expiring</Badge>)
      const badge = screen.getByText('Expiring').closest('span')!
      expect(badge.className).toContain('bg-[#FEF9C3]')
      expect(badge.className).toContain('text-[#854D0E]')
    })

    it('renders expired variant with red bg', () => {
      render(<Badge variant="expired">Expired</Badge>)
      const badge = screen.getByText('Expired').closest('span')!
      expect(badge.className).toContain('bg-[#FEE2E2]')
      expect(badge.className).toContain('text-[#991B1B]')
    })

    it('renders draft variant with indigo bg', () => {
      render(<Badge variant="draft">Draft</Badge>)
      const badge = screen.getByText('Draft').closest('span')!
      expect(badge.className).toContain('bg-[#E0E7FF]')
      expect(badge.className).toContain('text-[#3730A3]')
    })

    it('renders ended variant with gray bg', () => {
      render(<Badge variant="ended">Ended</Badge>)
      const badge = screen.getByText('Ended').closest('span')!
      expect(badge.className).toContain('bg-[#F1F1F4]')
      expect(badge.className).toContain('text-[#6B6B78]')
    })

    it('renders inactive variant', () => {
      render(<Badge variant="inactive">Inactive</Badge>)
      const badge = screen.getByText('Inactive').closest('span')!
      expect(badge.className).toContain('bg-[#F1F1F4]')
      expect(badge.className).toContain('text-[#9898A3]')
    })
  })

  describe('semantic variants (backward compat)', () => {
    it('renders success variant', () => {
      render(<Badge variant="success">OK</Badge>)
      const badge = screen.getByText('OK').closest('span')!
      expect(badge.className).toContain('bg-[#DCFCE7]')
    })

    it('renders danger variant', () => {
      render(<Badge variant="danger">Error</Badge>)
      const badge = screen.getByText('Error').closest('span')!
      expect(badge.className).toContain('bg-[#FEE2E2]')
    })

    it('renders info variant', () => {
      render(<Badge variant="info">Info</Badge>)
      const badge = screen.getByText('Info').closest('span')!
      expect(badge.className).toContain('bg-[#DBEAFE]')
    })
  })

  describe('styling', () => {
    it('uses pill border radius (rounded-full)', () => {
      render(<Badge>Test</Badge>)
      const badge = screen.getByText('Test').closest('span')!
      expect(badge.className).toContain('rounded-full')
    })

    it('uses 12px font weight 500', () => {
      render(<Badge>Test</Badge>)
      const badge = screen.getByText('Test').closest('span')!
      expect(badge.className).toContain('text-xs')
      expect(badge.className).toContain('font-medium')
    })

    it('has no border (design.json badges are borderless)', () => {
      render(<Badge>Test</Badge>)
      const badge = screen.getByText('Test').closest('span')!
      expect(badge.className).not.toContain('border-')
    })
  })
})
