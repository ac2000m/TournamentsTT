'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/star-rating'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Review, Registration } from '@/lib/types'
import { toast } from 'sonner'
import { MessageSquare } from 'lucide-react'

interface ReviewSectionProps {
  tournamentId?: string
  courseId?: string
  reviews: Review[]
  avgRating: number
  userId: string | undefined
  userReg?: Registration | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function ReviewSection({ tournamentId, courseId, reviews, avgRating, userId, userReg }: ReviewSectionProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canReview = !!userId && (!!userReg || !!courseId)
  const userHasReviewed = reviews.some((r) => r.author_id === userId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a rating'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').insert({
      author_id: userId,
      ...(tournamentId ? { tournament_id: tournamentId } : {}),
      ...(courseId ? { course_id: courseId } : {}),
      rating,
      body: body.trim() || null,
    })
    setSubmitting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Review submitted!')
    setRating(0)
    setBody('')
    router.refresh()
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {avgRating > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <StarRating value={Math.round(avgRating)} readonly size="sm" />
            <span className="text-sm font-medium text-foreground">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Write a review */}
      {canReview && !userHasReviewed && (
        <form onSubmit={handleSubmit} className="bg-muted rounded-xl p-4 mb-6 flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Leave a review</p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            placeholder="Share your experience (optional)..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
          <Button type="submit" size="sm" disabled={submitting} className="self-start">
            {submitting ? 'Submitting...' : 'Submit review'}
          </Button>
        </form>
      )}

      {userHasReviewed && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-primary mb-6">
          You have already reviewed this.
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={r.profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {r.profile?.display_name?.slice(0, 2).toUpperCase() ?? 'G'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{r.profile?.display_name ?? 'Golfer'}</span>
                  <StarRating value={r.rating} readonly size="sm" />
                  <span className="text-xs text-muted-foreground ml-auto">{timeAgo(r.created_at)}</span>
                </div>
                {r.body && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
