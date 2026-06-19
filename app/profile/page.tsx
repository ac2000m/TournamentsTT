import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { ProfileClient } from '@/components/profile-client'
import type { Profile, Tournament, GolferBadge, Friendship, Registration } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // My registrations with tournament info
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, tournament:tournaments(*, course:courses(id,name,city,state))')
    .eq('golfer_id', user.id)
    .order('created_at', { ascending: false })

  // My badges
  const { data: golferBadges } = await supabase
    .from('golfer_badges')
    .select('*, badge:badges(*)')
    .eq('golfer_id', user.id)

  // Friends (accepted)
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*, profile:profiles!friendships_addressee_id_fkey(id,display_name,avatar_url,handicap)')
    .eq('requester_id', user.id)
    .eq('status', 'accepted')

  const { data: friendships2 } = await supabase
    .from('friendships')
    .select('*, profile:profiles!friendships_requester_id_fkey(id,display_name,avatar_url,handicap)')
    .eq('addressee_id', user.id)
    .eq('status', 'accepted')

  // Pending requests received
  const { data: pendingRequests } = await supabase
    .from('friendships')
    .select('*, profile:profiles!friendships_requester_id_fkey(id,display_name,avatar_url,handicap)')
    .eq('addressee_id', user.id)
    .eq('status', 'pending')

  const allFriends = [...(friendships ?? []), ...(friendships2 ?? [])]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar profile={profile as Profile} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <ProfileClient
          profile={profile as Profile}
          registrations={(registrations as any[]) ?? []}
          golferBadges={(golferBadges as GolferBadge[]) ?? []}
          friends={allFriends as any[]}
          pendingRequests={(pendingRequests as any[]) ?? []}
        />
      </main>
    </div>
  )
}
