import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trophy, Users, DollarSign, PlusCircle, MapPin, Archive } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from('courses')
    .select('id,name,city,state')
    .eq('manager_id', user!.id)

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id,name,status,entry_fee_cents,is_archived,start_date')
    .eq('manager_id', user!.id)
    .order('created_at', { ascending: false })

  const activeTournaments = (tournaments ?? []).filter((t) => !t.is_archived && t.status !== 'archived')
  const archivedTournaments = (tournaments ?? []).filter((t) => t.is_archived || t.status === 'archived')

  const tournamentIds = (tournaments ?? []).map((t) => t.id)
  let totalRegs = 0
  let totalRevenueCents = 0
  if (tournamentIds.length > 0) {
    const { data: regs } = await supabase
      .from('registrations')
      .select('amount_paid_cents,status')
      .in('tournament_id', tournamentIds)
    totalRegs = (regs ?? []).filter((r) => r.status === 'confirmed').length
    totalRevenueCents = (regs ?? [])
      .filter((r) => r.status === 'confirmed')
      .reduce((sum, r) => sum + (r.amount_paid_cents ?? 0), 0)
  }

  const stats = [
    { label: 'Active Events', value: activeTournaments.length, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Registrations', value: totalRegs, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Revenue', value: `$${(totalRevenueCents / 100).toLocaleString()}`, icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Archived Events', value: archivedTournaments.length, icon: Archive, color: 'text-muted-foreground', bg: 'bg-muted' },
  ]

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and tournaments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/courses/new" className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}>
            <MapPin className="w-4 h-4" />New Course
          </Link>
          <Link href="/dashboard/tournaments/new" className={cn(buttonVariants(), 'gap-1.5')}>
            <PlusCircle className="w-4 h-4" />New Tournament
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="font-heading text-2xl font-bold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Courses */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-foreground">Your Courses</h2>
          <Link href="/dashboard/courses/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Add Course
          </Link>
        </div>
        {!courses || courses.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No courses yet</p>
            <p className="text-sm mt-1 mb-4">Add your course to start listing tournaments</p>
            <Link href="/dashboard/courses/new" className={buttonVariants({ size: 'sm' })}>
              Add your first course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{course.name}</div>
                    {course.city && (
                      <div className="text-xs text-muted-foreground">{course.city}, {course.state}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent tournaments */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-foreground">Active Events</h2>
          <Link href="/dashboard/tournaments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View all
          </Link>
        </div>
        {activeTournaments.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No active tournaments</p>
            <p className="text-sm mt-1 mb-4">Create your first tournament to start accepting registrations</p>
            <Link href="/dashboard/tournaments/new" className={buttonVariants({ size: 'sm' })}>
              Create tournament
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {activeTournaments.slice(0, 8).map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {t.start_date ? new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.status === 'published' ? 'bg-green-100 text-green-700' :
                        t.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        t.status === 'completed' ? 'bg-gray-100 text-gray-600' :
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
