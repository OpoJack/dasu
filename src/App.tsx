import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { Auth } from '@/pages/Auth'
import { FrontOfHouse } from '@/pages/FrontOfHouse'
import { Kitchen } from '@/pages/Kitchen'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState(window.location.hash || '#/')

  // Check auth state on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Handle hash routing
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Auth />
        <Toaster />
      </>
    )
  }

  return (
    <>
      {route === '#/kitchen' ? <Kitchen /> : <FrontOfHouse />}
      <Toaster />
    </>
  )
}

export default App
