'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EndContractModal from './EndContractModal'
import RenewContractModal from './RenewContractModal'
import { Contract } from '@/types/database'
import { 
  ChevronDownIcon,
  ArrowPathIcon,
  XCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

interface ContractActionsMenuProps {
  contract: Contract
  canWrite: boolean
  onModifyClick: () => void
}

export default function ContractActionsMenu({
  contract,
  canWrite,
  onModifyClick,
}: ContractActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEndModalOpen, setIsEndModalOpen] = useState(false)
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)
  const router = useRouter()

  if (!canWrite) return null

  const isActive = contract.status === 'ACTIVE'
  const isEnded = contract.status === 'ENDED'

  const actions = [
    {
      label: 'Modify Contract',
      icon: PencilIcon,
      onClick: () => {
        onModifyClick()
        setIsMenuOpen(false)
      },
      enabled: isActive,
    },
    {
      label: 'Renew Contract',
      icon: ArrowPathIcon,
      onClick: () => {
        setIsRenewModalOpen(true)
        setIsMenuOpen(false)
      },
      enabled: isActive,
    },
    {
      label: 'End Contract',
      icon: XCircleIcon,
      onClick: () => {
        setIsEndModalOpen(true)
        setIsMenuOpen(false)
      },
      enabled: isActive,
      variant: 'danger' as const,
    },
  ].filter(action => action.enabled)

  if (actions.length === 0) return null

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2"
        >
          Actions
          <ChevronDownIcon className="w-4 h-4" />
        </Button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                {actions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 ${
                        action.variant === 'danger' ? 'text-red-600' : 'text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {isEndModalOpen && (
        <EndContractModal
          contractId={contract.id}
          contractName={contract.name}
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
        />
      )}

      {isRenewModalOpen && (
        <RenewContractModal
          contract={contract}
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
        />
      )}
    </>
  )
}
