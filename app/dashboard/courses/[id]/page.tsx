import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseForm } from '@/components/course-form'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import type { Course } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ManageCoursePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('manager_id', user!.id)
    .single()

  if (!course) notFound()

  return (
    <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">{course.name}</h1>
          <p className="text-muted-foreground mt-0.5">Edit course details and manage maps</p>
        </div>
      </div>
      <CourseForm managerId={user!.id} course={course as Course} />
    </main>
  )
}
