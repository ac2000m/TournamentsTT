import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TournamentForm } from '@/components/tournament-form'
import { ArchiveButton } from '@/components/archive-button'
import { FormatBadge } from '@/components/format-badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Tournament, Registration } from '@/lib/types'
import { ArrowLeft, Users, DollarSign, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ManageTournamentPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, course:courses(*)')
    .eq('id', id)
    .eq('manager_id', user!.id)
    .single()

  if (!tournament) notFound()

  const t = tournament as Tournament

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('manager_id', user!.id)

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, profile:profiles(id,display_name,avatar_url,handicap,location)')
    .eq('tournament_id', id)
    .order('created_at', { ascending: true })

  const regs = (registrations as Registration[]) ?? []
  const confirmed = regs.filter((r) => r.status === 'confirmed')
  const pending = regs.filter((r) => r.status === 'pending')
  const totalRevenue = confirmed.reduce((sum, r) => sum + (r.amount_paid_cents ?? 0), 0)

  return (
    <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/tournaments"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold text-foreground truncate">{t.name}</h1>
            <FormatBadge format={t.format} customLabel={t.format_custom} size="sm" />
            {t.is_archived && (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Archived</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/tournaments/${t.id}`} target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />View
            </Link>
          </Button>
          <ArchiveButton tournamentId={t.id} isArchived={t.is_archived} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 my-6">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="font-heading text-2xl font-bold text-foreground">{confirmed.length}</div>
          <div className="text-xs text-muted-foreground">Confirmed</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="font-heading text-2xl font-bold text-foreground">{pending.length}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="font-heading text-2xl font-bold text-primary">${(totalRevenue / 100).toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Revenue</div>
        </div>
      </div>

      <Tabs defaultValue="registrations">
        <TabsList className="mb-6">
          <TabsTrigger value="registrations" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />Registrations ({regs.length})
          </TabsTrigger>
          <TabsTrigger value="edit">Edit Details</TabsTrigger>
        </TabsList>

        {/* Registrations */}
        <TabsContent value="registrations">
          {regs.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No registrations yet</p>
              <p className="text-sm mt-1">Share the event link to get golfers signing up</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Golfer</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Registered</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regs.map((reg) => (
                      <tr key={reg.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={(reg as any).profile?.avatar_url} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(reg as any).profile?.display_name?.slice(0, 2).toUpperCase() ?? 'G'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{(reg as any).profile?.display_name ?? 'Golfer'}</div>
                              {(reg as any).profile?.handicap && (
                                <div className="text-xs text-muted-foreground">HCP {(reg as any).profile.handicap}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            reg.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            reg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            reg.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {reg.status === 'confirmed' && <CheckCircle className="w-3 h-3" />}
                            {reg.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                          {reg.amount_paid_cents > 0 ? `$${(reg.amount_paid_cents / 100).toFixed(0)}` : <span className="text-muted-foreground/50">Free</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Edit */}
        <TabsContent value="edit">
          <TournamentForm courses={courses as any[]} tournament={t} managerId={user!.id} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
