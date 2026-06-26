-- Run this in Supabase SQL Editor
alter table profiles
  add column if not exists ghin_number text,
  add column if not exists birdies18_username text,
  add column if not exists onboarded boolean not null default false;
