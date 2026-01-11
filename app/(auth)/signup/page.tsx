'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            fullName: fullName, // Also set as fullName for compatibility
          },
        },
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      if (authData.user) {
        // The trigger handle_new_user() will automatically create:
        // 1. An organization
        // 2. A collaborator linked to the organization and user
        // No manual insertion needed - the database trigger handles everything
        
        // Give the trigger a moment to execute
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Check if email confirmation is required
        if (authData.user.email_confirmed_at) {
          // Email already confirmed, redirect to dashboard
          router.push('/dashboard')
          router.refresh()
        } else {
          // Email confirmation required - show confirmation message
          router.push(`/signup/confirm-email?email=${encodeURIComponent(email)}`)
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      // Check if it's a Supabase error with more details
      if (error.message) {
        setError(error.message)
      } else if (error.error_description) {
        setError(error.error_description)
      } else {
        setError('An error occurred during signup. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Get started with Nexus today
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              id="fullName"
              name="fullName"
              type="text"
              label="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

