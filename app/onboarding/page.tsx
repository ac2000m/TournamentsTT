'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Flag, ChevronRight, ChevronLeft, User, Trophy,
  ExternalLink, Check, Camera, Loader2, RefreshCw
} from 'lucide-react'

const STEPS = ['personal', 'golf', 'connections'] as const
type Step = typeof STEPS[number]

const STEP_LABELS = {
  personal: 'Personal Info',
  golf: 'Golf Profile',
  connections: 'Connect Accounts',
}

interface GhinData {
  handicapIndex: number | null
  golferName: string | null
  clubName: string | null
}

interface Birdies18Data {
  username: string
  handicap: number | null
  roundsPlayed: number | null
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('personal')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Personal
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Golf
  const [handicap, setHandicap] = useState('')

  // Connections
  const [ghin, setGhin] = useState('')
  const [ghinData, setGhinData] = useState<GhinData | null>(null)
  const [ghinLoading, setGhinLoading] = useState(false)
  const [ghinError, setGhinError] = useState<string | null>(null)

  const [birdies18, setBirdies18] = useState('')
  const [birdies18Data, setBirdies18Data] = useState<Birdies18Data | null>(null)
  const [birdies18Loading, setBirdies18Loading] = useState(false)
  const [birdies18Error, setBirdies18Error] = useState<string | null>(null)

  const stepIndex = STEPS.indexOf(step)
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  async function uploadAvatar(file: File) {
    setAvatarUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setAvatarUrl(data.url)
        toast.success('Photo uploaded!')
      } else {
        toast.error(data.error ?? 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    }
    setAvatarUploading(false)
  }

  async function lookupGhin() {
    if (!ghin.trim()) return
    setGhinLoading(true)
    setGhinError(null)
    setGhinData(null)
    try {
      // GHIN public lookup via USGA API
      const res = await fetch(
        `https://api2.ghin.com/api/v1/golfers/search.json?per_page=1&page=1&golfer_id=${ghin.trim()}&from_ui=true`,
        { headers: { 'Content-Type': 'application/json' } }
      )
      const data = await res.json()
      const golfer = data?.golfers?.[0]
      if (golfer) {
        const hcp = golfer.handicap_index ?? golfer.display_handicap_index
        setGhinData({
          handicapIndex: hcp !== undefined ? parseFloat(hcp) : null,
          golferName: `${golfer.first_name ?? ''} ${golfer.last_name ?? ''}`.trim() || null,
          clubName: golfer.club_name ?? null,
        })
        // Auto-fill handicap from GHIN
        if (hcp !== undefined) setHandicap(String(parseFloat(hcp)))
      } else {
        setGhinError('No golfer found with that GHIN number')
      }
    } catch {
      setGhinError('Could not connect to GHIN. You can still save your number manually.')
    }
    setGhinLoading(false)
  }

  async function lookup18Birdies() {
    if (!birdies18.trim()) return
    setBirdies18Loading(true)
    setBirdies18Error(null)
    setBirdies18Data(null)
    try {
      // 18Birdies doesn't have a public API — show a helpful message
      await new Promise(r => setTimeout(r, 800)) // simulate check
      setBirdies18Data({
        username: birdies18.trim(),
        handicap: null,
        roundsPlayed: null,
      })
    } catch {
      setBirdies18Error('Could not verify username. It will still be saved.')
    }
    setBirdies18Loading(false)
  }

