'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Flag, ChevronRight, ChevronLeft, User, MapPin, Trophy, ExternalLink, Check } from 'lucide-react'

const STEPS = ['profile', 'handicap', 'connections'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('profile')
  const [saving, setSaving] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [handicap, setHandicap] = useState('')
  const [ghin, setGhin] = useState('')
  const [birdies18, setBirdies18] = useState('')

  const stepIndex = STEPS.indexOf(step)
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  function next() {
    if (step === 'profile' && !displayName.trim()) {
      toast.error('Please enter a display name')
      return
    }
    setStep(STEPS[stepIndex + 1])
  }

  function back() {
    setStep(STEPS[stepIndex - 1])
  }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      location: location.trim() || null,
      handicap: handicap ? parseFloat(handicap) : null,
      ghin_number: ghin.trim() || null,
      birdies18_username: birdies18.trim() || null,
      onboarded: true,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)
    if (error) { toast.error(error.message); return }

    fetch('/api/badges/award', { method: 'POST' }).catch(() => {})
    toast.success("You're all set! Welcome to TeeTime 🏌️")
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Flag className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Set up your profile</h1>
          <p className="text-muted-foreground mt-1">Just a few quick steps</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`rounded-full transition-all ${
              i === stepIndex ? 'w-6 h-2 bg-primary' :
              i < stepIndex ? 'w-2 h-2 bg-primary/40' :
              'w-2 h-2 bg-border'
            }`} />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

          {step === 'profile' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Your profile</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="displayName">Display name <span className="text-destructive">*</span></Label>
                <Input id="displayName" placeholder="Tiger Woods" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Location <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="location" placeholder="Chicago, IL" value={location} onChange={e => setLocation(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea id="bio" placeholder="Weekend golfer, scratch player wannabe..." value={bio} onChange={e => setBio(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {step === 'handicap' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Your handicap</h2>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Helps tournament organizers see your skill level. You can update this anytime.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="handicap">Handicap index <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="handicap"
                  type="number"
                  step="0.1"
                  min="-10"
                  max="54"
                  placeholder="e.g. 12.4"
                  value={handicap}
                  onChange={e => setHandicap(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Enter a number between -10 and 54</p>
              </div>
            </div>
          )}

          {step === 'connections' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Connect your accounts</h2>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Optionally link your golf accounts so other players can find and verify your stats.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ghin">GHIN Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="ghin" placeholder="e.g. 1234567" value={ghin} onChange={e => setGhin(e.target.value)} autoFocus />
                <p className="text-xs text-muted-foreground">
                  Your USGA handicap number. <a href="https://www.ghin.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Find it at ghin.com →</a>
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="birdies18">18Birdies Username <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="birdies18" placeholder="e.g. @tigerwoods" value={birdies18} onChange={e => setBirdies18(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Your 18Birdies profile username. <a href="https://18birdies.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">18birdies.com →</a>
                </p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground">
                These are stored as reference info — we don't sync scores automatically.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {!isFirst ? (
              <Button variant="ghost" onClick={back} className="gap-1.5">
                <ChevronLeft className="w-4 h-4" />Back
              </Button>
            ) : <div />}
            {isLast ? (
              <Button onClick={finish} disabled={saving} className="gap-1.5">
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Finish & get started'}
              </Button>
            ) : (
              <Button onClick={next} className="gap-1.5">
                Continue<ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          You can update all of this later in your profile settings.
        </p>
      </div>
    </div>
  )
}
