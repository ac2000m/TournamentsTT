import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { TournamentCard } from '@/components/tournament-card'
import type { Profile, Tournament, TournamentFormat } from '@/lib/types'
import { FORMAT_LABELS } from '@/lib/types'
import { TournamentFilters } from '@/components/tournament-filters'
import { Trophy } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    format?: string
    status?: string
    q?: string
  }>
}

export default async function TournamentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  let query = supabase
    .from('tournaments')
    .select('*, course:courses(id,name,city,state)')
    .eq('is_archived', false)
    .order('start_date', { ascending: true })

  if (params.format && params.format !== 'all') {
    query = query.eq('format', params.format)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  } else {
    query = query.in('status', ['published', 'active', 'completed'])
  }
  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }

  const { data } = await query.limit(50)
  const tournaments = (data as Tournament[]) ?? []

  // If logged in, fetch user registrations to mark registered tournaments
  let myRegistrationIds: Set<string> = new Set()
  if (user) {
    const { data: regs } = await supabase
      .from('registrations')
      .select('tournament_id')
      .eq('golfer_id', user.id)
    regs?.forEach((r) => myRegistrationIds.add(r.tournament_id))
  }

  const enriched = tournaments.map((t) => ({
    ...t,
    user_registration: myRegistrationIds.has(t.id) ? ({ id: 'registered' } as any) : null,
  }))

  const activeFormat = (params.format as TournamentFormat) || 'all'
  const activeStatus = params.status || 'all'
  const activeQ = params.q || ''

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar profile={profile} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Find Tournaments</h1>
          <p className="text-muted-foreground mt-1">Browse open events by format, date, and location</p>
        </div>

        <TournamentFilters
          activeFormat={activeFormat}
          activeStatus={activeStatus}
          activeQ={activeQ}
        />

        {enriched.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{enriched.length} tournament{enriched.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {enriched.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-lg">No tournaments found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  )
}
