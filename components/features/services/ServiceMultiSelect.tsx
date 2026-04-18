'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useServices } from '@/hooks/useServices'

interface ServiceMultiSelectProps {
  value: string[]
  onChange: (serviceIds: string[]) => void
  label?: string
  error?: string
}

export default function ServiceMultiSelect({
  value,
  onChange,
  label = 'Services',
  error,
}: ServiceMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: services = [] } = useServices()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredServices = useMemo(() => {
    const available = services.filter(s => !value.includes(s.id))
    if (!query) return available
    return available.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [services, value, query])

  const selectedServices = useMemo(() =>
    value
      .map(id => services.find(s => s.id === id))
      .filter((s): s is { id: string; name: string } => s !== undefined),
    [services, value]
  )

  const handleSelect = (serviceId: string) => {
    onChange([...value, serviceId])
    setQuery('')
  }

  const handleRemove = (serviceId: string) => {
    onChange(value.filter(id => id !== serviceId))
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
          {label}
        </label>
      )}

      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedServices.map(service => (
            <span
              key={service.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#3B82F6] text-sm font-medium border border-[#3B82F6]/20"
            >
              {service.name}
              <button
                type="button"
                onClick={() => handleRemove(service.id)}
                className="hover:text-[#1D4ED8] transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          className={`
            w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-1
            ${error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-[#E4E4E8] focus:border-[#9898A3] focus:ring-[#9898A3]'
            }
            bg-white
          `}
          placeholder="Search services..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-[var(--shadow-dropdown)] max-h-60 overflow-auto border border-[#E4E4E8] p-1">
            {filteredServices.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#9898A3]">
                {services.length === value.length ? 'All services selected' : 'No services found'}
              </div>
            ) : (
              <ul>
                {filteredServices.map(service => (
                  <li
                    key={service.id}
                    className="px-3 py-2.5 text-sm cursor-pointer rounded-lg text-[#1A1A2E] hover:bg-[#F7F7F8]"
                    onClick={() => handleSelect(service.id)}
                  >
                    {service.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
