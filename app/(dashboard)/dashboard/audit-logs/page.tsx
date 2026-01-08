import { createClient } from '@/lib/supabase/server'
import AuditLogFilters from '@/components/filters/AuditLogFilters'
import AuditLogsTable from '@/components/features/audit-logs/AuditLogsTable'
import {
  calculateTimeDifference,
} from '@/lib/audit/calculations'

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    user_id?: string
    table_name?: string
    record_id?: string
    start_date?: string
    end_date?: string
  }>
}) {
  const { user_id, table_name, record_id, start_date, end_date } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (user_id) {
    query = query.eq('user_id', user_id)
  }
  if (table_name) {
    query = query.eq('table_name', table_name)
  }
  if (record_id) {
    query = query.eq('record_id', record_id)
  }
  if (start_date) {
    query = query.gte('created_at', start_date)
  }
  if (end_date) {
    query = query.lte('created_at', end_date)
  }

  const { data: auditLogs, error } = await query

  if (error) {
    return <div>Error loading audit logs: {error.message}</div>
  }

  // Fetch collaborators for user names manually since we can't join easily on user_id if it's nullable or complex
  const userIds = [...new Set((auditLogs || []).map((log: any) => log.user_id).filter(Boolean))]
  
  // We need to find the collaborator record for these user_ids
  // Since user_id is unique per org in collaborators, this works fine in context
  const { data: collaboratorsMap } = userIds.length > 0
    ? await supabase
        .from('collaborators')
        .select('user_id, full_name')
        .in('user_id', userIds)
    : { data: [] }

  const collaboratorsByUserId = (collaboratorsMap || []).reduce((acc: any, c: any) => {
    if (c.user_id) acc[c.user_id] = c
    return acc
  }, {})

  // Fetch related records to calculate time differences for date fields
  const enrichedLogs = (auditLogs || []).map((log: any) => {
    let timeDifference = null
    let timeDifferenceField = null

    // For contracts, check if date fields were changed
    if (log.table_name === 'contracts' && Array.isArray(log.changes)) {
      const dateFields = ['start_date', 'end_date', 'renewal_date']
      const dateChange = log.changes.find((change: any) =>
        dateFields.includes(change.field)
      )

      if (dateChange && dateChange.new_value) {
        timeDifference = calculateTimeDifference(
          dateChange.new_value,
          log.created_at
        )
        timeDifferenceField = dateChange.field
      }
    }

    return {
      ...log,
      timeDifference,
      timeDifferenceField,
      collaborator: log.user_id ? collaboratorsByUserId[log.user_id] : null,
    }
  })

  // Get list of users for filter
  const { data: users } = await supabase
    .from('collaborators')
    .select('user_id, full_name')
    .not('user_id', 'is', null)
    .order('full_name')

  // Map to format expected by filter component
  const filterUsers = (users || []).map((u: any) => ({
    user_id: u.user_id,
    full_name: u.full_name
  }))

  const tableNames = [
    'clients',
    'contracts',
    'roles',
    'collaborators',
    'contract_assignments',
    'organizations',
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      <AuditLogFilters users={filterUsers} tableNames={tableNames} />

      <div className="mt-6">
        <AuditLogsTable logs={enrichedLogs} />
      </div>
    </div>
  )
}
