import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TournamentCard } from '@/components/tournament-card'
import type { Profile, GolferBadge, Registration } from '@/lib/types'
import { MapPin, Trophy, Award, Users, Flag } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

const ICON_MAP: Record<string, string> = {
  flag: '🚩', trophy: '🏆', award: '🎖️', star: '⭐', users: '👥', zap: '⚡',
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let viewerProfile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    viewerProfile = data
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  // Redirect to /profile if viewing own profile
  // (handled via middleware/client but kept for safety)

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, tournament:tournaments(*, course:courses(id,name,city,state))')
    .eq('golfer_id', id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })

  const { data: golferBadges } = await supabase
    .from('golfer_badges')
    .select('*, badge:badges(*)')
    .eq('golfer_id', id)

  // Mutual friends count
  let friendCount = 0
  const { count: fc1 } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('requester_id', id)
    .eq('status', 'accepted')
  const { count: fc2 } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('addressee_id', id)
    .eq('status', 'accepted')
  friendCount = (fc1 ?? 0) + (fc2 ?? 0)

  // Friendship status with viewer
  let friendshipStatus: string | null = null
  if (user && user.id !== id) {
    const { data: f1 } = await supabase
      .from('friendships')
      .select('status')
      .eq('requester_id', user.id)
      .eq('addressee_id', id)
      .single()
    const { data: f2 } = await supabase
      .from('friendships')
      .select('status')
      .eq('requester_id', id)
      .eq('addressee_id', user.id)
      .single()
    friendshipStatus = f1?.status ?? f2?.status ?? null
  }

  const p = profile as Profile
  const regs = (registrations as any[]) ?? []
  const badges = (golferBadges as GolferBadge[]) ?? []
  const initials = p.display_name?.slice(0, 2).toUpperCase() ?? 'GF'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar profile={viewerProfile} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Profile header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-5 items-start">
          <Avatar className="w-20 h-20 shrink-0">
            <AvatarImage src={p.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {p.display_name ?? 'Golfer'}
              </h1>
              {p.handicap !== null && (
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  HCP {p.handicap}
                </span>
              )}
            </div>
            {p.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3.5 h-3.5" />{p.location}
              </div>
            )}
            {p.bio && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.bio}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span><strong className="text-foreground">{regs.length}</strong> tournaments</span>
              <span><strong className="text-foreground">{badges.length}</strong> badges</span>
              <span><strong className="text-foreground">{friendCount}</strong> friends</span>
            </div>
            {friendshipStatus && (
              <div className="mt-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  friendshipStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                  friendshipStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {friendshipStatus === 'accepted' ? '✓ Friends' :
                   friendshipStatus === 'pending' ? '⏳ Friend request pending' :
                   friendshipStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />Badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map((gb) => {
                const badge = gb.badge!
                const emoji = ICON_MAP[badge.icon] ?? '🏅'
                return (
                  <div
                    key={gb.id}
                    className="bg-card border border-border rounded-xl px-3 py-2 flex items-center gap-2"
                    title={badge.description ?? badge.name}
                  >
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{badge.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(gb.awarded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Tournament history */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />Tournament History ({regs.length})
          </h2>
          {regs.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
              <Flag className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tournaments yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {regs.map((reg) => (
                <TournamentCard
                  key={reg.id}
                  tournament={{ ...reg.tournament, user_registration: reg }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
