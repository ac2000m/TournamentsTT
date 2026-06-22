import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tournamentId } = await req.json()
  if (!tournamentId) return NextResponse.json({ error: 'Missing tournamentId' }, { status: 400 })

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, entry_fee_cents, status, max_participants')
    .eq('id', tournamentId)
    .single()

  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
  if (tournament.status !== 'published') return NextResponse.json({ error: 'Tournament not open' }, { status: 400 })
  if (tournament.entry_fee_cents <= 0) return NextResponse.json({ error: 'No fee required' }, { status: 400 })

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'hosted',
    mode: 'payment',
    success_url: `${origin}/tournaments/${tournamentId}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
    cancel_url: `${origin}/tournaments/${tournamentId}?payment=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tournament.entry_fee_cents,
          product_data: { name: `${tournament.name} — Entry Fee` },
        },
      },
    ],
    metadata: { tournamentId, userId: user.id },
  })

  // Pre-create a pending registration
  await supabase.from('registrations').upsert({
    tournament_id: tournamentId,
    golfer_id: user.id,
    status: 'pending',
    stripe_session_id: session.id,
  }, { onConflict: 'tournament_id,golfer_id' })

  return NextResponse.json({ url: session.url })
}
