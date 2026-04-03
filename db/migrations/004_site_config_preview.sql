-- Migration 004: site config (pin a preview video)

create table if not exists public.mfb_site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
