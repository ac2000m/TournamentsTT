import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { FormatBadge } from '@/components/format-badge'
import { StarRating } from '@/components/star-rating'
import { ReviewSection } from '@/components/review-section'
import { RegisterButton } from '@/components/register-button'
import type { Profile, Tournament, Registration, Review } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'
import {
  Calendar, MapPin, Users, DollarSign, Trophy, Clock, FileText, Info
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatFee(cents: number) {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(0)}`
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, course:courses(*)')
    .eq('id', id)
    .single()

  if (!tournament) notFound()

  const t = tournament as Tournament

  // Registration count
  const { count: regCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', id)
    .eq('status', 'confirmed')

  // User's registration
  let userReg: Registration | null = null
  if (user) {
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('tournament_id', id)
      .eq('golfer_id', user.id)
      .single()
    userReg = data
  }

  // Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profile:profiles(id,display_name,avatar_url)')
    .eq('tournament_id', id)
    .order('created_at', { ascending: false })

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0

  const spotsLeft = t.max_participants ? t.max_participants - (regCount ?? 0) : null
  const isOpen = t.status === 'published'
  const isFull = spotsLeft !== null && spotsLeft <= 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar profile={profile} />

      {/* Cover */}
      <div className="relative h-52 md:h-72 bg-gradient-to-br from-sidebar via-primary/80 to-accent/40 overflow-hidden">
        {t.cover_image_url && (
          <img src={t.cover_image_url} alt={t.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-sidebar/60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-2">
            <FormatBadge format={t.format} customLabel={t.format_custom} />
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">
              {STATUS_LABELS[t.status]}
            </span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white text-balance">{t.name}</h1>
          {t.course && (
            <div className="flex items-center gap-1.5 mt-2 text-white/80 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{t.course.name}</span>
              {t.course.city && <span className="opacity-70">&bull; {t.course.city}, {t.course.state}</span>}
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Description */}
            {t.description && (
              <section>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-3">About this event</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{t.description}</p>
              </section>
            )}

            {/* Rules */}
            {t.rules && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-heading text-xl font-semibold text-foreground">Rules & Format</h2>
                </div>
                <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {t.rules}
                </div>
              </section>
            )}

            {/* Course maps */}
            {t.course?.map_images && t.course.map_images.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-3">Course Maps</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.course.map_images as any[]).map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border">
                      <img src={img.url} alt={img.label || `Map ${i + 1}`} className="w-full object-cover" />
                      {img.label && (
                        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted">{img.label}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Registered golfers */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  Participants ({regCount ?? 0}{t.max_participants ? ` / ${t.max_participants}` : ''})
                </h2>
              </div>
              {(regCount ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm">No confirmed registrations yet.</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {regCount} golfer{regCount !== 1 ? 's' : ''} registered
                  {spotsLeft !== null && spotsLeft > 0 && ` — ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} remaining`}
                  {isFull && ' — Tournament is full'}
                </p>
              )}
            </section>

            <Separator />

            {/* Reviews */}
            <ReviewSection
              tournamentId={t.id}
              reviews={(reviews as Review[]) ?? []}
              avgRating={avgRating}
              userId={user?.id}
              userReg={userReg}
            />
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            {/* Registration card */}
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading text-2xl font-bold text-foreground">
                  {formatFee(t.entry_fee_cents)}
                </span>
                {spotsLeft !== null && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {isFull ? 'Full' : `${spotsLeft} left`}
                  </span>
                )}
              </div>

              <RegisterButton
                tournament={t}
                userId={user?.id}
                userRegistration={userReg}
                isOpen={isOpen}
                isFull={isFull}
                profile={profile}
              />

              {!user && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  You need an account to register
                </p>
              )}
            </div>

            {/* Event details card */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="font-semibold text-foreground">Event Details</h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Start Date</div>
                    <div className="text-muted-foreground">{formatDate(t.start_date)}</div>
                  </div>
                </div>
                {t.end_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">End Date</div>
                      <div className="text-muted-foreground">{formatDate(t.end_date)}</div>
                    </div>
                  </div>
                )}
                {t.registration_deadline && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-accent/80 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">Registration Closes</div>
                      <div className="text-muted-foreground">{formatDate(t.registration_deadline)}</div>
                    </div>
                  </div>
                )}
                {t.prize_pool && (
                  <div className="flex items-start gap-3">
                    <Trophy className="w-4 h-4 text-accent/80 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">Prize Pool</div>
                      <div className="text-muted-foreground">{t.prize_pool}</div>
                    </div>
                  </div>
                )}
                {t.course && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">{t.course.name}</div>
                      <div className="text-muted-foreground">
                        {[t.course.city, t.course.state].filter(Boolean).join(', ')}
                      </div>
                      {t.course.address && <div className="text-muted-foreground text-xs">{t.course.address}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
