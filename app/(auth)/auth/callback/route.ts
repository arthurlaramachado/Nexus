import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  const supabase = await createClient()

  if (code) {
    // Exchange code for session (OAuth flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successfully authenticated, redirect to dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  } else if (token_hash && type) {
    // Email confirmation flow
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })
    
    if (!error) {
      // Email confirmed, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }
  }

  // If there's an error or no valid parameters, redirect to login
  return NextResponse.redirect(new URL('/login?error=invalid_token', requestUrl.origin))
}

