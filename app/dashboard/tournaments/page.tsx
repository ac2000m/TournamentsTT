import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FormatBadge } from '@/components/format-badge'
import type { Tournament } from '@/lib/types'
import { PlusCircle, Trophy, Archive, Users } from 'lucide-react'

export default async function DashboardTournamentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, course:courses(id,name,city,state)')
    .eq('manager_id', user!.id)
    .order('created_at', { ascending: false })

  const all = (tournaments as Tournament[]) ?? []
  const active = all.filter((t) => !t.is_archived)
  const archived = all.filter((t) => t.is_archived)

  const ids = all.map((t) => t.id)
  const regMap: Record<string, number> = {}
  if (ids.length > 0) {
    const { data: regs } = await supabase
      .from('registrations')
      .select('tournament_id')
      .in('tournament_id', ids)
      .eq('status', 'confirmed')
    regs?.forEach((r) => { regMap[r.tournament_id] = (regMap[r.tournament_id] ?? 0) + 1 })
  }

  function TournamentRow({ t }: { t: Tournament }) {
    const regs = regMap[t.id] ?? 0
    return (
      <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div className="font-medium text-foreground">{t.name}</div>
          {t.course && <div className="text-xs text-muted-foreground">{t.course.name}</div>}
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <FormatBadge format={t.format} customLabel={t.format_custom} size="sm" />
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          {t.start_date
            ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—'}
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-3.5 h-3.5" />{regs}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            t.status === 'published' ? 'bg-green-100 text-green-700' :
            t.status === 'active' ? 'bg-blue-100 text-blue-700' :
            t.status === 'completed' ? 'bg-gray-100 text-gray-600' :
            t.status === 'archived' ? 'bg-amber-100 text-amber-700' :
            'bg-muted text-muted-foreground'
          }`}>
            {t.status === 'published' ? 'Open' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <Link
            href={`/dashboard/tournaments/${t.id}`}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Manage
          </Link>
        </td>
      </tr>
    )
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">My Tournaments</h1>
          <p className="text-muted-foreground mt-1">{active.length} active &bull; {archived.length} archived</p>
        </div>
        <Link href="/dashboard/tournaments/new" className={cn(buttonVariants(), 'gap-1.5')}>
          <PlusCircle className="w-4 h-4" />New Tournament
        </Link>
      </div>

      {/* Active tournaments */}
      <section className="mb-10">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />Active Events ({active.length})
        </h2>
        {active.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No active tournaments</p>
            <Link href="/dashboard/tournaments/new" className={cn(buttonVariants({ size: 'sm' }), 'mt-4')}>
              Create your first tournament
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tournament</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Format</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Registrations</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((t) => <TournamentRow key={t.id} t={t} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Archived tournaments */}
      {archived.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Archive className="w-4 h-4 text-muted-foreground" />Archived Events ({archived.length})
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden opacity-80">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tournament</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Format</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Registrations</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map((t) => <TournamentRow key={t.id} t={t} />)}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
