import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function mapUser(session) {
  if (!session?.user) return null
  const { id, email, user_metadata } = session.user
  const meta = user_metadata ?? {}
  const fullName =
    meta.full_name ??
    meta.name ??
    (meta.given_name && meta.family_name
      ? `${meta.given_name} ${meta.family_name}`.trim()
      : null) ??
    meta.given_name ??
    meta.user_name ??
    'User'
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null
  return {
    id,
    email: email ?? meta.email ?? '',
    name: fullName,
    avatarUrl: avatarUrl || null,
    createdAt: session.user.created_at,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapUser(session))
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
