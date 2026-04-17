import React from 'react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  onChange?: (checked: boolean) => void
}

export default function Checkbox({
  label,
  error,
  onChange,
  className = '',
  ...props
}: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked)
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-[#E4E4E8] text-[#1A1A2E] focus:ring-[#1A1A2E] cursor-pointer"
          onChange={handleChange}
          {...props}
        />
        {label && (
          <span className="text-sm font-medium text-[#3A3A47] group-hover:text-[#1A1A2E]">
            {label}
          </span>
        )}
      </label>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
