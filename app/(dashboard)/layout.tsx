import MainLayout from '@/components/layout/MainLayout'
import QueryProvider from '@/components/providers/QueryProvider'
import { requireAuth } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export default async function Layout({ children }: { children: React.ReactNode }) {
  try {
    await requireAuth()
  } catch {
    redirect('/login')
  }

  return (
    <QueryProvider>
      <MainLayout>{children}</MainLayout>
    </QueryProvider>
  )
}

