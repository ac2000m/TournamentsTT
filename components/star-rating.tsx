'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'default' | 'lg'
}

const SIZE_MAP = { sm: 'w-3.5 h-3.5', default: 'w-5 h-5', lg: 'w-6 h-6' }

export function StarRating({ value, onChange, readonly = false, size = 'default' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const iconSize = SIZE_MAP[size]

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered || value) >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
            aria-label={`${star} star`}
          >
            <Star
              className={`${iconSize} transition-colors ${
                filled ? 'fill-accent text-accent' : 'fill-transparent text-muted-foreground/40'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
