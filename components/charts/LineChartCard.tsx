'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface LineChartCardProps {
  data: readonly { month: string; value: number }[]
  color?: string
  formatAsCurrency?: boolean
}

function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${value.toFixed(0)}`
}

export default function LineChartCard({
  data,
  color = '#3B82F6',
  formatAsCurrency = false,
}: LineChartCardProps) {
  const formatValue = formatAsCurrency ? formatCompactCurrency : undefined
  if (data.length === 0) {
    return <p className="text-[#9898A3] text-sm py-8 text-center">No data available.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
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
          formatter={(value) => [formatValue ? formatValue(Number(value)) : value, 'MRR']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
