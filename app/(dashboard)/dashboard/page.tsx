import { getOverviewData } from '@/lib/overview/queries'
import Card from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { formatDate, formatCurrency } from '@/lib/utils/formatting'
import Link from 'next/link'
import { ROUTES } from '@/lib/utils/constants'
import DonutChart from '@/components/charts/DonutChart'
import BarChartCard from '@/components/charts/BarChartCard'

export default async function OverviewPage() {
  const data = await getOverviewData()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#1A1A2E] tracking-tight">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Clients"
          value={String(data.totalClients)}
          subtitle={`${data.activeClients} active, ${data.inactiveClients} inactive`}
          href={ROUTES.CLIENTS}
          icon={
            <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Total Contracts"
          value={String(data.totalContracts)}
          subtitle={`${data.contractStatusDistribution[0].value} active`}
          href={ROUTES.CONTRACTS}
          icon={
            <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <KpiCard
          label="Churn Rate"
          value={`${data.churnRate.toFixed(1)}%`}
          subtitle="Inactive vs total clients"
          icon={
            <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
          iconBg="bg-[#FEE2E2]"
        />
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          subtitle="Active contracts"
          icon={
            <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          iconBg="bg-[#D1FAE5]"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Contract Status">
          <DonutChart data={data.contractStatusDistribution} />
        </Card>
        <Card title="Contract Activity">
          <BarChartCard data={data.contractLogActivity} color="#6366F1" />
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Collaborator Workload (Top 10)">
          <BarChartCard data={data.collaboratorWorkload} layout="horizontal" color="#3B82F6" />
        </Card>
        <Card title="Avg. Allocation % (Top 10)">
          <BarChartCard data={data.resourceAllocation} layout="horizontal" color="#F0C14B" />
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Clients by Industry">
          <DonutChart data={data.clientsByIndustry} />
        </Card>
        <Card title="Revenue by Client (Top 10)">
          <BarChartCard data={data.revenueByClient} layout="horizontal" color="#10B981" />
        </Card>
      </div>

      {/* Expiring Contracts Table */}
      <Card title="Contracts Expiring Soon (90 days)">
        {data.expiringContracts.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Client</TableHeader>
                <TableHeader>Contract</TableHeader>
                <TableHeader>End Date</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.expiringContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.clientName}</TableCell>
                  <TableCell>{contract.name}</TableCell>
                  <TableCell>
                    <span className="text-[#991B1B] font-medium">
                      {formatDate(contract.endDate)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-[#9898A3] text-sm">No contracts expiring in the next 90 days.</p>
        )}
      </Card>
    </div>
  )
}

function KpiCard({
  label,
  value,
  subtitle,
  href,
  icon,
  iconBg = 'bg-[#E0E7FF]',
}: {
  label: string
  value: string
  subtitle: string
  href?: string
  icon: React.ReactNode
  iconBg?: string
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[#6B6B78] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#1A1A2E]">{value}</p>
          <p className="text-[12px] text-[#9898A3] mt-1">{subtitle}</p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
      {href && (
        <Link href={href} className="mt-3 inline-block text-xs text-[#3B82F6] hover:text-[#2563EB] transition-colors">
          View all →
        </Link>
      )}
    </Card>
  )
}
