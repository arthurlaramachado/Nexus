import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from '@/components/ui/Button'

describe('Button', () => {
  describe('variants', () => {
    it('renders primary variant with navy background classes', () => {
      render(<Button variant="primary">Click</Button>)
      const btn = screen.getByRole('button', { name: 'Click' })
      expect(btn.className).toContain('bg-[#1A1A2E]')
      expect(btn.className).toContain('text-white')
    })

    it('renders secondary variant with white bg and border', () => {
      render(<Button variant="secondary">Click</Button>)
      const btn = screen.getByRole('button', { name: 'Click' })
      expect(btn.className).toContain('bg-white')
      expect(btn.className).toContain('border')
    })

    it('renders ghost variant with transparent bg', () => {
      render(<Button variant="ghost">Click</Button>)
      const btn = screen.getByRole('button', { name: 'Click' })
      expect(btn.className).toContain('bg-transparent')
    })

    it('renders danger variant with red styling', () => {
      render(<Button variant="danger">Click</Button>)
      const btn = screen.getByRole('button', { name: 'Click' })
      expect(btn.className).toContain('bg-[#FEE2E2]')
      expect(btn.className).toContain('text-[#991B1B]')
    })
  })

  describe('sizes', () => {
    it('renders md size by default', () => {
      render(<Button>Click</Button>)
      const btn = screen.getByRole('button', { name: 'Click' })
      expect(btn.className).toContain('px-4')
    })

    it('renders sm size', () => {
      render(<Button size="sm">Click</Button>)
      const btn = screen.getByRole('button', { name: 'Click' })
      expect(btn.className).toContain('px-3')
    })
  })

  describe('states', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Click</Button>)
      const btn = screen.getByRole('button', { name: /Click/ })
      expect(btn).toBeDisabled()
      expect(btn.querySelector('svg')).toBeTruthy()
    })

    it('is disabled when disabled prop is passed', () => {
      render(<Button disabled>Click</Button>)
      expect(screen.getByRole('button', { name: 'Click' })).toBeDisabled()
    })
  })

  describe('styling', () => {
    it('uses rounded-lg (8px border radius)', () => {
      render(<Button>Click</Button>)
      expect(screen.getByRole('button', { name: 'Click' }).className).toContain('rounded-lg')
    })

    it('uses font-medium (500 weight)', () => {
      render(<Button>Click</Button>)
      expect(screen.getByRole('button', { name: 'Click' }).className).toContain('font-medium')
    })
  })
})
