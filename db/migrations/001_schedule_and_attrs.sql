-- Migration 001: scheduling + attribute-weighted resolution support

-- Fighters: attributes
alter table if exists public.mfb_fighters
  add column if not exists attrs jsonb not null default '{}'::jsonb;

-- Matches: scheduling + resolution metadata
alter table if exists public.mfb_matches
  add column if not exists opens_at timestamptz not null default now();

alter table if exists public.mfb_matches
  add column if not exists start_at timestamptz not null default now();

alter table if exists public.mfb_matches
  add column if not exists match_state jsonb not null default '{}'::jsonb;

alter table if exists public.mfb_matches
  add column if not exists resolved_meta jsonb;

create index if not exists mfb_matches_opens_at_idx on public.mfb_matches(opens_at);
create index if not exists mfb_matches_start_at_idx on public.mfb_matches(start_at);
