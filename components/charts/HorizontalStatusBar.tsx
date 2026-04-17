'use client'

interface StatusSegment {
  readonly name: string
  readonly value: number
  readonly color: string
}

interface HorizontalStatusBarProps {
  data: readonly StatusSegment[]
}

export default function HorizontalStatusBar({ data }: HorizontalStatusBarProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <p className="text-[#9898A3] text-sm py-8 text-center">No data available.</p>
  }

  return (
    <div className="space-y-3 py-4">
      <div className="flex h-8 rounded-lg overflow-hidden">
        {data.map((segment) => {
          const pct = (segment.value / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={segment.name}
              className="flex items-center justify-center text-white text-xs font-medium transition-all"
              style={{ width: `${pct}%`, backgroundColor: segment.color, minWidth: pct > 5 ? undefined : '24px' }}
            >
              {pct >= 10 ? `${Math.round(pct)}%` : ''}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 justify-center">
        {data.map((segment) => (
          <div key={segment.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-[13px] text-[#6B6B78]">
              {segment.name}: <span className="font-medium text-[#1A1A2E]">{segment.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
