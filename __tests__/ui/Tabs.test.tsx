import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Tabs from '@/components/ui/Tabs'

describe('Tabs', () => {
  const tabs = [
    { id: 'active', label: 'Active', count: 5 },
    { id: 'pending', label: 'Pending', count: 2 },
  ]

  it('renders tab labels', () => {
    render(<Tabs tabs={tabs} activeTab="active" onTabChange={() => {}}><div>Content</div></Tabs>)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('active tab has navy background and white text', () => {
    render(<Tabs tabs={tabs} activeTab="active" onTabChange={() => {}}><div>Content</div></Tabs>)
    const activeBtn = screen.getByText('Active').closest('button')!
    expect(activeBtn.className).toContain('bg-[#1A1A2E]')
    expect(activeBtn.className).toContain('text-white')
  })

  it('inactive tab has transparent bg and gray text', () => {
    render(<Tabs tabs={tabs} activeTab="active" onTabChange={() => {}}><div>Content</div></Tabs>)
    const inactiveBtn = screen.getByText('Pending').closest('button')!
    expect(inactiveBtn.className).toContain('text-[#6B6B78]')
    expect(inactiveBtn.className).not.toContain('bg-[#1A1A2E]')
  })

  it('tabs use pill style (rounded-lg)', () => {
    render(<Tabs tabs={tabs} activeTab="active" onTabChange={() => {}}><div>Content</div></Tabs>)
    const btn = screen.getByText('Active').closest('button')!
    expect(btn.className).toContain('rounded-lg')
  })

  it('shows count badge', () => {
    render(<Tabs tabs={tabs} activeTab="active" onTabChange={() => {}}><div>Content</div></Tabs>)
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
