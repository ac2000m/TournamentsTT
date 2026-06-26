'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Globe, Play, CheckCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { TournamentStatus } from '@/lib/types'

interface StatusButtonProps {
  tournamentId: string
  currentStatus: TournamentStatus
}

const STATUS_OPTIONS: { value: TournamentStatus; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'draft', label: 'Draft', icon: FileText, description: 'Hidden from public' },
  { value: 'published', label: 'Open', icon: Globe, description: 'Accepting registrations' },
  { value: 'active', label: 'In Progress', icon: Play, description: 'Tournament underway' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, description: 'Event finished' },
]

const STATUS_COLORS: Record<TournamentStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-green-100 text-green-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-600',
  archived: 'bg-amber-100 text-amber-700',
}

export function StatusButton({ tournamentId, currentStatus }: StatusButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const current = STATUS_OPTIONS.find((s) => s.value === currentStatus)

  async function updateStatus(newStatus: TournamentStatus) {
    if (newStatus === currentStatus) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('tournaments')
      .update({ status: newStatus })
      .eq('id', tournamentId)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Tournament marked as ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`)
    router.refresh()
  }

  if (currentStatus === 'archived') {
    return (
      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
        Archived
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={loading}
          type="button"
        >
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[currentStatus]}`}>
            {current?.label ?? currentStatus}
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Change status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {STATUS_OPTIONS.map(({ value, label, icon: Icon, description }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => updateStatus(value)}
            className={`cursor-pointer gap-2 ${value === currentStatus ? 'bg-muted/60' : ''}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <div>
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
