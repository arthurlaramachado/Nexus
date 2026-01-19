'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils/formatting'

interface Change {
  field: string
  old?: any
  new?: any
}

interface ChangesModalProps {
  isOpen: boolean
  onClose: () => void
  changes: Change[] | any
  action: 'insert' | 'update' | 'delete'
  title?: string
}

function formatValue(value: any, fieldName?: string): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  // Check if it's a date string
  if (typeof value === 'string') {
    // Try to parse as date
    const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/)
    if (dateMatch) {
      try {
        return formatDate(value)
      } catch {
        // Not a valid date, continue
      }
    }
    
    // Check if field name suggests it's a date
    if (fieldName && (fieldName.includes('date') || fieldName.includes('Date'))) {
      try {
        return formatDate(value)
      } catch {
        // Not a valid date
      }
    }
    
    // Check if field name suggests it's currency/money
    if (fieldName && (fieldName.includes('value') || fieldName.includes('price') || fieldName.includes('amount'))) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        return formatCurrency(numValue)
      }
    }
    
    return value
  }
  
  // Handle numbers
  if (typeof value === 'number') {
    // Check if field name suggests it's currency
    if (fieldName && (fieldName.includes('value') || fieldName.includes('price') || fieldName.includes('amount'))) {
      return formatCurrency(value)
    }
    return value.toLocaleString()
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `[${value.map(v => formatValue(v, fieldName)).join(', ')}]`
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) return '{}'
    if (keys.length <= 3) {
      return `{${keys.map(k => `${k}: ${formatValue(value[k], k)}`).join(', ')}}`
    }
    return `{${keys.length} fields}`
  }
  
  return String(value)
}

function getFieldLabel(fieldName: string): string {
  // Convert snake_case to Title Case
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function ChangesModal({ isOpen, onClose, changes, action, title }: ChangesModalProps) {
  // Handle different change structures
  let changeArray: Change[] = []
  
  if (Array.isArray(changes)) {
    // For UPDATE actions, changes is an array of {field, old, new}
    changeArray = changes
      .filter((change: any) => change && change.field) // Filter out invalid entries
      .map((change: any) => {
        // Handle both {field, old, new} and {field, old_value, new_value} formats
        return {
          field: change.field || change.field_name,
          old: change.old !== undefined ? change.old : change.old_value,
          new: change.new !== undefined ? change.new : change.new_value,
        }
      })
  } else if (changes && typeof changes === 'object') {
    // For INSERT and DELETE, changes is the full record object
    // Filter out system fields
    const systemFields = ['id', 'created_at', 'updated_at']
    const entries = Object.entries(changes).filter(
      ([key]) => !systemFields.includes(key)
    )
    
    if (action === 'insert') {
      // For inserts, show all fields as new values
      changeArray = entries.map(([field, value]) => ({
        field,
        new: value,
      }))
    } else if (action === 'delete') {
      // For deletes, show all fields as old values
      changeArray = entries.map(([field, value]) => ({
        field,
        old: value,
      }))
    } else {
      // Fallback for updates that might come as object
      changeArray = entries.map(([field, value]) => ({
        field,
        new: value,
      }))
    }
  }
  
  const getActionBadgeVariant = () => {
    switch (action) {
      case 'insert':
        return 'success'
      case 'update':
        return 'info'
      case 'delete':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getActionLabel = () => {
    switch (action) {
      case 'insert':
        return 'Created'
      case 'update':
        return 'Updated'
      case 'delete':
        return 'Deleted'
      default:
        return action
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Change Details'}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant={getActionBadgeVariant()}>
            {getActionLabel()}
          </Badge>
          <span className="text-sm text-gray-600">
            {changeArray.length} {changeArray.length === 1 ? 'field' : 'fields'} {action === 'insert' ? 'set' : action === 'delete' ? 'removed' : 'changed'}
          </span>
        </div>

        {changeArray.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No changes recorded
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {changeArray.map((change, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="font-semibold text-base text-gray-900 mb-3">
                  {getFieldLabel(change.field)}
                </div>
                <div className="space-y-2">
                  {change.old !== undefined && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded border border-red-200 min-w-[60px] text-center">
                        Old
                      </span>
                      <span className="text-sm text-gray-700 line-through flex-1 break-words pt-1">
                        {formatValue(change.old, change.field)}
                      </span>
                    </div>
                  )}
                  {change.new !== undefined && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded border border-green-200 min-w-[60px] text-center">
                        {change.old !== undefined ? 'New' : 'Value'}
                      </span>
                      <span className="text-sm text-gray-900 font-medium flex-1 break-words pt-1">
                        {formatValue(change.new, change.field)}
                      </span>
                    </div>
                  )}
                  {change.old === undefined && change.new === undefined && (
                    <span className="text-sm text-gray-500">No value</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  )
}
