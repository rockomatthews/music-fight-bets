-- Migration 003: fighter core stats + daily attributes + record tracking

-- Core additions
alter table if exists public.mfb_fighters
  add column if not exists record_w int not null default 0;

alter table if exists public.mfb_fighters
  add column if not exists record_l int not null default 0;

alter table if exists public.mfb_fighters
  add column if not exists strengths jsonb not null default '[]'::jsonb;

alter table if exists public.mfb_fighters
  add column if not exists weaknesses jsonb not null default '[]'::jsonb;

alter table if exists public.mfb_fighters
  add column if not exists style_tags jsonb not null default '[]'::jsonb;

-- Daily table
create table if not exists public.mfb_fighter_daily (
  id bigserial primary key,
  fighter_id text not null references public.mfb_fighters(id) on delete cascade,
  day date not null,

  sleep_hours numeric(4,1),
  injury_pct numeric(5,2),
  morale numeric(5,4),
  camp_quality numeric(5,4),
  travel_fatigue numeric(5,4),

  -- derived-ish / bookkeeping
  days_since_last_fight int,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (fighter_id, day)
);

create index if not exists mfb_fighter_daily_day_idx on public.mfb_fighter_daily(day);
create index if not exists mfb_fighter_daily_fighter_day_idx on public.mfb_fighter_daily(fighter_id, day);
