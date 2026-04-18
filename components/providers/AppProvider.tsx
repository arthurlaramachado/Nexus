'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
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

/**
 * AppProvider manages client-side auth state.
 *
 * All auth/permission data is resolved server-side (via requireAuth/checkPermission
 * in server components). This provider only re-fetches when auth state actually
 * changes (sign-in/sign-out), NOT on initial session — avoiding duplicate
 * Supabase calls that the server already made.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [collaborator, setCollaborator] = useState<(Collaborator & { roles: Role }) | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setCollaborator(null)
        setPermissions([])
        return
      }

      setUser(user)

      const [collabRes, permRes] = await Promise.all([
        supabase
          .from('collaborators')
          .select('*, roles(*)')
          .eq('user_id', user.id)
          .single(),
        supabase.rpc('get_user_permissions'),
      ])

      if (collabRes.data) {
        setCollaborator(collabRes.data)
      }

      if (permRes.data) {
        setPermissions(permRes.data)
      }
    } catch {
      // Auth state sync failed — user will be redirected on next server render
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (session) {
        fetchData()
      } else {
        setUser(null)
        setCollaborator(null)
        setPermissions([])
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchData, supabase.auth])

  const hasPermission = useCallback((tableName: string, type: 'read' | 'write' | 'delete') => {
    if (!collaborator) return false
    if (collaborator.roles?.is_system_role) return true

    const perm = permissions.find(p => p.table_name === tableName)
    if (!perm) return false

    if (type === 'read') return perm.can_read
    if (type === 'write') return perm.can_write
    if (type === 'delete') return perm.can_delete
    return false
  }, [collaborator, permissions])

  return (
    <AppContext.Provider
      value={{
        user,
        collaborator,
        permissions,
        loading,
        hasPermission,
        refresh: fetchData,
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
