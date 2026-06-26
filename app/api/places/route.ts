import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ results: [] })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    // Fallback: return empty so the manual input field shows
    return NextResponse.json({ results: [] })
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&type=golf_course&key=${apiKey}`
    )
    const data = await res.json()
    const results = (data.results ?? []).slice(0, 8).map((p: any) => ({
      place_id: p.place_id,
      name: p.name,
      vicinity: p.formatted_address ?? p.vicinity ?? '',
      rating: p.rating,
    }))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
