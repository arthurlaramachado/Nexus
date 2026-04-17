import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`block w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-1 ${
          error
            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500'
            : 'border-[#E4E4E8] bg-white hover:border-[#CBCBD1] focus:border-[#9898A3] focus:ring-[#9898A3]'
        } ${className}`}
        placeholder={props.placeholder}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  )
}
