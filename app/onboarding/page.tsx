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
  Flag, ChevronRight, ChevronLeft, User,
  ExternalLink, Check, Camera, Loader2, RefreshCw, MapPin, Search
} from 'lucide-react'

const STEPS = ['personal', 'connections', 'course'] as const
type Step = typeof STEPS[number]

const STEP_LABELS = {
  personal: 'Personal Info',
  connections: 'Golf Accounts',
  course: 'Favorite Course',
}

interface GhinData {
  handicapIndex: number | null
  golferName: string | null
  clubName: string | null
}

interface NearbyPlace {
  place_id: string
  name: string
  vicinity: string
  rating?: number
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

  // Connections
  const [ghin, setGhin] = useState('')
  const [ghinData, setGhinData] = useState<GhinData | null>(null)
  const [ghinLoading, setGhinLoading] = useState(false)
  const [ghinError, setGhinError] = useState<string | null>(null)
  const [birdies18, setBirdies18] = useState('')
  const [birdies18Saved, setBirdies18Saved] = useState(false)

  // Course
  const [courseSearch, setCourseSearch] = useState('')
  const [nearbyCourses, setNearbyCourses] = useState<NearbyPlace[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<NearbyPlace | null>(null)
  const [favoriteCourse, setFavoriteCourse] = useState('')

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
      if (data.url) { setAvatarUrl(data.url); toast.success('Photo uploaded!') }
      else toast.error(data.error ?? 'Upload failed')
    } catch { toast.error('Upload failed') }
    setAvatarUploading(false)
  }

  async function lookupGhin() {
    if (!ghin.trim()) return
    setGhinLoading(true)
    setGhinError(null)
    setGhinData(null)
    try {
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
      } else {
        setGhinError('No golfer found with that GHIN number. Check and try again.')
      }
    } catch {
      setGhinError('Could not reach GHIN right now. Your number is still saved.')
    }
    setGhinLoading(false)
  }

  async function searchNearbyCourses(query?: string) {
    setCoursesLoading(true)
    setNearbyCourses([])
    const searchQuery = query ?? courseSearch
    // Use Google Places text search via our own proxy to avoid CORS + key exposure
    try {
      const res = await fetch(
        `/api/places?q=${encodeURIComponent((searchQuery || address || '') + ' golf course')}`)
      const data = await res.json()
      setNearbyCourses(data.results ?? [])
      if ((data.results ?? []).length === 0) toast('No courses found — try a different search')
    } catch {
      toast.error('Could not search courses right now')
    }
    setCoursesLoading(false)
  }

  function next() {
    if (step === 'personal') {
      if (!firstName.trim()) { toast.error('First name is required'); return }
      if (!lastName.trim()) { toast.error('Last name is required'); return }
      if (!email.trim()) { toast.error('Email is required'); return }
      if (!phone.trim()) { toast.error('Phone number is required'); return }
      if (!address.trim()) { toast.error('Address is required'); return }
    }
    if (step === 'connections') {
      // Auto-search nearby courses using their address when entering course step
      searchNearbyCourses(address)
    }
    setStep(STEPS[stepIndex + 1])
  }

  function back() { setStep(STEPS[stepIndex - 1]) }

  async function finish() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim()

    const { error } = await supabase.from('profiles').update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      display_name: displayName,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      handicap: ghinData?.handicapIndex ?? null,
      ghin_number: ghin.trim() || null,
      birdies18_username: birdies18.trim() || null,
      favorite_course: selectedCourse?.name ?? favoriteCourse.trim() || null,
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

              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 py-1">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                  >
                    {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                </div>
                <p className="text-xs text-muted-foreground">Profile photo <span className="opacity-60">(optional)</span></p>
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
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone number <span className="text-destructive">*</span></Label>
                <Input id="phone" type="tel" placeholder="(312) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
                <Input id="address" placeholder="123 Fairway Dr, Chicago, IL" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea id="bio" placeholder="Weekend golfer, scratch player wannabe..." value={bio} onChange={e => setBio(e.target.value)} rows={2} />
              </div>
            </div>
          )}

          {/* STEP 2: Golf Accounts */}
          {step === 'connections' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Connect Golf Accounts</h2>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                Link your accounts to sync your handicap. Both are optional — you can skip this step.
              </p>

              {/* GHIN */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">GHIN</Label>
                  <a href="https://www.ghin.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Find my number →</a>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Your USGA handicap number. Hit Sync to pull your live handicap index.</p>
                <div className="flex gap-2">
                  <Input placeholder="e.g. 1234567" value={ghin}
                    onChange={e => { setGhin(e.target.value); setGhinData(null); setGhinError(null) }} />
                  <Button type="button" variant="outline" onClick={lookupGhin}
                    disabled={ghinLoading || !ghin.trim()} className="shrink-0 gap-1.5">
                    {ghinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Sync
                  </Button>
                </div>
                {ghinError && <p className="text-xs text-destructive">{ghinError}</p>}
                {ghinData && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                    <p className="font-medium text-green-700 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />Synced from GHIN</p>
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
                  <Label className="text-base font-semibold">18Birdies</Label>
                  <a href="https://18birdies.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">18birdies.com →</a>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Enter your 18Birdies username to link your profile.</p>
                <div className="flex gap-2">
                  <Input placeholder="@username" value={birdies18}
                    onChange={e => { setBirdies18(e.target.value); setBirdies18Saved(false) }} />
                  <Button type="button" variant="outline"
                    onClick={() => { if (birdies18.trim()) { setBirdies18Saved(true); toast.success('18Birdies username saved') } }}
                    disabled={!birdies18.trim() || birdies18Saved} className="shrink-0 gap-1.5">
                    <Check className="w-4 h-4" />Save
                  </Button>
                </div>
                {birdies18Saved && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                    <p className="font-medium text-green-700 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />Linked</p>
                    <p className="text-muted-foreground text-xs mt-0.5">@{birdies18} — saved to your profile</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Favorite Course */}
          {step === 'course' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-xl font-semibold">Favorite Course</h2>
              </div>
              <p className="text-sm text-muted-foreground -mt-2">
                We've searched for golf courses near your address. Pick your favorite or search for another.
              </p>

              {/* Search */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search by course name or city..."
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchNearbyCourses()}
                />
                <Button type="button" variant="outline" onClick={() => searchNearbyCourses()}
                  disabled={coursesLoading} className="shrink-0 gap-1.5">
                  {coursesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Results */}
              {coursesLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Searching nearby courses...</span>
                </div>
              )}

              {nearbyCourses.length > 0 && (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {nearbyCourses.map((course) => (
                    <button
                      key={course.place_id}
                      type="button"
                      onClick={() => setSelectedCourse(course)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedCourse?.place_id === course.place_id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-foreground">{course.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{course.vicinity}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {course.rating && (
                            <span className="text-xs text-muted-foreground">★ {course.rating}</span>
                          )}
                          {selectedCourse?.place_id === course.place_id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual fallback */}
              {!selectedCourse && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="favoriteCourse">Or type it in manually <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="favoriteCourse"
                    placeholder="e.g. Pebble Beach Golf Links"
                    value={favoriteCourse}
                    onChange={e => setFavoriteCourse(e.target.value)}
                  />
                </div>
              )}

              {selectedCourse && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-primary">✓ Selected</p>
                    <p className="text-foreground mt-0.5">{selectedCourse.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCourse.vicinity}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedCourse(null)}
                    className="text-xs text-muted-foreground hover:text-foreground">Change</button>
                </div>
              )}
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
