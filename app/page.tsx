import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import type { Profile, Tournament } from '@/lib/types'
import { TournamentCard } from '@/components/tournament-card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trophy, Search, Flag, Users, Star, ChevronRight, MapPin } from 'lucide-react'

async function getFeaturedTournaments(): Promise<Tournament[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tournaments')
    .select('*, course:courses(id,name,city,state)')
    .in('status', ['published', 'active'])
    .eq('is_archived', false)
    .order('start_date', { ascending: true })
    .limit(6)
  return (data as Tournament[]) ?? []
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const featured = await getFeaturedTournaments()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar py-20 md:py-32">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #2d6a4f 0%, transparent 50%), radial-gradient(circle at 80% 20%, #d4a017 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-sidebar-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
            <Flag className="w-3.5 h-3.5" />
            The golfer&apos;s tournament platform
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6 text-balance">
            Find your next{' '}
            <span className="text-accent">golf tournament</span>{' '}
            in minutes
          </h1>
          <p className="text-sidebar-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
            Browse local tournaments by format, sign up with one click, and track your game history. Course managers get a full dashboard to list events and manage registrations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/tournaments"
              className={cn(buttonVariants({ size: 'lg' }), 'bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto gap-2')}
            >
              <Search className="w-4 h-4" />
              Browse Tournaments
            </Link>
            <Link
              href="/auth/sign-up"
              className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'border-white/30 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto gap-2 bg-transparent')}
            >
              Create Account
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-card border-b border-border py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Search, label: 'Browse by Format', desc: 'Stroke, Scramble, Skins & more' },
              { icon: Trophy, label: 'Easy Sign-Up', desc: 'Register & pay in seconds' },
              { icon: Users, label: 'Golf Friends', desc: 'Connect with local golfers' },
              { icon: Star, label: 'Reviews & Badges', desc: 'Rate courses & earn rewards' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured tournaments */}
      <section className="flex-1 py-14 max-w-7xl mx-auto w-full px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              Upcoming Tournaments
            </h2>
            <p className="text-muted-foreground mt-1">Open for registration</p>
          </div>
          <Link
            href="/tournaments"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden sm:flex gap-1.5')}
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tournaments listed yet</p>
            <p className="text-sm mt-1">Check back soon or be the first to list one.</p>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/tournaments" className={buttonVariants({ variant: 'outline' })}>
            View all tournaments
          </Link>
        </div>
      </section>

      {/* CTA for managers */}
      <section className="bg-muted border-t border-border py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <MapPin className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
            Run a golf course?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 text-pretty">
            List your tournaments, manage registrations, upload course maps, accept payments, and track your full event history — all from one dashboard.
          </p>
          <Link
            href="/auth/sign-up?role=manager"
            className={cn(buttonVariants({ size: 'lg' }))}
          >
            Get started as a Course Manager
          </Link>
        </div>
      </section>

      <footer className="bg-sidebar text-sidebar-foreground/60 py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} TeeTime. All rights reserved.</p>
      </footer>
    </div>
  )
}
