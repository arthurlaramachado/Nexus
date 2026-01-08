'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          setStatus('error')
          setMessage('Erro ao verificar usuário. Por favor, tente fazer login novamente.')
          return
        }

        if (user?.email_confirmed_at) {
          setStatus('success')
          setMessage('Email confirmado com sucesso! Redirecionando...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Email ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Ocorreu um erro. Por favor, tente novamente.')
      }
    }

    checkEmailConfirmation()
    
    // Re-verificar a cada 5 segundos se ainda não foi confirmado
    const interval = setInterval(() => {
      if (status === 'error') {
        checkEmailConfirmation()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [router, supabase, status])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Confirmação de Email
          </h2>
        </div>

        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Verificando confirmação de email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-green-600 font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-red-600 mb-4">{message}</p>
            {email && (
              <p className="text-sm text-gray-600 mb-4">
                Email: <span className="font-medium">{email}</span>
              </p>
            )}
            <div className="space-y-2">
              <Link
                href="/login"
                className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Ir para Login
              </Link>
              <button
                onClick={async () => {
                  setStatus('loading')
                  try {
                    const { data: { user }, error } = await supabase.auth.getUser()
                    if (error || !user?.email_confirmed_at) {
                      setStatus('error')
                      setMessage('Email ainda não foi confirmado. Verifique sua caixa de entrada.')
                    } else {
                      setStatus('success')
                      setMessage('Email confirmado com sucesso! Redirecionando...')
                      setTimeout(() => router.push('/dashboard'), 2000)
                    }
                  } catch (err) {
                    setStatus('error')
                    setMessage('Ocorreu um erro. Por favor, tente novamente.')
                  }
                }}
                className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Verificar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

