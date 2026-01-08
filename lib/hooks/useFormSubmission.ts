'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface UseFormSubmissionOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  redirectTo?: string
  successMessage?: string
}

export function useFormSubmission<T>(
  submitFn: (data: T) => Promise<void>,
  options: UseFormSubmissionOptions = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { addToast } = useToast()

  const submit = async (data: T) => {
    setError(null)
    setLoading(true)

    try {
      await submitFn(data)
      
      if (options.successMessage) {
        addToast(options.successMessage, 'success')
      }

      if (options.onSuccess) {
        options.onSuccess()
      }
      
      if (options.redirectTo) {
        router.push(options.redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      setError(errorMessage)
      addToast(errorMessage, 'error')
      
      if (options.onError) {
        options.onError(err)
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    submit,
    loading,
    error,
    setError,
  }
}
