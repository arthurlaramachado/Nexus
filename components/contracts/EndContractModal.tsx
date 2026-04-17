'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { endContract } from '@/lib/contracts/actions'
type EndContractReason = 'CHURN' | 'CUT' | 'NOT_RENEWED'

interface EndContractModalProps {
  contractId: string
  contractName: string
  isOpen: boolean
  onClose: () => void
}

export default function EndContractModal({
  contractId,
  contractName,
  isOpen,
  onClose,
}: EndContractModalProps) {
  const router = useRouter()
  const [selectedReason, setSelectedReason] = useState<EndContractReason | ''>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) {
      setError('Please select a termination reason')
      return
    }
    if (!description.trim()) {
      setError('Please provide a description')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await endContract(contractId, selectedReason as EndContractReason, description.trim() || undefined)
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to end contract')
    } finally {
      setLoading(false)
    }
  }

  const reasons: { value: EndContractReason; label: string; description: string }[] = [
    {
      value: 'CHURN',
      label: 'Churn',
      description: 'Client cancelled before term end',
    },
    {
      value: 'CUT',
      label: 'Cut',
      description: 'We (Vendor) cancelled before term end',
    },
    {
      value: 'NOT_RENEWED',
      label: 'Not Renewed',
      description: 'Contract finished term naturally but client declined renewal',
    },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End Contract">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-sm text-[#6B6B78] mb-4">
            You are about to end the contract <strong>{contractName}</strong>. Please select the reason:
          </p>

          <div className="space-y-3">
            {reasons.map((reason) => (
              <label
                key={reason.value}
                className="flex items-start p-4 border border-[#E4E4E8] rounded-lg cursor-pointer hover:bg-[#F7F7F8] transition-colors"
              >
                <input
                  type="radio"
                  name="termination_reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value as EndContractReason)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-[#1A1A2E]">{reason.label}</div>
                  <div className="text-sm text-[#9898A3]">{reason.description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
              Description <span className="text-[#EF4444] font-normal">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the reason or add any relevant comments..."
              rows={3}
              className="block w-full px-3 py-2 border border-[#E4E4E8] rounded-lg text-sm outline-none transition-colors focus:ring-1 bg-white hover:border-[#CBCBD1] focus:border-[#9898A3] focus:ring-[#9898A3] resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-[#FEE2E2] border border-[#EF4444]/20 text-[#991B1B] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedReason || !description.trim()}>
            {loading ? 'Ending Contract...' : 'End Contract'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
