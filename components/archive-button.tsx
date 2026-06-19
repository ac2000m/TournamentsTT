'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Archive, ArchiveRestore } from 'lucide-react'
import { toast } from 'sonner'

interface ArchiveButtonProps {
  tournamentId: string
  isArchived: boolean
}

export function ArchiveButton({ tournamentId, isArchived }: ArchiveButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleToggleArchive() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('tournaments')
      .update({
        is_archived: !isArchived,
        archived_at: !isArchived ? new Date().toISOString() : null,
        status: !isArchived ? 'archived' : 'completed',
      })
      .eq('id', tournamentId)
    setLoading(false)
    setOpen(false)
    if (error) { toast.error(error.message); return }
    toast.success(isArchived ? 'Tournament restored from archive' : 'Tournament archived')
    router.refresh()
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        {isArchived
          ? <><ArchiveRestore className="w-3.5 h-3.5" />Restore</>
          : <><Archive className="w-3.5 h-3.5" />Archive</>
        }
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArchived ? 'Restore Tournament' : 'Archive Tournament'}</DialogTitle>
            <DialogDescription>
              {isArchived
                ? 'This will restore the tournament and mark it as completed. You can re-publish it if needed.'
                : 'Archiving will hide this tournament from the public listing and mark it as archived. The full history and registrations are preserved.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleToggleArchive} disabled={loading} variant={isArchived ? 'default' : 'destructive'}>
              {loading ? 'Updating...' : isArchived ? 'Restore' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
