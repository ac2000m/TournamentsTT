import { Badge } from '@/components/ui/badge'
import type { TournamentFormat } from '@/lib/types'
import { FORMAT_LABELS } from '@/lib/types'

const FORMAT_COLORS: Record<TournamentFormat, string> = {
  stroke_play: 'bg-blue-100 text-blue-800 border-blue-200',
  match_play: 'bg-purple-100 text-purple-800 border-purple-200',
  scramble: 'bg-orange-100 text-orange-800 border-orange-200',
  best_ball: 'bg-teal-100 text-teal-800 border-teal-200',
  skins: 'bg-rose-100 text-rose-800 border-rose-200',
  stableford: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  other: 'bg-muted text-muted-foreground border-border',
}

interface FormatBadgeProps {
  format: TournamentFormat
  customLabel?: string | null
  size?: 'sm' | 'default'
}

export function FormatBadge({ format, customLabel, size = 'default' }: FormatBadgeProps) {
  const label = format === 'other' && customLabel ? customLabel : FORMAT_LABELS[format]
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${FORMAT_COLORS[format]} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      {label}
    </span>
  )
}
