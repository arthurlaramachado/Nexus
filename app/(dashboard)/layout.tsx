import MainLayout from '@/components/layout/MainLayout'
import QueryProvider from '@/components/providers/QueryProvider'
import { getUser, getUserCollaborator } from '@/lib/auth/helpers'
import { getFilteredNavigation } from '@/lib/navigation'
import { redirect } from 'next/navigation'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const [collaborator, navItems] = await Promise.all([
    getUserCollaborator(),
    getFilteredNavigation(),
  ])

  return (
    <QueryProvider>
      <MainLayout collaborator={collaborator} navItems={navItems}>
        {children}
      </MainLayout>
    </QueryProvider>
  )
}

