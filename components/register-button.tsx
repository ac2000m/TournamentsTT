'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { EmbeddedCheckout } from '@/components/embedded-checkout'
import type { Tournament, Registration, Profile } from '@/lib/types'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'

interface RegisterButtonProps {
  tournament: Tournament
  userId: string | undefined
  userRegistration: Registration | null
  isOpen: boolean
  isFull: boolean
  profile: Profile | null
}

export function RegisterButton({
  tournament,
  userId,
  userRegistration,
  isOpen,
  isFull,
  profile,
}: RegisterButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const isPaid = tournament.entry_fee_cents > 0

  async function handleFreeRegister() {
    if (!userId) { router.push('/auth/login'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('registrations').insert({
      tournament_id: tournament.id,
      golfer_id: userId,
      status: 'confirmed',
      amount_paid_cents: 0,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Registered! See you on the course.')
    router.refresh()
  }

  async function handleCancel() {
    if (!userId || !userRegistration) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', userRegistration.id)
      .eq('golfer_id', userId)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Registration cancelled')
    router.refresh()
  }

  if (userRegistration) {
    const isConfirmed = userRegistration.status === 'confirmed'
    return (
      <div className="flex flex-col gap-2">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
          isConfirmed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-muted text-muted-foreground border border-border'
        }`}>
          {isConfirmed
            ? <><CheckCircle className="w-4 h-4" /> You&apos;re registered!</>
            : <><XCircle className="w-4 h-4" /> Status: {userRegistration.status}</>
          }
        </div>
        <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading} className="text-destructive hover:text-destructive">
          {loading ? 'Cancelling...' : 'Cancel registration'}
        </Button>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <Button className="w-full" disabled>
        {tournament.status === 'completed' ? 'Tournament ended' : 'Registration closed'}
      </Button>
    )
  }

  if (isFull) {
    return <Button className="w-full" disabled>Tournament full</Button>
  }

  if (!userId) {
    return (
      <Button className="w-full" onClick={() => router.push('/auth/login')}>
        Sign in to register
      </Button>
    )
  }

  if (isPaid) {
    if (showCheckout) {
      return (
        <EmbeddedCheckout
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          entryFeeCents={tournament.entry_fee_cents}
          onClose={() => setShowCheckout(false)}
        />
      )
    }
    return (
      <Button className="w-full" onClick={() => setShowCheckout(true)}>
        Register — ${(tournament.entry_fee_cents / 100).toFixed(0)}
      </Button>
    )
  }

  return (
    <Button className="w-full" onClick={handleFreeRegister} disabled={loading}>
      {loading ? 'Registering...' : 'Register (Free)'}
    </Button>
  )
}
