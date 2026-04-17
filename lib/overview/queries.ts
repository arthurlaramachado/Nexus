import { createClient } from '@/lib/supabase/server'

export interface OverviewData {
  totalClients: number
  totalContracts: number
  totalCollaborators: number
  activeClients: number
  inactiveClients: number
  churnRate: number
  totalRevenue: number
  contractStatusDistribution: readonly { name: string; value: number; color: string }[]
  contractLogActivity: readonly { name: string; value: number }[]
  collaboratorWorkload: readonly { name: string; value: number }[]
  resourceAllocation: readonly { name: string; value: number }[]
  expiringContracts: readonly {
    id: string
    name: string
    clientName: string
    endDate: string
  }[]
  clientsByIndustry: readonly { name: string; value: number; color: string }[]
  revenueByClient: readonly { name: string; value: number }[]
}

const INDUSTRY_COLORS = [
  '#3B82F6', '#F0C14B', '#10B981', '#EF4444', '#8B5CF6',
  '#F97316', '#06B6D4', '#EC4899', '#6366F1', '#84CC16',
] as const

const LOG_ACTION_LABELS: Record<string, string> = {
  UPSELL: 'Upsell',
  DOWNSELL: 'Downsell',
  CHURN: 'Churn',
  CUT: 'Cut',
  NOT_RENEWED: 'Not Renewed',
  RENEWAL_EXIT: 'Renewal Exit',
  RENEWAL_ENTRY: 'Renewal Entry',
}

export async function getOverviewData(): Promise<OverviewData> {
  const supabase = await createClient()

  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  const now = new Date().toISOString()
  const ninetyDaysStr = ninetyDaysFromNow.toISOString()

  const [
    clientsCountResult,
    contractsCountResult,
    collaboratorsCountResult,
    inactiveClientsResult,
    contractsResult,
    contractLogsResult,
    assignmentsResult,
    expiringContractsResult,
    clientsResult,
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('contracts').select('id', { count: 'exact', head: true }),
    supabase.from('collaborators').select('id', { count: 'exact', head: true }),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
    supabase.from('contracts').select('status, current_value, client_id, clients(name)'),
    supabase.from('contract_logs').select('action_type'),
    supabase.from('contract_assignments').select('collaborator_id, allocation_percentage, collaborators(full_name)'),
    supabase
      .from('contracts')
      .select('id, name, end_date, clients(name)')
      .eq('status', 'ACTIVE')
      .lte('end_date', ninetyDaysStr)
      .gte('end_date', now)
      .order('end_date')
      .limit(10),
    supabase.from('clients').select('industry'),
  ])

  const totalClients = clientsCountResult.count ?? 0
  const totalContracts = contractsCountResult.count ?? 0
  const totalCollaborators = collaboratorsCountResult.count ?? 0
  const inactiveClients = inactiveClientsResult.count ?? 0
  const activeClients = totalClients - inactiveClients
  const churnRate = totalClients > 0 ? (inactiveClients / totalClients) * 100 : 0

  // Revenue & Contract Status
  const contracts = contractsResult.data ?? []
  const activeContracts = contracts.filter((c: any) => c.status === 'ACTIVE')
  const endedContracts = contracts.filter((c: any) => c.status === 'ENDED')
  const totalRevenue = activeContracts.reduce((sum: number, c: any) => sum + (c.current_value ?? 0), 0)

  const contractStatusDistribution = [
    { name: 'Active', value: activeContracts.length, color: '#10B981' },
    { name: 'Ended', value: endedContracts.length, color: '#EF4444' },
  ] as const

  // Contract Log Activity
  const logCounts: Record<string, number> = {}
  for (const log of contractLogsResult.data ?? []) {
    const action = (log as any).action_type as string
    logCounts[action] = (logCounts[action] ?? 0) + 1
  }
  const contractLogActivity = Object.entries(logCounts).map(([action, count]) => ({
    name: LOG_ACTION_LABELS[action] ?? action,
    value: count,
  }))

  // Collaborator Workload & Allocation
  const workloadMap: Record<string, { name: string; count: number; totalAlloc: number }> = {}
  for (const a of assignmentsResult.data ?? []) {
    const assignment = a as any
    const id = assignment.collaborator_id
    if (!workloadMap[id]) {
      workloadMap[id] = {
        name: assignment.collaborators?.full_name ?? 'Unknown',
        count: 0,
        totalAlloc: 0,
      }
    }
    workloadMap[id].count++
    workloadMap[id].totalAlloc += assignment.allocation_percentage ?? 0
  }

  const workloadEntries = Object.values(workloadMap)

  const collaboratorWorkload = [...workloadEntries]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ name, count }) => ({ name, value: count }))

  const resourceAllocation = [...workloadEntries]
    .map(({ name, count, totalAlloc }) => ({
      name,
      value: count > 0 ? Math.round(totalAlloc / count) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Expiring Contracts
  const expiringContracts = (expiringContractsResult.data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    clientName: c.clients?.name ?? 'Unknown',
    endDate: c.end_date,
  }))

  // Clients by Industry
  const industryCounts: Record<string, number> = {}
  for (const c of clientsResult.data ?? []) {
    const industry = (c as any).industry ?? 'Not specified'
    industryCounts[industry] = (industryCounts[industry] ?? 0) + 1
  }
  const clientsByIndustry = Object.entries(industryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value], i) => ({
      name,
      value,
      color: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length],
    }))

  // Revenue by Client (top 10 active contracts grouped by client)
  const revenueByClientMap: Record<string, { name: string; value: number }> = {}
  for (const c of activeContracts) {
    const contract = c as any
    const clientId = contract.client_id
    const clientName = contract.clients?.name ?? 'Unknown'
    if (!revenueByClientMap[clientId]) {
      revenueByClientMap[clientId] = { name: clientName, value: 0 }
    }
    revenueByClientMap[clientId].value += contract.current_value ?? 0
  }
  const revenueByClient = Object.values(revenueByClientMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return {
    totalClients,
    totalContracts,
    totalCollaborators,
    activeClients,
    inactiveClients,
    churnRate,
    totalRevenue,
    contractStatusDistribution,
    contractLogActivity,
    collaboratorWorkload,
    resourceAllocation,
    expiringContracts,
    clientsByIndustry,
    revenueByClient,
  }
}
