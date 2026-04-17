import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from '@/components/ui/Logo'

describe('Logo', () => {
  it('renders the Nexus text', () => {
    render(<Logo />)
    expect(screen.getByText('Nexus')).toBeInTheDocument()
  })

  it('supports dark variant for sidebar with white text', () => {
    render(<Logo variant="dark" />)
    const logo = screen.getByText('Nexus')
    expect(logo.className).toContain('text-white')
  })

  it('supports light variant with navy text', () => {
    render(<Logo variant="light" />)
    const logo = screen.getByText('Nexus')
    expect(logo.className).toContain('text-[#1A1A2E]')
  })

  it('defaults to dark variant', () => {
    render(<Logo />)
    const logo = screen.getByText('Nexus')
    expect(logo.className).toContain('text-white')
  })

  it('renders at correct size (lg = text-xl, 700 weight)', () => {
    render(<Logo size="lg" />)
    const container = screen.getByText('Nexus').closest('div')
    expect(container?.className).toContain('text-xl')
  })
})
