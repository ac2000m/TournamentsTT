import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TournamentForm } from '@/components/tournament-form'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export default async function NewTournamentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('manager_id', user!.id)

  if (!courses || courses.length === 0) {
    redirect('/dashboard/courses/new?from=tournament')
  }

  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/tournaments" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">New Tournament</h1>
          <p className="text-muted-foreground mt-0.5">Fill in the details and publish when ready</p>
        </div>
      </div>
      <TournamentForm courses={courses as any[]} managerId={user!.id} />
    </main>
  )
}
