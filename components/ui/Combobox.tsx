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

  // Initialize query based on selected value
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
        // Reset query to match value if closed without selection
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          className={`
            w-full rounded-md border shadow-sm px-3 py-2 text-sm outline-none focus:ring-1
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        />
        
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
            ) : (
              <ul className="py-1">
                {filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    className={`
                      px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50
                      ${option.value === value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-900'}
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


