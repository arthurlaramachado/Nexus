export function calculateTimeDifference(eventDate: string | null, systemUpdateDate: string): number | null {
  if (!eventDate) return null
  
  const event = new Date(eventDate)
  const systemUpdate = new Date(systemUpdateDate)
  
  // Calculate difference in days
  const diffTime = systemUpdate.getTime() - event.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export function formatTimeDifference(days: number | null): string {
  if (days === null) return '-'
  
  if (days === 0) return 'Same day'
  if (days > 0) return `${days} day(s) late`
  return `${Math.abs(days)} day(s) early`
}

export function getTimeDifferenceBadgeVariant(days: number | null): 'success' | 'warning' | 'danger' | 'default' {
  if (days === null) return 'default'
  
  if (days <= 0) return 'success'
  if (days <= 7) return 'warning'
  return 'danger'
}


