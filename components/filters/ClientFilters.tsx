'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

export default function ClientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [country, setCountry] = useState(searchParams.get('country') || '')

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (country) params.set('country', country)
    router.push(`/dashboard/clients?${params.toString()}`)
  }

  const handleClear = () => {
    setStatus('')
    setCountry('')
    router.push('/dashboard/clients')
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Input
          label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Filter by country"
        />
        {/* Tag filter omitted for simplicity in this iteration */}
        <div className="md:col-span-2 flex items-end gap-2">
          <Button onClick={handleFilter} className="w-full">Filter</Button>
          <Button variant="outline" onClick={handleClear} className="w-full">Clear</Button>
        </div>
      </div>
    </div>
  )
}
