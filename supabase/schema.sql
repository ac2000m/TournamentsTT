-- TournamentsTT Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'golfer' check (role in ('golfer', 'manager')),
  display_name text,
  avatar_url text,
  handicap numeric(4,1),
  bio text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'golfer'),
    new.raw_user_meta_data->>'display_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table profiles enable row level security;
create policy "Profiles are public" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- ============================================================
-- COURSES
-- ============================================================
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  address text,
  city text,
  state text,
  country text not null default 'US',
  phone text,
  website text,
  logo_url text,
  map_images jsonb not null default '[]',
  holes int not null default 18,
  par int not null default 72,
  rating numeric(4,1),
  slope int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table courses enable row level security;
create policy "Courses are public" on courses for select using (true);
create policy "Managers can insert courses" on courses for insert with check (auth.uid() = manager_id);
create policy "Managers can update own courses" on courses for update using (auth.uid() = manager_id);
create policy "Managers can delete own courses" on courses for delete using (auth.uid() = manager_id);

-- ============================================================
-- TOURNAMENTS
-- ============================================================
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  manager_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  format text not null default 'stroke_play'
    check (format in ('stroke_play','match_play','scramble','best_ball','skins','stableford','other')),
  format_custom text,
  status text not null default 'draft'
    check (status in ('draft','published','active','completed','archived')),
  start_date timestamptz,
  end_date timestamptz,
  registration_deadline timestamptz,
  max_participants int,
  entry_fee_cents int not null default 0,
  stripe_price_id text,
  prize_pool text,
  rules text,
  is_archived boolean not null default false,
  archived_at timestamptz,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tournaments enable row level security;
create policy "Published tournaments are public" on tournaments for select using (
  status != 'draft' or manager_id = auth.uid()
);
create policy "Managers can insert tournaments" on tournaments for insert with check (auth.uid() = manager_id);
create policy "Managers can update own tournaments" on tournaments for update using (auth.uid() = manager_id);
create policy "Managers can delete own tournaments" on tournaments for delete using (auth.uid() = manager_id);

-- ============================================================
-- REGISTRATIONS
-- ============================================================
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  golfer_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled','waitlisted')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_paid_cents int not null default 0,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (tournament_id, golfer_id)
);

alter table registrations enable row level security;
create policy "Golfers can see own registrations" on registrations for select
  using (auth.uid() = golfer_id);
create policy "Managers can see registrations for own tournaments" on registrations for select
  using (
    exists (
      select 1 from tournaments t where t.id = tournament_id and t.manager_id = auth.uid()
    )
  );
create policy "Golfers can insert registrations" on registrations for insert
  with check (auth.uid() = golfer_id);
create policy "Golfers can update own registrations" on registrations for update
  using (auth.uid() = golfer_id);
create policy "Golfers can delete own registrations" on registrations for delete
  using (auth.uid() = golfer_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  tournament_id uuid references tournaments(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;
create policy "Reviews are public" on reviews for select using (true);
create policy "Authenticated users can insert reviews" on reviews for insert
  with check (auth.uid() = author_id);
create policy "Authors can delete own reviews" on reviews for delete
  using (auth.uid() = author_id);

-- ============================================================
-- BADGES
-- ============================================================
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text not null default 'award',
  color text not null default '#2d6a4f'
);

-- Seed default badges
insert into badges (slug, name, description, icon, color) values
  ('first-tee',    'First Tee',     'Registered for your first tournament',    'flag',   '#2d6a4f'),
  ('five-rounds',  'Five Rounds',   'Registered for 5 or more tournaments',    'trophy', '#d4a017'),
  ('reviewer',     'Course Critic', 'Left your first review',                  'star',   '#6366f1'),
  ('social-golfer','Social Golfer', 'Connected with 3 or more golf friends',   'users',  '#0ea5e9')
on conflict (slug) do nothing;

alter table badges enable row level security;
create policy "Badges are public" on badges for select using (true);

-- ============================================================
-- GOLFER BADGES (junction)
-- ============================================================
create table if not exists golfer_badges (
  id uuid primary key default gen_random_uuid(),
  golfer_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (golfer_id, badge_id)
);

alter table golfer_badges enable row level security;
create policy "Golfer badges are public" on golfer_badges for select using (true);
create policy "System can insert golfer badges" on golfer_badges for insert
  with check (auth.uid() = golfer_id);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

alter table friendships enable row level security;
create policy "Users can see own friendships" on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users can send friend requests" on friendships for insert
  with check (auth.uid() = requester_id);
create policy "Users can update friendship status" on friendships for update
  using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "Users can remove friendships" on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ============================================================
-- Storage buckets (run in Supabase dashboard Storage section)
-- ============================================================
-- Create a public bucket called "course-maps" for course map image uploads.
-- Or use Vercel Blob (already wired in /api/upload) which requires no setup here.
