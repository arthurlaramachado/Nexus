'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Collaborator, Role } from '@/types/database'

interface Permission {
  table_name: string
  can_read: boolean
  can_write: boolean
  can_delete: boolean
}

interface AppContextType {
  user: any
  collaborator: (Collaborator & { roles: Role }) | null
  permissions: Permission[]
  loading: boolean
  hasPermission: (tableName: string, type: 'read' | 'write' | 'delete') => boolean
  refresh: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [collaborator, setCollaborator] = useState<(Collaborator & { roles: Role }) | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setCollaborator(null)
        setPermissions([])
        return
      }

      setUser(user)

      // Fetch collaborator with role and permissions in a single roundtrip if possible
      // But for simplicity and speed, let's fetch them in parallel
      const [collabRes, permRes] = await Promise.all([
        supabase
          .from('collaborators')
          .select('*, roles(*)')
          .eq('user_id', user.id)
          .single(),
        supabase.rpc('get_user_permissions') // I'll create this RPC for better performance
      ])

      if (collabRes.data) {
        setCollaborator(collabRes.data)
      }

      if (permRes.data) {
        setPermissions(permRes.data)
      } else {
        // Fallback: if RPC fails, we might need to fetch via regular query if RLS allows
        const { data: fallbackPerms } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role_id', collabRes.data?.role_id)
        
        if (fallbackPerms) setPermissions(fallbackPerms)
      }
    } catch (err) {
      console.error('Error fetching app state:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchData()
    })

    return () => subscription.unsubscribe()
  }, [])

  const hasPermission = (tableName: string, type: 'read' | 'write' | 'delete') => {
    if (!collaborator) return false
    if (collaborator.roles?.is_system_role) return true
    
    const perm = permissions.find(p => p.table_name === tableName)
    if (!perm) return false

    if (type === 'read') return perm.can_read
    if (type === 'write') return perm.can_write
    if (type === 'delete') return perm.can_delete
    return false
  }

  return (
    <AppContext.Provider 
      value={{ 
        user, 
        collaborator, 
        permissions, 
        loading, 
        hasPermission,
        refresh: fetchData 
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
