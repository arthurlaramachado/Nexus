'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface BarChartCardProps {
  data: readonly { name: string; value: number }[]
  color?: string
  layout?: 'vertical' | 'horizontal'
}

export default function BarChartCard({
  data,
  color = '#3B82F6',
  layout = 'vertical',
}: BarChartCardProps) {
  if (data.length === 0) {
    return <p className="text-[#9898A3] text-sm py-8 text-center">No data available.</p>
  }

  const isHorizontal = layout === 'horizontal'
  const height = isHorizontal ? Math.max(260, data.length * 40) : 260

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 16, left: isHorizontal ? 8 : 0, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E8" />
        {isHorizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12, fill: '#6B6B78' }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B6B78' }}
              width={120}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B6B78' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12, fill: '#6B6B78' }} />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E4E4E8',
            borderRadius: '8px',
            fontSize: '13px',
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  )
}
