'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  label: string
  value: string
}

interface ComboboxProps {
  label?: string
  options: Option[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

export default function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  error
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const selected = options.find(opt => opt.value === value)
      if (selected) {
        setQuery(selected.label)
      }
    } else {
      setQuery('')
    }
  }, [value, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        const selected = options.find(opt => opt.value === value)
        setQuery(selected ? selected.label : '')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value, options])

  const filteredOptions = query === ''
    ? options
    : options.filter(opt =>
        opt.label.toLowerCase().includes(query.toLowerCase())
      )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
    if (e.target.value === '') {
      onChange('')
    }
  }

  const handleSelect = (option: Option) => {
    onChange(option.value)
    setQuery(option.label)
    setIsOpen(false)
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[#1A1A2E] mb-1">
          {label}
        </label>
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
            ${disabled ? 'bg-[#F7F7F8] cursor-not-allowed' : 'bg-white'}
          `}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />

        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-[var(--shadow-dropdown)] max-h-60 overflow-auto border border-[#E4E4E8] p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[#9898A3]">No results found</div>
            ) : (
              <ul>
                {filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    className={`
                      px-3 py-2.5 text-sm cursor-pointer rounded-lg
                      ${option.value === value
                        ? 'bg-[#F7F7F8] text-[#1A1A2E] font-medium'
                        : 'text-[#1A1A2E] hover:bg-[#F7F7F8]'
                      }
                    `}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
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
