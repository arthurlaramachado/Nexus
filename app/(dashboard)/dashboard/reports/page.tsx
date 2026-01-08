import { createClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'

export default async function ReportsPage() {
  const supabase = await createClient()

  // 1. Contracts expiring in the next 90 days
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)
  
  const { data: expiringContracts } = await supabase
    .from('contracts')
    .select('*, clients(name)')
    .eq('status', 'active')
    .lte('end_date', ninetyDaysFromNow.toISOString())
    .gte('end_date', new Date().toISOString())
    .order('end_date')
    .limit(10)

  // 2. Client churn rate (inactive clients / total clients)
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
  
  const { count: inactiveClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inactive')

  const churnRate = totalClients ? ((inactiveClients || 0) / totalClients) * 100 : 0

  // 3. Collaborator workload (active assignments count)
  // Fix: Removed 'role' from selection as it's no longer a column on collaborators
  // Instead fetching roles(name) via the relation
  const { data: assignments } = await supabase
    .from('contract_assignments')
    .select('collaborator_id, collaborators(full_name, roles(name))')
  
  const collaboratorWorkload = assignments?.reduce((acc: any, a: any) => {
    const collabId = a.collaborator_id
    if (!acc[collabId]) {
      const roles = a.collaborators?.roles
      const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name
      
      acc[collabId] = {
        name: a.collaborators?.full_name,
        role: roleName,
        count: 0
      }
    }
    acc[collabId].count++
    return acc
  }, {})

  const workloadArray = Object.values(collaboratorWorkload || {}).sort((a: any, b: any) => b.count - a.count).slice(0, 10)

  // 4. Contract renewal status
  const { data: renewalStats } = await supabase
    .from('contracts')
    .select('type')
  
  const renewalCounts = renewalStats?.reduce((acc: any, c: any) => {
    acc[c.type] = (acc[c.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Churn Rate">
          <div className="text-4xl font-bold text-gray-900">{churnRate.toFixed(1)}%</div>
          <p className="text-sm text-gray-500 mt-2">Inactive vs Total Clients</p>
        </Card>
        
        <Card title="Active Contracts Expiring Soon">
          <div className="text-4xl font-bold text-gray-900">{expiringContracts?.length || 0}</div>
          <p className="text-sm text-gray-500 mt-2">Next 90 Days</p>
        </Card>

        <Card title="Total Active Clients">
          <div className="text-4xl font-bold text-gray-900">{totalClients ? totalClients - (inactiveClients || 0) : 0}</div>
          <p className="text-sm text-gray-500 mt-2">Currently Active</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Contracts Table */}
        <Card title="Expiring Contracts (Next 90 Days)">
          {expiringContracts && expiringContracts.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Client</TableHeader>
                  <TableHeader>Contract</TableHeader>
                  <TableHeader>End Date</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiringContracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.clients?.name}</TableCell>
                    <TableCell>{contract.name}</TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">
                        {new Date(contract.end_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">No contracts expiring soon.</p>
          )}
        </Card>

        {/* Collaborator Workload */}
        <Card title="Top Collaborator Workload">
          {workloadArray && workloadArray.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Collaborator</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Assignments</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {workloadArray.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="info">{item.role || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500">No active assignments data.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
