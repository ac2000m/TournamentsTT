'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { FORMAT_LABELS, type TournamentFormat } from '@/lib/types'
import { Search, X } from 'lucide-react'

const FORMATS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Formats' },
  ...Object.entries(FORMAT_LABELS).map(([value, label]) => ({ value, label })),
]

const STATUSES = [
  { value: 'all', label: 'All Events' },
  { value: 'published', label: 'Open for Registration' },
  { value: 'active', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

interface TournamentFiltersProps {
  activeFormat: string
  activeStatus: string
  activeQ: string
}

export function TournamentFilters({ activeFormat, activeStatus, activeQ }: TournamentFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams()
      if (key !== 'format' && activeFormat !== 'all') params.set('format', activeFormat)
      if (key !== 'status' && activeStatus !== 'all') params.set('status', activeStatus)
      if (key !== 'q' && activeQ) params.set('q', activeQ)
      if (value && value !== 'all') params.set(key, value)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, activeFormat, activeStatus, activeQ]
  )

  return (
    <div className="mb-6 flex flex-col gap-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search tournaments..."
          defaultValue={activeQ}
          className="pl-9 pr-8"
          onChange={(e) => {
            const val = e.target.value
            clearTimeout((window as any).__teeSearchTimeout)
            ;(window as any).__teeSearchTimeout = setTimeout(() => updateParam('q', val), 400)
          }}
        />
        {activeQ && (
          <button
            onClick={() => updateParam('q', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Format chips */}
      <div className="flex flex-wrap gap-2">
        {FORMATS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => updateParam('format', value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeFormat === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => updateParam('status', value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeStatus === value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
