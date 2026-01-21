'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { completeSignup, validateInviteToken } from '@/lib/invites/actions'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Logo from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  const [step, setStep] = useState<'validating' | 'form' | 'error'>('validating')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!token) {
      setStep('error')
      setError('Missing invite token')
      return
    }

    validateInviteToken(token)
      .then((res) => {
        if (res.valid) {
          setStep('form')
        } else {
          setStep('error')
          setError(res.error || 'Invalid invite')
        }
      })
      .catch((err) => {
        setStep('error')
        setError('Failed to validate invite')
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      // 1. Create account via Server Action
      const result = await completeSignup(token, fullName, password)

      // 2. Login immediately and redirect using window.location to avoid cookie issues
      if (result.success && result.email) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: result.email,
            password: password
        })

        if (!loginError) {
             // Use window.location instead of router.push to avoid cookie size issues
             window.location.href = '/dashboard'
             return
        }
      }
      
      // If login fails, redirect to login page
      window.location.href = '/login?message=Account created successfully. Please login.'
    } catch (err: any) {
      setError(err.message || 'Failed to complete signup')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Validating invite...</div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Invalid Invite</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Logo className="h-12 w-auto" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up your details to join the team
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <Input
                label="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="mb-4">
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div>
              <Input
                label="Confirm Password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full flex justify-center py-2 px-4"
              disabled={loading}
            >
              {loading ? 'Setting up account...' : 'Complete Setup'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Logo className="h-12 w-auto mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <JoinForm />
    </Suspense>
  )
}
