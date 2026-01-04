import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'

export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !password) {
      toast({ title: 'Enter email and password', variant: 'destructive' })
      return
    }

    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      setLoading(false)

      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' })
        return
      }

      toast({ title: 'Account created', description: 'Check your email to confirm, then sign in' })
      setIsSignUp(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)

      if (error) {
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' })
        return
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Need an account?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
