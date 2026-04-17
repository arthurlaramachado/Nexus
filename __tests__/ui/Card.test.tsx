import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('has white bg, 12px radius, correct border', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstElementChild!
    expect(card.className).toContain('bg-white')
    expect(card.className).toContain('rounded-xl')
    expect(card.className).toContain('border-[#E4E4E8]')
  })

  it('renders title in header when provided', () => {
    render(<Card title="Settings">Content</Card>)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders headerAction alongside title', () => {
    render(<Card title="Users" headerAction={<button>Add</button>}>Content</Card>)
    expect(screen.getByText('Add')).toBeInTheDocument()
  })
})
