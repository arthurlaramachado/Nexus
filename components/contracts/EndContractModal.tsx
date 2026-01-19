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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) {
      setError('Please select a termination reason')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await endContract(contractId, selectedReason as EndContractReason)
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
          <p className="text-sm text-gray-600 mb-4">
            You are about to end the contract <strong>{contractName}</strong>. Please select the reason:
          </p>

          <div className="space-y-3">
            {reasons.map((reason) => (
              <label
                key={reason.value}
                className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                  <div className="font-medium text-gray-900">{reason.label}</div>
                  <div className="text-sm text-gray-500">{reason.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedReason}>
            {loading ? 'Ending Contract...' : 'End Contract'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
