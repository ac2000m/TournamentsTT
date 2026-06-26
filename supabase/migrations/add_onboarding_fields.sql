-- Run this in Supabase SQL Editor AFTER running schema.sql
alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists ghin_number text,
  add column if not exists birdies18_username text,
  add column if not exists onboarded boolean not null default false;
