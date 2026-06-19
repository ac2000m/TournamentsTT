import Link from 'next/link'
import { Calendar, MapPin, Users, DollarSign, Trophy } from 'lucide-react'
import { FormatBadge } from '@/components/format-badge'
import type { Tournament } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

interface TournamentCardProps {
  tournament: Tournament
  href?: string
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFee(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(0)}`
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-700',
  archived: 'bg-amber-100 text-amber-700',
}

export function TournamentCard({ tournament, href }: TournamentCardProps) {
  const link = href ?? `/tournaments/${tournament.id}`
  const spotsLeft =
    tournament.max_participants && tournament.registration_count !== undefined
      ? tournament.max_participants - (tournament.registration_count ?? 0)
      : null

  return (
    <Link
      href={link}
      className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 overflow-hidden">
        {tournament.cover_image_url ? (
          <img
            src={tournament.cover_image_url}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-primary/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <FormatBadge format={tournament.format} customLabel={tournament.format_custom} size="sm" />
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[tournament.status] ?? STATUS_STYLES.draft}`}>
            {STATUS_LABELS[tournament.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {tournament.name}
        </h3>
        {tournament.course && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{tournament.course.name}</span>
            {tournament.course.city && (
              <span className="text-muted-foreground/60">&bull; {tournament.course.city}</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span>{formatDate(tournament.start_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 shrink-0 text-accent/80" />
            <span className="font-medium text-foreground">{formatFee(tournament.entry_fee_cents)}</span>
          </div>
          {spotsLeft !== null && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 shrink-0 text-primary/60" />
              <span>
                {spotsLeft > 0 ? `${spotsLeft} spots left` : <span className="text-destructive font-medium">Full</span>}
              </span>
            </div>
          )}
          {tournament.prize_pool && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Trophy className="w-3.5 h-3.5 shrink-0 text-accent/80" />
              <span className="truncate">{tournament.prize_pool}</span>
            </div>
          )}
        </div>

        {tournament.user_registration && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Registered
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
