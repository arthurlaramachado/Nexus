export function getAvatarColor(name: string): string {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#a855f7', // purple-500
    '#7c3aed', // purple-600
    '#2563eb', // blue-600
    '#4f46e5', // indigo-600
    '#9333ea', // purple-600
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

export function getAvatarUrl(userId: string): string | null {
  // In the future, this could fetch from user profile or storage
  // For now, return null to use initials
  return null
}

