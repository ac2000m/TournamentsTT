'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckout as StripeEmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface EmbeddedCheckoutProps {
  tournamentId: string
  tournamentName: string
  entryFeeCents: number
  onClose: () => void
}

export function EmbeddedCheckout({ tournamentId, tournamentName, entryFeeCents, onClose }: EmbeddedCheckoutProps) {
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId }),
    })
    const data = await res.json()
    return data.clientSecret as string
  }, [tournamentId])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-heading font-semibold text-foreground">{tournamentName}</h3>
            <p className="text-sm text-muted-foreground">
              Entry fee: ${(entryFeeCents / 100).toFixed(2)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
            <span className="sr-only">Close checkout</span>
          </Button>
        </div>
        <div className="p-4">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <StripeEmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}
