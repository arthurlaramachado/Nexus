import { createClient } from '@/lib/supabase/server'

export interface OverviewData {
  activeClients: number
  inactiveClients: number
  activeContracts: number
  endedContracts: number
  churnRate: number
  mrr: number
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
  clientsByTag: readonly { name: string; value: number; color: string }[]
  revenueByClient: readonly { name: string; value: number }[]
  terminationReasonDistribution: readonly { name: string; value: number; color: string }[]
  mrrTrend: readonly { month: string; value: number }[]
  financialMovements: readonly {
    month: string
    sales: number
    upsell: number
    downsell: number
    churn: number
    cut: number
  }[]
}

const TAG_COLORS = [
  '#3B82F6', '#F0C14B', '#10B981', '#EF4444', '#8B5CF6',
  '#F97316', '#06B6D4', '#EC4899', '#6366F1', '#84CC16',
] as const

const TERMINATION_COLORS: Record<string, string> = {
  CHURN: '#EF4444',
  NOT_RENEWED: '#F97316',
  CUT: '#F59E0B',
  RENEWED: '#10B981',
}

const TERMINATION_LABELS: Record<string, string> = {
  CHURN: 'Churn',
  NOT_RENEWED: 'Not Renewed',
  CUT: 'Cut',
  RENEWED: 'Renewed',
}

