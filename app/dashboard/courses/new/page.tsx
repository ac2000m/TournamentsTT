import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseForm } from '@/components/course-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function NewCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Add Course</h1>
          <p className="text-muted-foreground mt-0.5">Set up your course profile and upload maps</p>
        </div>
      </div>
      <CourseForm managerId={user!.id} />
    </main>
  )
}
