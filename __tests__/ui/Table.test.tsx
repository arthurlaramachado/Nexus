import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'

describe('Table', () => {
  function renderTable() {
    return render(
      <Table>
        <TableHead>
          <tr>
            <TableHeader>Name</TableHeader>
          </tr>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>John</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  it('renders table content', () => {
    renderTable()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  describe('container', () => {
    it('has 12px border radius', () => {
      renderTable()
      const container = screen.getByRole('table').closest('div')!
      expect(container.className).toContain('rounded-xl')
    })

    it('has border color #E4E4E8', () => {
      renderTable()
      const container = screen.getByRole('table').closest('div')!
      expect(container.className).toContain('border-[#E4E4E8]')
    })
  })

  describe('header', () => {
    it('has gray background #F7F7F8', () => {
      renderTable()
      const thead = screen.getByRole('table').querySelector('thead')!
      expect(thead.className).toContain('bg-[#F7F7F8]')
    })

    it('header cells use 12px, weight 500, gray text', () => {
      renderTable()
      const th = screen.getByText('Name')
      expect(th.className).toContain('text-xs')
      expect(th.className).toContain('font-medium')
      expect(th.className).toContain('text-[#6B6B78]')
    })
  })

  describe('rows', () => {
    it('hover shows #F7F7F8 background', () => {
      renderTable()
      const row = screen.getByText('John').closest('tr')!
      expect(row.className).toContain('hover:bg-[#F7F7F8]')
    })

    it('body rows separated by subtle border', () => {
      renderTable()
      const tbody = screen.getByRole('table').querySelector('tbody')!
      expect(tbody.className).toContain('divide-[#F0F0F2]')
    })
  })
})
