export type UserRole = 'golfer' | 'manager'

export type TournamentFormat =
  | 'stroke_play'
  | 'match_play'
  | 'scramble'
  | 'best_ball'
  | 'skins'
  | 'stableford'
  | 'other'

export type TournamentStatus = 'draft' | 'published' | 'active' | 'completed' | 'archived'

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'waitlisted'

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked'

export interface Profile {
  // extended fields
  ghin_number?: string | null
  birdies18_username?: string | null
  onboarded?: boolean
  id: string
  role: UserRole
  display_name: string | null
  avatar_url: string | null
  handicap: number | null
  bio: string | null
  location: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  manager_id: string
  name: string
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  phone: string | null
  website: string | null
  logo_url: string | null
  map_images: MapImage[]
  holes: number
  par: number
  rating: number | null
  slope: number | null
  created_at: string
  updated_at: string
}

export interface MapImage {
  url: string
  label: string
}

export interface Tournament {
  id: string
  course_id: string
  manager_id: string
  name: string
  description: string | null
  format: TournamentFormat
  format_custom: string | null
  status: TournamentStatus
  start_date: string | null
  end_date: string | null
  registration_deadline: string | null
  max_participants: number | null
  entry_fee_cents: number
  stripe_price_id: string | null
  prize_pool: string | null
  rules: string | null
  is_archived: boolean
  archived_at: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
  course?: Course
  registration_count?: number
  user_registration?: Registration | null
}

export interface Registration {
  id: string
  tournament_id: string
  golfer_id: string
  status: RegistrationStatus
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  amount_paid_cents: number
  paid_at: string | null
  notes: string | null
  created_at: string
  profile?: Profile
}

export interface Review {
  id: string
  author_id: string
  course_id: string | null
  tournament_id: string | null
  rating: number
  body: string | null
  created_at: string
  profile?: Profile
}

export interface Badge {
  id: string
  slug: string
  name: string
  description: string | null
  icon: string
  color: string
}

export interface GolferBadge {
  id: string
  golfer_id: string
  badge_id: string
  awarded_at: string
  badge?: Badge
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  profile?: Profile
}

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  stroke_play: 'Stroke Play',
  match_play: 'Match Play',
  scramble: 'Scramble',
  best_ball: 'Best Ball',
  skins: 'Skins',
  stableford: 'Stableford',
  other: 'Custom Format',
}

export const FORMAT_DESCRIPTIONS: Record<TournamentFormat, string> = {
  stroke_play: 'Total strokes counted across all holes',
  match_play: 'Hole-by-hole competition between players',
  scramble: 'Team format — all play from the best shot',
  best_ball: 'Team format — lowest individual score per hole',
  skins: 'Hole-by-hole prize competition',
  stableford: 'Points-based scoring system',
  other: 'Custom or specialty format',
}

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Draft',
  published: 'Open for Registration',
  active: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
}
