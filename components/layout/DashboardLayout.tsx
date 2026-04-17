import { ReactNode } from 'react'
import Link from 'next/link'
import SignOutButton from '@/components/auth/SignOutButton'
import { getUserCollaborator } from '@/lib/auth/helpers'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const collaborator = await getUserCollaborator()

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <nav className="bg-white shadow-[var(--shadow-card)] border-b border-[#E4E4E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-[#1A1A2E]">
                  Nexus
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-transparent text-[#6B6B78] hover:border-[#CBCBD1] hover:text-[#1A1A2E] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/clients"
                  className="border-transparent text-[#6B6B78] hover:border-[#CBCBD1] hover:text-[#1A1A2E] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Clients
                </Link>
                <Link
                  href="/dashboard/contracts"
                  className="border-transparent text-[#6B6B78] hover:border-[#CBCBD1] hover:text-[#1A1A2E] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Contracts
                </Link>
                <Link
                  href="/dashboard/collaborators"
                  className="border-transparent text-[#6B6B78] hover:border-[#CBCBD1] hover:text-[#1A1A2E] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Collaborators
                </Link>
                <Link
                  href="/dashboard/roles"
                  className="border-transparent text-[#6B6B78] hover:border-[#CBCBD1] hover:text-[#1A1A2E] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Roles
                </Link>
                <Link
                  href="/dashboard/audit-logs"
                  className="border-transparent text-[#6B6B78] hover:border-[#CBCBD1] hover:text-[#1A1A2E] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Audit Logs
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-[#3A3A47] mr-4">
                {collaborator?.full_name || 'User'} ({collaborator?.roles?.name || 'N/A'})
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
