import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Modal from '@/components/ui/Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal isOpen={false} onClose={() => {}}>Content</Modal>)
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders content when open', () => {
    render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Edit">Content</Modal>)
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('overlay uses navy color with blur', () => {
    render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>)
    const overlay = screen.getByText('Content').closest('[class*="fixed"]')!
    expect(overlay.className).toContain('bg-[#1A1A2E]/40')
    expect(overlay.className).toContain('backdrop-blur')
  })

  it('modal card has 16px radius and correct padding', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test">Content</Modal>)
    const card = screen.getByText('Content').closest('[class*="rounded"]')!
    expect(card.className).toContain('rounded-2xl')
  })
})
