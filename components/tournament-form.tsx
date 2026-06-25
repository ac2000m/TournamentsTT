'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { Tournament, Course, TournamentFormat, TournamentStatus } from '@/lib/types'
import { FORMAT_LABELS } from '@/lib/types'
import { toast } from 'sonner'

interface TournamentFormProps {
  courses: Course[]
  tournament?: Tournament
  managerId: string
}

const FORMAT_OPTIONS = Object.entries(FORMAT_LABELS) as [TournamentFormat, string][]
const STATUS_OPTIONS: [TournamentStatus, string][] = [
  ['draft', 'Draft (hidden)'],
  ['published', 'Published (open for registration)'],
  ['active', 'Active (in progress)'],
  ['completed', 'Completed'],
]

export function TournamentForm({ courses, tournament, managerId }: TournamentFormProps) {
  const router = useRouter()
  const isEdit = !!tournament

  const [name, setName] = useState(tournament?.name ?? '')
  const [description, setDescription] = useState(tournament?.description ?? '')
  const [format, setFormat] = useState<TournamentFormat>(tournament?.format ?? 'stroke_play')
  const [formatCustom, setFormatCustom] = useState(tournament?.format_custom ?? '')
  const [status, setStatus] = useState<TournamentStatus>(tournament?.status ?? 'draft')
  const [courseId, setCourseId] = useState(tournament?.course_id ?? (courses[0]?.id ?? ''))
  const [startDate, setStartDate] = useState(tournament?.start_date ? tournament.start_date.split('T')[0] : '')
  const [endDate, setEndDate] = useState(tournament?.end_date ? tournament.end_date.split('T')[0] : '')
  const [regDeadline, setRegDeadline] = useState(tournament?.registration_deadline ? tournament.registration_deadline.split('T')[0] : '')
  const [maxParticipants, setMaxParticipants] = useState(tournament?.max_participants?.toString() ?? '')
  const [entryFee, setEntryFee] = useState(tournament ? (tournament.entry_fee_cents / 100).toString() : '0')
  const [prizePool, setPrizePool] = useState(tournament?.prize_pool ?? '')
  const [rules, setRules] = useState(tournament?.rules ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(tournament?.cover_image_url ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId) { toast.error('Please select a course'); return }
    setSaving(true)
    const supabase = createClient()

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      format,
      format_custom: format === 'other' ? (formatCustom.trim() || null) : null,
      status,
      course_id: courseId,
      manager_id: managerId,
      start_date: startDate || null,
      end_date: endDate || null,
      registration_deadline: regDeadline || null,
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      entry_fee_cents: Math.round(parseFloat(entryFee || '0') * 100),
      prize_pool: prizePool.trim() || null,
      rules: rules.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (isEdit) {
      result = await supabase.from('tournaments').update(payload).eq('id', tournament.id).select().single()
    } else {
      result = await supabase.from('tournaments').insert(payload).select().single()
    }

    setSaving(false)
    if (result.error) { toast.error(result.error.message); return }
    toast.success(isEdit ? 'Tournament updated!' : 'Tournament created!')
    router.push(`/dashboard/tournaments/${result.data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic info */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="name">Tournament Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Summer Scramble Classic" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Course *</Label>
            <Select value={courseId} onValueChange={(v) => setCourseId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TournamentStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the tournament, what to expect, etc." rows={3} className="resize-none" />
          </div>
        </div>
      </div>

      {/* Format */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5">Format</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Tournament Format *</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as TournamentFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {format === 'other' && (
            <div className="flex flex-col gap-1.5">
              <Label>Custom Format Name *</Label>
              <Input value={formatCustom} onChange={(e) => setFormatCustom(e.target.value)} placeholder="e.g. Wolf, Bingo Bango Bongo..." required={format === 'other'} />
            </div>
          )}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Rules & Format Details</Label>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Explain the scoring, tee times, equipment rules, etc." rows={4} className="resize-none" />
          </div>
        </div>
      </div>

      {/* Dates & Registration */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5">Dates & Registration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="regDeadline">Registration Deadline</Label>
            <Input id="regDeadline" type="date" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Input id="maxParticipants" type="number" min="1" placeholder="Leave blank for unlimited" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entryFee">Entry Fee (USD)</Label>
            <Input id="entryFee" type="number" min="0" step="0.01" placeholder="0 for free" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prizePool">Prize Pool Description</Label>
            <Input id="prizePool" placeholder="e.g. $500 total, trophies, etc." value={prizePool} onChange={(e) => setPrizePool(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5">Cover Image</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coverUrl">Image URL</Label>
          <Input id="coverUrl" type="url" placeholder="https://..." value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
        </div>
        {coverImageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden h-36">
            <img src={coverImageUrl} alt="Cover preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Tournament' : 'Create Tournament'}
        </Button>
      </div>
    </form>
  )
}
