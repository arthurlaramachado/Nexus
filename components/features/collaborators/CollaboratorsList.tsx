'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import Link from 'next/link'
import { PencilIcon, ClipboardIcon, ClockIcon } from '@heroicons/react/24/outline'

interface CollaboratorsListProps {
  initialCollaborators: any[]
  canWrite: boolean
}

export default function CollaboratorsList({ initialCollaborators, canWrite }: CollaboratorsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'active')

  const activeCollaborators = initialCollaborators.filter((c: any) => c.status === 'active')
  const pendingCollaborators = initialCollaborators.filter((c: any) => c.status === 'invited')

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/dashboard/collaborators?${params.toString()}`)
  }

  const getInviteUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/join?token=${token}`
  }

  const copyInviteLink = async (token: string) => {
    const url = getInviteUrl(token)
    await navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  const getTimeRemaining = (expiresAt: string) => {
    const expires = new Date(expiresAt)
    const now = new Date()
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const minutes = Math.floor(diff / 60000)
    return `${minutes} min`
  }

  const tabs = [
    { id: 'active', label: 'Active', count: activeCollaborators.length },
    { id: 'pending', label: 'Pending', count: pendingCollaborators.length },
  ]

  return (
    <div>
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === 'active' ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeCollaborators.length > 0 ? (
                activeCollaborators.map((collaborator: any) => (
                  <TableRow key={collaborator.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/collaborators/${collaborator.id}`}
                        className="text-[#3B82F6] hover:text-[#2563EB] font-medium"
                      >
                        {collaborator.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{collaborator.email}</TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {collaborator.roles?.name || 'No Role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="active">Active</Badge>
                    </TableCell>
                    <TableCell>
                      {canWrite && (
                        <Link href={`/dashboard/collaborators/${collaborator.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#9898A3] py-8">
                    No active collaborators found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Time Remaining</TableHeader>
                <TableHeader>Invite Link</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingCollaborators.length > 0 ? (
                pendingCollaborators.map((collaborator: any) => {
                  const isExpired = new Date(collaborator.expires_at) < new Date()
                  return (
                    <TableRow key={collaborator.id}>
                      <TableCell className="font-medium">{collaborator.email}</TableCell>
                      <TableCell>
                        <Badge variant="info">
                          {collaborator.roles?.name || 'No Role'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <ClockIcon className="w-4 h-4 text-[#9898A3]" />
                          <span className={isExpired ? 'text-[#991B1B]' : 'text-[#6B6B78]'}>
                            {getTimeRemaining(collaborator.expires_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!isExpired && canWrite ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1.5"
                              onClick={() => copyInviteLink(collaborator.invite_token)}
                              title="Copy invite link"
                            >
                              <ClipboardIcon className="w-3.5 h-3.5" />
                              <span className="ml-1 text-xs">Copy link</span>
                            </Button>
                          </div>
                        ) : isExpired ? (
                          <span className="text-[#9898A3] text-sm italic">Link expired</span>
                        ) : (
                          <span className="text-[#9898A3] text-sm">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[#9898A3] py-8">
                    No pending invites
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Tabs>
    </div>
  )
}
