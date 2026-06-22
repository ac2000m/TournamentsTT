'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TournamentCard } from '@/components/tournament-card'
import { StarRating } from '@/components/star-rating'
import { Badge } from '@/components/ui/badge'
import type { Profile, GolferBadge, Registration } from '@/lib/types'
import { toast } from 'sonner'
import {
  Trophy, Award, Users, Edit3, Check, X, UserPlus, Clock, MapPin,
  Flag, Star, Zap, User
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  flag: Flag, trophy: Trophy, award: Award, star: Star, users: Users, zap: Zap,
}

interface ProfileClientProps {
  profile: Profile
  registrations: any[]
  golferBadges: GolferBadge[]
  friends: any[]
  pendingRequests: any[]
}

export function ProfileClient({ profile, registrations, golferBadges, friends, pendingRequests }: ProfileClientProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [handicap, setHandicap] = useState(profile.handicap?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [addingFriend, setAddingFriend] = useState(false)

  const initials = profile.display_name?.slice(0, 2).toUpperCase() ?? 'GF'
  const confirmedRegs = registrations.filter((r) => r.status === 'confirmed')
  const upcomingRegs = registrations.filter((r) => {
    const t = r.tournament
    return t && ['published', 'active'].includes(t.status)
  })

  async function saveProfile() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      bio: bio || null,
      location: location || null,
      handicap: handicap ? parseFloat(handicap) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Profile updated')
    setEditing(false)
    router.refresh()
  }

  async function acceptFriendRequest(friendshipId: string) {
    const supabase = createClient()
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    toast.success('Friend request accepted!')
    router.refresh()
  }

  async function declineFriendRequest(friendshipId: string) {
    const supabase = createClient()
    await supabase.from('friendships').update({ status: 'declined' }).eq('id', friendshipId)
    router.refresh()
  }

  async function sendFriendRequest() {
    if (!friendEmail.trim()) return
    setAddingFriend(true)
    const supabase = createClient()
    // Find user by email via auth — look up by display name or search profiles
    const { data: users } = await supabase
      .from('profiles')
      .select('id,display_name')
      .ilike('display_name', friendEmail.trim())
      .limit(1)
    if (!users || users.length === 0) {
      toast.error('No golfer found with that name')
      setAddingFriend(false)
      return
    }
    const target = users[0]
    const { error } = await supabase.from('friendships').insert({
      requester_id: profile.id,
      addressee_id: target.id,
      status: 'pending',
    })
    setAddingFriend(false)
    if (error) { toast.error(error.code === '23505' ? 'Request already sent' : error.message); return }
    toast.success(`Friend request sent to ${target.display_name}!`)
    setFriendEmail('')
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Display Name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Handicap</Label>
                    <Input type="number" step="0.1" placeholder="e.g. 12.4" value={handicap} onChange={(e) => setHandicap(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>Location</Label>
                    <Input placeholder="e.g. Scottsdale, AZ" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label>Bio</Label>
                    <Textarea rows={2} placeholder="Tell other golfers about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="resize-none" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveProfile} disabled={saving} className="gap-1.5">
                    <Check className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1.5">
                    <X className="w-3.5 h-3.5" />Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-2xl font-bold text-foreground">{profile.display_name ?? 'Golfer'}</h1>
                  {profile.handicap !== null && (
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      HCP {profile.handicap}
                    </span>
                  )}
                </div>
                {profile.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />{profile.location}
                  </div>
                )}
                {profile.bio && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{profile.bio}</p>}
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  <span><strong className="text-foreground">{confirmedRegs.length}</strong> tournaments</span>
                  <span><strong className="text-foreground">{golferBadges.length}</strong> badges</span>
                  <span><strong className="text-foreground">{friends.length}</strong> friends</span>
                </div>
              </>
            )}
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5 shrink-0">
              <Edit3 className="w-3.5 h-3.5" />Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Pending friend requests banner */}
      {pendingRequests.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm font-medium text-primary mb-3">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            {pendingRequests.length} pending friend request{pendingRequests.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-col gap-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-3">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={req.profile?.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {req.profile?.display_name?.slice(0, 2).toUpperCase() ?? 'G'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium flex-1">{req.profile?.display_name}</span>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => acceptFriendRequest(req.id)}>
                  <Check className="w-3 h-3" />Accept
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => declineFriendRequest(req.id)}>
                  <X className="w-3 h-3" />Decline
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="tournaments">
        <TabsList className="grid grid-cols-3 w-full max-w-sm">
          <TabsTrigger value="tournaments" className="gap-1.5 text-xs sm:text-sm">
            <Trophy className="w-3.5 h-3.5" />Events
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-1.5 text-xs sm:text-sm">
            <Award className="w-3.5 h-3.5" />Badges
          </TabsTrigger>
          <TabsTrigger value="friends" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-3.5 h-3.5" />Friends
          </TabsTrigger>
        </TabsList>

        {/* Tournaments tab */}
        <TabsContent value="tournaments" className="mt-6">
          {registrations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tournaments yet</p>
              <p className="text-sm mt-1">Browse events and sign up to get started</p>
  <a href="/tournaments" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>Browse Tournaments</a>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {upcomingRegs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Upcoming</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcomingRegs.map((reg) => (
                      <TournamentCard key={reg.id} tournament={{ ...reg.tournament, user_registration: reg }} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">All Registrations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {registrations.map((reg) => (
                    <TournamentCard key={reg.id} tournament={{ ...reg.tournament, user_registration: reg }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Badges tab */}
        <TabsContent value="badges" className="mt-6">
          {golferBadges.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No badges yet</p>
              <p className="text-sm mt-1">Register for tournaments and leave reviews to earn badges</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {golferBadges.map((gb) => {
                const badge = gb.badge!
                const Icon = ICON_MAP[badge.icon] ?? Award
                return (
                  <div key={gb.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${badge.color}20` }}>
                      <Icon className="w-6 h-6" style={{ color: badge.color }} />
                    </div>
                    <div className="font-semibold text-sm text-foreground">{badge.name}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{badge.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(gb.awarded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Friends tab */}
        <TabsContent value="friends" className="mt-6">
          <div className="flex flex-col gap-6">
            {/* Add friend */}
            <div className="bg-muted rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-3">Find a golfer by display name</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter display name..."
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendFriendRequest()}
                  className="flex-1"
                />
                <Button onClick={sendFriendRequest} disabled={addingFriend} className="gap-1.5 shrink-0">
                  <UserPlus className="w-4 h-4" />
                  {addingFriend ? 'Sending...' : 'Add'}
                </Button>
              </div>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No friends yet</p>
                <p className="text-sm mt-1">Search for golfers above to connect</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map((f) => (
                  <div key={f.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={f.profile?.avatar_url} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {f.profile?.display_name?.slice(0, 2).toUpperCase() ?? 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">{f.profile?.display_name}</div>
                      {f.profile?.handicap !== null && f.profile?.handicap !== undefined && (
                        <div className="text-xs text-muted-foreground">HCP {f.profile.handicap}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
