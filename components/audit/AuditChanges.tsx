'use client'

import { formatDate, formatCurrency } from '@/lib/utils/formatting'

interface Change {
  field: string
  old?: any
  new?: any
}

interface AuditChangesProps {
  changes: Change[] | any
  action: 'insert' | 'update' | 'delete'
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

export default function AuditChanges({ changes, action }: AuditChangesProps) {
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
  
  if (changeArray.length === 0) {
    return <span className="text-[#9898A3] text-sm">No changes recorded</span>
  }
  
  return (
    <details className="cursor-pointer group">
      <summary className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] transition-colors">
        {changeArray.length} {changeArray.length === 1 ? 'field' : 'fields'} changed
        <span className="ml-2 text-[#9898A3] group-open:hidden">▼</span>
        <span className="ml-2 text-[#9898A3] hidden group-open:inline">▲</span>
      </summary>
      <div className="mt-3 space-y-2">
        {changeArray.map((change, idx) => (
          <div
            key={idx}
            className="bg-[#F7F7F8] border border-[#E4E4E8] rounded-lg p-3 hover:bg-[#F0F0F2] transition-colors"
          >
            <div className="font-semibold text-sm text-[#1A1A2E] mb-2">
              {getFieldLabel(change.field)}
            </div>
            <div className="space-y-1.5">
              {change.old !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    Old
                  </span>
                  <span className="text-sm text-[#3A3A47] line-through flex-1 break-words">
                    {formatValue(change.old, change.field)}
                  </span>
                </div>
              )}
              {change.new !== undefined && (
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    {change.old !== undefined ? 'New' : 'Value'}
                  </span>
                  <span className="text-sm text-[#1A1A2E] font-medium flex-1 break-words">
                    {formatValue(change.new, change.field)}
                  </span>
                </div>
              )}
              {change.old === undefined && change.new === undefined && (
                <span className="text-sm text-[#9898A3]">No value</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
