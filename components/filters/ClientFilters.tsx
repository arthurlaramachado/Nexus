'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { Country } from 'country-state-city'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Combobox from '@/components/ui/Combobox'

function ClientFiltersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [country, setCountry] = useState(searchParams.get('country') || '')
  const [countries, setCountries] = useState<any[]>([])

  useEffect(() => {
    setCountries(Country.getAllCountries())
  }, [])

  const countryOptions = useMemo(() => 
    countries.map(c => ({ label: c.name, value: c.name })),
    [countries]
  )

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
        
        <Combobox
          label="Country"
          value={country}
          onChange={setCountry}
          options={countryOptions}
          placeholder="Filter by country..."
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

export default function ClientFilters() {
  return (
    <Suspense fallback={<div className="bg-white p-4 rounded-lg shadow border border-gray-200">Loading filters...</div>}>
      <ClientFiltersContent />
    </Suspense>
  )
}
