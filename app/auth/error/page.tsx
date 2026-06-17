import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="font-heading text-3xl font-bold mb-3">Authentication error</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Something went wrong during sign in. The link may have expired. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/auth/login">Back to login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/sign-up">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