  function next() {
    if (step === 'personal') {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error('Please enter your first and last name')
        return
      }
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

    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()

    const { error } = await supabase.from('profiles').update({
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      display_name: displayName || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      handicap: handicap ? parseFloat(handicap) : (ghinData?.handicapIndex ?? null),
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

  const initials = `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase() || 'TT'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4">
            <Flag className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Set up your profile</h1>
          <p className="text-muted-foreground mt-1">Just a few quick steps to get started</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < stepIndex ? 'bg-primary text-primary-foreground' :
                  i === stepIndex ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === stepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mb-4 ${i < stepIndex ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

          {/* STEP 1: Personal Info */}
          {step === 'personal' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Personal Information</h2>
              </div>

              {/* Avatar upload */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                  >
                    {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Profile photo (optional)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
                  <Input id="firstName" placeholder="Tiger" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
                  <Input id="lastName" placeholder="Woods" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="phone" type="tel" placeholder="(312) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="address" placeholder="123 Fairway Dr, Chicago, IL" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea id="bio" placeholder="Weekend golfer, scratch player wannabe..." value={bio} onChange={e => setBio(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {/* STEP 2: Golf Profile */}
          {step === 'golf' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Golf Profile</h2>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Your handicap helps tournament organizers know your skill level.
                {ghinData?.handicapIndex !== null && ghinData && ' We already pulled this from your GHIN.'}
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
                <p className="text-xs text-muted-foreground">Between -10 and 54. Connect GHIN on the next step to auto-fill.</p>
              </div>

              {ghinData && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
                  <p className="font-medium text-primary mb-1">✓ Synced from GHIN</p>
                  {ghinData.golferName && <p className="text-foreground">{ghinData.golferName}</p>}
                  {ghinData.clubName && <p className="text-muted-foreground">{ghinData.clubName}</p>}
                  {ghinData.handicapIndex !== null && (
                    <p className="text-foreground font-medium mt-1">Handicap: {ghinData.handicapIndex}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Connections */}
          {step === 'connections' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Connect Your Accounts</h2>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Link your golf accounts to sync your handicap and stats. Both are optional.
              </p>

              {/* GHIN */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ghin" className="text-base font-semibold">GHIN</Label>
                  <a href="https://www.ghin.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    Find my number →
                  </a>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Your USGA handicap number. We'll sync your handicap index live.</p>
                <div className="flex gap-2">
                  <Input
                    id="ghin"
                    placeholder="e.g. 1234567"
                    value={ghin}
                    onChange={e => { setGhin(e.target.value); setGhinData(null); setGhinError(null) }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={lookupGhin}
                    disabled={ghinLoading || !ghin.trim()}
                    className="shrink-0 gap-1.5"
                  >
                    {ghinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Sync
                  </Button>
                </div>
                {ghinError && <p className="text-xs text-destructive">{ghinError}</p>}
                {ghinData && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                    <p className="font-medium text-green-700 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />Connected
                    </p>
                    {ghinData.golferName && <p className="text-foreground mt-1">{ghinData.golferName}</p>}
                    {ghinData.clubName && <p className="text-muted-foreground text-xs">{ghinData.clubName}</p>}
                    {ghinData.handicapIndex !== null && (
                      <p className="text-foreground font-medium text-xs mt-1">Handicap Index: {ghinData.handicapIndex}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border" />

              {/* 18Birdies */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="birdies18" className="text-base font-semibold">18Birdies</Label>
                  <a href="https://18birdies.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    18birdies.com →
                  </a>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Enter your 18Birdies username to link your profile.</p>
                <div className="flex gap-2">
                  <Input
                    id="birdies18"
                    placeholder="@username"
                    value={birdies18}
                    onChange={e => { setBirdies18(e.target.value); setBirdies18Data(null); setBirdies18Error(null) }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={lookup18Birdies}
                    disabled={birdies18Loading || !birdies18.trim()}
                    className="shrink-0 gap-1.5"
                  >
                    {birdies18Loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Link
                  </Button>
                </div>
                {birdies18Error && <p className="text-xs text-destructive">{birdies18Error}</p>}
                {birdies18Data && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                    <p className="font-medium text-green-700 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />Linked
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">@{birdies18Data.username}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Note: 18Birdies doesn't offer a public API — your username is saved for reference.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {!isFirst ? (
              <Button variant="ghost" onClick={back} className="gap-1.5">
                <ChevronLeft className="w-4 h-4" />Back
              </Button>
            ) : <div />}
            {isLast ? (
              <Button onClick={finish} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
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
          Everything can be updated later in your profile settings.
        </p>
      </div>
    </div>
  )
}
