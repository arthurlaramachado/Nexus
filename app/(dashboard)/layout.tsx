import MainLayout from '@/components/layout/MainLayout'
import { requireAuth } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export default async function Layout({ children }: { children: React.ReactNode }) {
  try {
    await requireAuth()
  } catch {
    redirect('/login')
  }

  return <MainLayout>{children}</MainLayout>
}

