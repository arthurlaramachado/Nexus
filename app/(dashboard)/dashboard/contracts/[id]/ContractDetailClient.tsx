'use client'

import { useRouter } from 'next/navigation'
import ContractActionsMenu from '@/components/contracts/ContractActionsMenu'
import { Contract } from '@/types/database'

interface ContractDetailClientProps {
  contract: Contract
  canWrite: boolean
}

export default function ContractDetailClient({ contract, canWrite }: ContractDetailClientProps) {
  const router = useRouter()

  const handleModifyClick = () => {
    router.push(`/dashboard/contracts/${contract.id}/edit`)
  }

  return (
    <ContractActionsMenu
      contract={contract}
      canWrite={canWrite}
      onModifyClick={handleModifyClick}
    />
  )
}
