'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function ServiceFiltersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    router.push(`/dashboard/services?${params.toString()}`)
  }

  const handleClear = () => {
    setSearch('')
    router.push('/dashboard/services')
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-[#E4E4E8]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Service Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
        />

        <div className="flex items-end gap-2">
          <Button onClick={handleFilter} className="w-full">Filter</Button>
          <Button variant="outline" onClick={handleClear} className="w-full">Clear</Button>
        </div>
      </div>
    </div>
  )
}

export default function ServiceFilters() {
  return (
    <Suspense fallback={<div className="bg-white p-4 rounded-lg shadow border border-[#E4E4E8]">Loading filters...</div>}>
      <ServiceFiltersContent />
    </Suspense>
  )
}
