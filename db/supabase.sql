-- Music Fight Bets: Supabase schema (MVP)
-- Notes:
-- - session_id is the current anonymous identifier (like Mint Machine). Later you can link wallet addresses.
-- - Store only what you need; keep video jobs separate.

create table if not exists public.mfb_fighters (
  id text primary key,
  stage_name text not null,
  archetype text not null,
  genre text not null,
  palette jsonb not null default '[]'::jsonb,
  signature_moves jsonb not null default '[]'::jsonb,
  prompt_style text,
  created_at timestamptz not null default now()
);

create table if not exists public.mfb_matches (
  id text primary key,
  chain_id int not null,
  contract_address text not null,
  match_index bigint not null,

  fighter_a_id text not null references public.mfb_fighters(id),
  fighter_b_id text not null references public.mfb_fighters(id),

  status text not null default 'open', -- open | closed | resolved
  close_at timestamptz not null,

  resolved_winner text, -- 'A' | 'B'
  resolved_tx text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mfb_matches_status_idx on public.mfb_matches(status);
create index if not exists mfb_matches_close_at_idx on public.mfb_matches(close_at);

create table if not exists public.mfb_bets (
  id bigserial primary key,
  match_id text not null references public.mfb_matches(id) on delete cascade,
  session_id text,
  wallet text,
  side text not null, -- 'A' | 'B'
  amount_usdc numeric(38, 6) not null,
  tx_hash text,
  created_at timestamptz not null default now()
);

create index if not exists mfb_bets_match_idx on public.mfb_bets(match_id);

create table if not exists public.mfb_renders (
  id bigserial primary key,
  match_id text not null references public.mfb_matches(id) on delete cascade,
  provider text not null default 'openai',
  video_id text,
  status text not null default 'queued', -- queued | in_progress | completed | failed
  prompt text,
  video_url text,
  thumbnail_url text,
  spritesheet_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mfb_renders_match_idx on public.mfb_renders(match_id);
