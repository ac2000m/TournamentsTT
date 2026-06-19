'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Course, MapImage } from '@/lib/types'
import { toast } from 'sonner'
import { Upload, X, MapPin, Loader2 } from 'lucide-react'

interface CourseFormProps {
  managerId: string
  course?: Course
}

export function CourseForm({ managerId, course }: CourseFormProps) {
  const router = useRouter()
  const isEdit = !!course
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(course?.name ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [address, setAddress] = useState(course?.address ?? '')
  const [city, setCity] = useState(course?.city ?? '')
  const [state, setState] = useState(course?.state ?? '')
  const [phone, setPhone] = useState(course?.phone ?? '')
  const [website, setWebsite] = useState(course?.website ?? '')
  const [holes, setHoles] = useState(course?.holes?.toString() ?? '18')
  const [par, setPar] = useState(course?.par?.toString() ?? '72')
  const [rating, setRating] = useState(course?.rating?.toString() ?? '')
  const [slope, setSlope] = useState(course?.slope?.toString() ?? '')
  const [mapImages, setMapImages] = useState<MapImage[]>(course?.map_images ?? [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mapLabel, setMapLabel] = useState('')

  async function handleMapUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMapImages((prev) => [...prev, { url: data.url, label: mapLabel.trim() || `Map ${prev.length + 1}` }])
      setMapLabel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    }
    setUploading(false)
  }

  function removeMapImage(index: number) {
    setMapImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const payload = {
      manager_id: managerId,
      name: name.trim(),
      description: description.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      phone: phone.trim() || null,
      website: website.trim() || null,
      holes: parseInt(holes) || 18,
      par: parseInt(par) || 72,
      rating: rating ? parseFloat(rating) : null,
      slope: slope ? parseInt(slope) : null,
      map_images: mapImages,
      updated_at: new Date().toISOString(),
    }

    let result
    if (isEdit) {
      result = await supabase.from('courses').update(payload).eq('id', course.id).select().single()
    } else {
      result = await supabase.from('courses').insert(payload).select().single()
    }
    setSaving(false)
    if (result.error) { toast.error(result.error.message); return }
    toast.success(isEdit ? 'Course updated!' : 'Course created!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic info */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5">Course Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="courseName">Course Name *</Label>
            <Input id="courseName" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Pine Valley Golf Club" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell golfers about your course..." rows={3} className="resize-none" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Street Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Fairway Drive" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Scottsdale" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>State</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="AZ" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Website</Label>
            <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcourse.com" />
          </div>
        </div>
      </div>

      {/* Course specs */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-5">Course Specs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Holes</Label>
            <Input type="number" value={holes} onChange={(e) => setHoles(e.target.value)} min="1" max="36" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Par</Label>
            <Input type="number" value={par} onChange={(e) => setPar(e.target.value)} min="54" max="90" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Course Rating</Label>
            <Input type="number" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="72.4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Slope</Label>
            <Input type="number" value={slope} onChange={(e) => setSlope(e.target.value)} placeholder="130" />
          </div>
        </div>
      </div>

      {/* Course maps */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-1">Course Maps</h2>
        <p className="text-sm text-muted-foreground mb-5">Upload hole maps, course overviews, or yardage charts</p>

        {/* Upload area */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Map label (optional — e.g. Front 9)"
            value={mapLabel}
            onChange={(e) => setMapLabel(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleMapUpload}
          />
        </div>

        {mapImages.length === 0 ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Click to upload course maps</p>
            <p className="text-xs mt-1">PNG, JPG, WebP supported</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mapImages.map((img, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                <img src={img.url} alt={img.label} className="w-full h-36 object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex items-center justify-between">
                  <span className="text-white text-xs font-medium truncate">{img.label}</span>
                  <button
                    type="button"
                    onClick={() => removeMapImage(i)}
                    className="text-white/70 hover:text-white ml-2 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div
              className="border-2 border-dashed border-border rounded-xl h-36 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 mb-1 opacity-50" />
              <span className="text-xs">Add another</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  )
}
