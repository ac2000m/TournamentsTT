import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...'

  let user = null
  let sessionError = null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    user = data.user?.email ?? null
    sessionError = error?.message ?? null
  } catch (e: any) {
    sessionError = e.message
  }

  return NextResponse.json({
    hasSupabaseUrl,
    hasSupabaseKey,
    supabaseUrl: hasSupabaseUrl ? supabaseUrl : 'MISSING',
    user,
    sessionError,
  })
}
