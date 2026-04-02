-- Migration 002: fighter avatars

alter table if exists public.mfb_fighters
  add column if not exists avatar_url text;

create index if not exists mfb_fighters_avatar_idx on public.mfb_fighters((avatar_url));
