import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { tournamentId, userId } = session.metadata ?? {}
    if (tournamentId && userId) {
      const supabase = await createClient()
      await supabase
        .from('registrations')
        .update({
          status: 'confirmed',
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid_cents: session.amount_total ?? 0,
          paid_at: new Date().toISOString(),
        })
        .eq('tournament_id', tournamentId)
        .eq('golfer_id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
