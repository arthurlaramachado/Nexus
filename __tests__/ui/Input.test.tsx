import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Input from '@/components/ui/Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" id="email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('uses 1px border (not border-2)', () => {
    render(<Input label="Name" id="name" />)
    const input = screen.getByLabelText('Name')
    expect(input.className).toContain('border')
    expect(input.className).not.toContain('border-2')
  })

  it('uses 8px border radius', () => {
    render(<Input label="Name" id="name" />)
    const input = screen.getByLabelText('Name')
    expect(input.className).toContain('rounded-lg')
  })

  it('has correct border color #E4E4E8', () => {
    render(<Input label="Name" id="name" />)
    const input = screen.getByLabelText('Name')
    expect(input.className).toContain('border-[#E4E4E8]')
  })

  it('shows error state', () => {
    render(<Input label="Email" id="email" error="Required" />)
    expect(screen.getByText('Required')).toBeInTheDocument()
  })
})
