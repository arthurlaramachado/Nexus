import { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E4E4E8] bg-white">
      <table className={`min-w-full divide-y divide-[#E4E4E8] ${className}`}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-[#F7F7F8]">{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white divide-y divide-[#F0F0F2]">{children}</tbody>
}

export function TableRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`hover:bg-[#F7F7F8] transition-colors ${className}`}>{children}</tr>
}

interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
}

export function TableHeader({ children, className = '', ...props }: TableHeaderProps) {
  return (
    <th
      className={`px-4 py-2.5 text-left text-xs font-medium text-[#6B6B78] tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
}

export function TableCell({ children, className = '', ...props }: TableCellProps) {
  return (
    <td
      className={`px-4 py-3 whitespace-nowrap text-sm text-[#1A1A2E] ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}
