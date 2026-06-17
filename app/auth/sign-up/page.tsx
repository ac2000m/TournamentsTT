'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Flag, Dumbbell, BarChart2 } from 'lucide-react'
import type { UserRole } from '@/lib/types'

export default function SignUpPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>('golfer')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: { display_name: displayName, role },
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    router.push('/auth/sign-up-success')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Flag className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Join TeeTime</h1>
          <p className="text-muted-foreground mt-1">Create your free account</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('golfer')}
              className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                role === 'golfer'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <Dumbbell className="w-5 h-5" />
              <span className="text-sm font-medium">Golfer</span>
              <span className="text-xs text-center leading-relaxed">Browse & join tournaments</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('manager')}
              className={`flex-1 flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                role === 'manager'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="text-sm font-medium">Course Manager</span>
              <span className="text-xs text-center leading-relaxed">List & manage events</span>
            </button>
          </div>
          <form onSubmit={handleSignUp} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                placeholder={role === 'manager' ? 'Pebble Beach Golf Club' : 'Tiger Woods'}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full mt-1" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