const LOG_ACTION_LABELS: Record<string, string> = {
  UPSELL: 'Upsell',
  DOWNSELL: 'Downsell',
  CHURN: 'Churn',
  CUT: 'Cut',
  NOT_RENEWED: 'Not Renewed',
  RENEWAL: 'Renewal',
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function getLast12Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export async function getOverviewData(): Promise<OverviewData> {
  const supabase = await createClient()

  const now = new Date()
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(now.getDate() + 90)
  const nowStr = now.toISOString()
  const ninetyDaysStr = ninetyDaysFromNow.toISOString()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)
  const sixMonthsAgoStr = sixMonthsAgo.toISOString()

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(now.getMonth() - 12)
  const twelveMonthsAgoStr = twelveMonthsAgo.toISOString()

  const [
    activeClientsResult,
    inactiveClientsResult,
    contractsResult,
    contractLogsResult,
    contractLogsRecentResult,
    assignmentsResult,
    expiringContractsResult,
    clientTagsResult,
    allContractsForTrendResult,
    newContractsResult,
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
    supabase.from('contracts').select('status, current_value, client_id, termination_reason, clients(name)'),
    supabase.from('contract_logs').select('action_type').limit(1000),
    supabase.from('contract_logs').select('action_type, delta_value, created_at').gte('created_at', twelveMonthsAgoStr).limit(1000),
    supabase.from('contract_assignments').select('collaborator_id, allocation_percentage, collaborators(full_name)').limit(500),
    supabase
      .from('contracts')
      .select('id, name, end_date, clients(name)')
      .eq('status', 'ACTIVE')
      .lte('end_date', ninetyDaysStr)
      .gte('end_date', nowStr)
      .order('end_date')
      .limit(10),
    supabase.from('client_tags').select('tags(name)').limit(500),
    supabase.from('contracts').select('status, current_value, start_date, end_date'),
    supabase
      .from('contracts')
      .select('current_value, start_date, previous_contract_id')
      .is('previous_contract_id', null)
      .gte('start_date', twelveMonthsAgoStr),
  ])

  const activeClients = activeClientsResult.count ?? 0
  const inactiveClients = inactiveClientsResult.count ?? 0

  // Contracts
  const contracts = contractsResult.data ?? []
  const activeContractsList = contracts.filter((c: any) => c.status === 'ACTIVE')
  const endedContractsList = contracts.filter((c: any) => c.status === 'ENDED')
  const activeContracts = activeContractsList.length
  const endedContracts = endedContractsList.length
  const mrr = activeContractsList.reduce((sum: number, c: any) => sum + (c.current_value ?? 0), 0)

  // Contract Status Distribution
  const contractStatusDistribution = [
    { name: 'Active', value: activeContracts, color: '#10B981' },
    { name: 'Ended', value: endedContracts, color: '#EF4444' },
  ] as const

  // Churn Rate (last 6 months) - contracts ended by CHURN or NOT_RENEWED
  const recentLogs = contractLogsRecentResult.data ?? []
  const churnEvents = recentLogs.filter((log: any) => {
    const created = new Date(log.created_at)
    return (
      created >= sixMonthsAgo &&
      (log.action_type === 'CHURN' || log.action_type === 'NOT_RENEWED')
    )
  })
  const totalContractsAtStart = activeContracts + churnEvents.length
  const churnRate = totalContractsAtStart > 0
    ? (churnEvents.length / totalContractsAtStart) * 100
    : 0

  // Contract Log Activity (grouped, RENEWAL_ENTRY/EXIT → Renewal)
  const logCounts: Record<string, number> = {}
  for (const log of contractLogsResult.data ?? []) {
    const action = (log as any).action_type as string
    if (action === 'RENEWAL_ENTRY' || action === 'RENEWAL_EXIT') {
      // Count each renewal pair as 1 (only count RENEWAL_ENTRY to avoid double)
      if (action === 'RENEWAL_ENTRY') {
        logCounts['RENEWAL'] = (logCounts['RENEWAL'] ?? 0) + 1
      }
    } else {
      logCounts[action] = (logCounts[action] ?? 0) + 1
    }
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
    workloadMap[id] = {
      ...workloadMap[id],
      count: workloadMap[id].count + 1,
      totalAlloc: workloadMap[id].totalAlloc + (assignment.allocation_percentage ?? 0),
    }
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

  // Clients by Tag
  const tagCounts: Record<string, number> = {}
  for (const ct of clientTagsResult.data ?? []) {
    const tagName = (ct as any).tags?.name ?? 'Unknown'
    tagCounts[tagName] = (tagCounts[tagName] ?? 0) + 1
  }
  const clientsByTag = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value], i) => ({
      name,
      value,
      color: TAG_COLORS[i % TAG_COLORS.length],
    }))

  // Revenue by Client (top 10)
  const revenueByClientMap: Record<string, { name: string; value: number }> = {}
  for (const c of activeContractsList) {
    const contract = c as any
    const clientId = contract.client_id
    const clientName = contract.clients?.name ?? 'Unknown'
    if (!revenueByClientMap[clientId]) {
      revenueByClientMap[clientId] = { name: clientName, value: 0 }
    }
    revenueByClientMap[clientId] = {
      ...revenueByClientMap[clientId],
      value: revenueByClientMap[clientId].value + (contract.current_value ?? 0),
    }
  }
  const revenueByClient = Object.values(revenueByClientMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // Termination Reason Distribution
  const terminationCounts: Record<string, number> = {}
  for (const c of endedContractsList) {
    const reason = (c as any).termination_reason ?? 'Unknown'
    terminationCounts[reason] = (terminationCounts[reason] ?? 0) + 1
  }
  const terminationReasonDistribution = Object.entries(terminationCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([reason, value]) => ({
      name: TERMINATION_LABELS[reason] ?? reason,
      value,
      color: TERMINATION_COLORS[reason] ?? '#9898A3',
    }))

  // MRR Trend (last 12 months)
  const allContracts = allContractsForTrendResult.data ?? []
  const last12 = getLast12Months()
  const mrrTrend = last12.map((monthKey) => {
    const [year, month] = monthKey.split('-').map(Number)
    const monthEnd = new Date(year, month, 0) // last day of month
    const monthEndStr = monthEnd.toISOString()

    const monthStart = monthKey + '-01'
    const activeInMonth = allContracts.filter((c: any) => {
      const start = c.start_date
      const end = c.end_date
      return start <= monthEndStr && (
        (c.status === 'ACTIVE' && (end === null || end >= monthStart)) ||
        (c.status === 'ENDED' && end !== null && end >= monthStart)
      )
    })

    const monthMrr = activeInMonth.reduce((sum: number, c: any) => sum + (c.current_value ?? 0), 0)

    return {
      month: formatMonthLabel(monthKey),
      value: monthMrr,
    }
  })

  // Financial Movements (last 12 months)
  const movementsMap: Record<string, { sales: number; upsell: number; downsell: number; churn: number; cut: number }> = {}
  for (const mk of last12) {
    movementsMap[mk] = { sales: 0, upsell: 0, downsell: 0, churn: 0, cut: 0 }
  }

  // New sales (contracts without previous_contract_id)
  for (const c of newContractsResult.data ?? []) {
    const contract = c as any
    const mk = getMonthKey(contract.start_date)
    if (!movementsMap[mk]) continue
    const value = contract.current_value ?? 0
    movementsMap[mk] = { ...movementsMap[mk], sales: movementsMap[mk].sales + value }
  }

  for (const log of recentLogs) {
    const l = log as any
    const mk = getMonthKey(l.created_at)
    if (!movementsMap[mk]) continue
    const delta = Math.abs(l.delta_value ?? 0)
    switch (l.action_type) {
      case 'UPSELL':
        movementsMap[mk] = { ...movementsMap[mk], upsell: movementsMap[mk].upsell + delta }
        break
      case 'DOWNSELL':
        movementsMap[mk] = { ...movementsMap[mk], downsell: movementsMap[mk].downsell - delta }
        break
      case 'CHURN':
      case 'NOT_RENEWED':
        movementsMap[mk] = { ...movementsMap[mk], churn: movementsMap[mk].churn - delta }
        break
      case 'CUT':
        movementsMap[mk] = { ...movementsMap[mk], cut: movementsMap[mk].cut - delta }
        break
    }
  }
  const financialMovements = last12.map((mk) => ({
    month: formatMonthLabel(mk),
    ...movementsMap[mk],
  }))

  return {
    activeClients,
    inactiveClients,
    activeContracts,
    endedContracts,
    churnRate,
    mrr,
    contractStatusDistribution,
    contractLogActivity,
    collaboratorWorkload,
    resourceAllocation,
    expiringContracts,
    clientsByTag,
    revenueByClient,
    terminationReasonDistribution,
    mrrTrend,
    financialMovements,
  }
}
