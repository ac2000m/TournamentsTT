import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-3">Check your email</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          We sent a confirmation link to your email address. Click it to activate your account and get started.
        </p>
        <Button asChild variant="outline">
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </div>
    </div>
  )
}
