import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BADGE_RULES = [
  {
    slug: 'first-tee',
    check: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('golfer_id', userId)
        .eq('status', 'confirmed')
      return (count ?? 0) >= 1
    },
  },
  {
    slug: 'five-rounds',
    check: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('golfer_id', userId)
        .eq('status', 'confirmed')
      return (count ?? 0) >= 5
    },
  },
  {
    slug: 'reviewer',
    check: async (supabase: any, userId: string) => {
      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId)
      return (count ?? 0) >= 1
    },
  },
  {
    slug: 'social-golfer',
    check: async (supabase: any, userId: string) => {
      const { count: c1 } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', userId)
        .eq('status', 'accepted')
      const { count: c2 } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', userId)
        .eq('status', 'accepted')
      return ((c1 ?? 0) + (c2 ?? 0)) >= 3
    },
  },
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: allBadges } = await supabase.from('badges').select('id, slug')
  if (!allBadges) return NextResponse.json({ awarded: [] })

  const { data: existingBadges } = await supabase
    .from('golfer_badges')
    .select('badge_id')
    .eq('golfer_id', user.id)
  const awardedBadgeIds = new Set((existingBadges ?? []).map((b: any) => b.badge_id))

  const newlyAwarded: string[] = []

  for (const rule of BADGE_RULES) {
    const badge = allBadges.find((b: any) => b.slug === rule.slug)
    if (!badge) continue
    if (awardedBadgeIds.has(badge.id)) continue

    const qualifies = await rule.check(supabase, user.id)
    if (qualifies) {
      const { error } = await supabase.from('golfer_badges').insert({
        golfer_id: user.id,
        badge_id: badge.id,
        awarded_at: new Date().toISOString(),
      })
      if (!error) newlyAwarded.push(rule.slug)
    }
  }

  return NextResponse.json({ awarded: newlyAwarded })
}
