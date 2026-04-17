'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useMemo, Suspense } from 'react'
import Select from '@/components/ui/Select'
import Combobox from '@/components/ui/Combobox'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface ContractFiltersProps {
  clients: Array<{ id: string; name: string }>
}

function ContractFiltersContent({ clients }: ContractFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [clientId, setClientId] = useState(searchParams.get('client_id') || '')
  const [terminationReason, setTerminationReason] = useState(searchParams.get('termination_reason') || '')
  const [startDateFrom, setStartDateFrom] = useState(searchParams.get('start_date_from') || '')
  const [startDateTo, setStartDateTo] = useState(searchParams.get('start_date_to') || '')

  const clientOptions = useMemo(() =>
    clients.map(c => ({ label: c.name, value: c.id })),
    [clients]
  )

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (clientId) params.set('client_id', clientId)
    if (terminationReason) params.set('termination_reason', terminationReason)
    if (startDateFrom) params.set('start_date_from', startDateFrom)
    if (startDateTo) params.set('start_date_to', startDateTo)
    router.push(`/dashboard/contracts?${params.toString()}`)
  }

  const handleClear = () => {
    setSearch('')
    setStatus('')
    setClientId('')
    setTerminationReason('')
    setStartDateFrom('')
    setStartDateTo('')
    router.push('/dashboard/contracts')
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-[#E4E4E8]">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Input
          label="Contract Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
        />

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="ENDED">Ended</option>
        </Select>

        <Combobox
          label="Client"
          value={clientId}
          onChange={setClientId}
          options={clientOptions}
          placeholder="Filter by client..."
        />

        <Select
          label="Termination Reason"
          value={terminationReason}
          onChange={(e) => setTerminationReason(e.target.value)}
        >
          <option value="">All</option>
          <option value="NOT_RENEWED">Not Renewed</option>
          <option value="CHURN">Churn</option>
          <option value="CUT">Cut</option>
          <option value="RENEWED">Renewed</option>
        </Select>

        <Input
          label="Start Date (from)"
          type="date"
          value={startDateFrom}
          onChange={(e) => setStartDateFrom(e.target.value)}
        />

        <Input
          label="Start Date (to)"
          type="date"
          value={startDateTo}
          onChange={(e) => setStartDateTo(e.target.value)}
        />

        <div className="flex items-end gap-2">
          <Button onClick={handleFilter} className="w-full">Filter</Button>
          <Button variant="outline" onClick={handleClear} className="w-full">Clear</Button>
        </div>
      </div>
    </div>
  )
}

export default function ContractFilters(props: ContractFiltersProps) {
  return (
    <Suspense fallback={<div className="bg-white p-4 rounded-lg shadow border border-[#E4E4E8]">Loading filters...</div>}>
      <ContractFiltersContent {...props} />
    </Suspense>
  )
}
