'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface AuditLogFiltersProps {
  users: Array<{ user_id: string; full_name: string | null }>
  tableNames: string[]
}

function AuditLogFiltersContent({ users, tableNames }: AuditLogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState(searchParams.get('user_id') || '')
  const [tableName, setTableName] = useState(searchParams.get('table_name') || '')
  const [recordId, setRecordId] = useState(searchParams.get('record_id') || '')
  const [startDate, setStartDate] = useState(searchParams.get('start_date') || '')
  const [endDate, setEndDate] = useState(searchParams.get('end_date') || '')

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (userId) params.set('user_id', userId)
    if (tableName) params.set('table_name', tableName)
    if (recordId) params.set('record_id', recordId)
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    router.push(`/dashboard/audit-logs?${params.toString()}`)
  }

  const handleClear = () => {
    setUserId('')
    setTableName('')
    setRecordId('')
    setStartDate('')
    setEndDate('')
    router.push('/dashboard/audit-logs')
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Select
          label="User"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user.user_id || user.full_name} value={user.user_id}>
              {user.full_name || user.user_id.substring(0, 8)}
            </option>
          ))}
        </Select>
        <Select
          label="Table"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        >
          <option value="">All Tables</option>
          {tableNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Input
          label="Record ID"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          placeholder="Filter by record ID"
        />
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <div className="flex items-end gap-2">
          <Button onClick={handleFilter} className="w-full">Filter</Button>
          <Button variant="outline" onClick={handleClear} className="w-full">Clear</Button>
        </div>
      </div>
    </div>
  )
}

export default function AuditLogFilters(props: AuditLogFiltersProps) {
  return (
    <Suspense fallback={<div className="bg-white p-4 rounded-lg shadow">Loading filters...</div>}>
      <AuditLogFiltersContent {...props} />
    </Suspense>
  )
}