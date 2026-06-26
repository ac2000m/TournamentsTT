import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarded, display_name')
        .eq('id', data.user.id)
        .single()

      const destination = (!profile?.onboarded && !profile?.display_name)
        ? '/onboarding'
        : next

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
