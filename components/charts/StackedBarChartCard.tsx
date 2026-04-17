'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts'

interface StackedBarChartCardProps {
  data: readonly {
    month: string
    sales: number
    upsell: number
    downsell: number
    churn: number
    cut: number
  }[]
  formatAsCurrency?: boolean
}

function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${value.toFixed(0)}`
}

const SERIES = [
  { key: 'sales', name: 'New Sales', color: '#3B82F6' },
  { key: 'upsell', name: 'Upsell', color: '#10B981' },
  { key: 'downsell', name: 'Downsell', color: '#F97316' },
  { key: 'churn', name: 'Churn', color: '#EF4444' },
  { key: 'cut', name: 'Cut', color: '#F59E0B' },
] as const

export default function StackedBarChartCard({
  data,
  formatAsCurrency = false,
}: StackedBarChartCardProps) {
  const formatValue = formatAsCurrency ? formatCompactCurrency : undefined
  const hasData = data.some(
    (d) => d.sales !== 0 || d.upsell !== 0 || d.downsell !== 0 || d.churn !== 0 || d.cut !== 0
  )

  if (!hasData) {
    return <p className="text-[#9898A3] text-sm py-8 text-center">No data available.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }} stackOffset="sign">
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E8" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#6B6B78' }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B6B78' }}
          tickFormatter={formatValue}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E4E4E8',
            borderRadius: '8px',
            fontSize: '13px',
          }}
          formatter={(value, name) => [
            formatValue ? formatValue(Math.abs(Number(value))) : Math.abs(Number(value)),
            name,
          ]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-[13px] text-[#6B6B78]">{value}</span>
          )}
        />
        <ReferenceLine y={0} stroke="#9898A3" strokeWidth={1} />
        {SERIES.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            stackId="stack"
            radius={[2, 2, 0, 0]}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
