'use client'

import { ReactNode } from 'react'

interface TabsProps {
  tabs: Array<{
    id: string
    label: string
    count?: number
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  children: ReactNode
}

export default function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  return (
    <div>
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors
                ${
                  isActive
                    ? 'bg-[#1A1A2E] text-white'
                    : 'text-[#6B6B78] hover:bg-[#F0F0F2]'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  ml-1.5 py-0.5 px-1.5 rounded-full text-[11px]
                  ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F0F0F2] text-[#6B6B78]'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-4">
        {children}
      </div>
    </div>
  )
}
