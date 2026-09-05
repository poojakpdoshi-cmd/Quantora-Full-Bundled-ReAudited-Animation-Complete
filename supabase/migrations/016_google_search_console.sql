-- Google Search Console OAuth state is short-lived, one-time, and never exposed to client storage.
create table if not exists public.search_console_oauth_states (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  installation_id text not null,
  project_id uuid not null,
  state_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.search_console_oauth_states
  add column if not exists project_id uuid;

create index if not exists idx_search_console_oauth_states_owner
  on public.search_console_oauth_states(owner_email, expires_at);

alter table public.search_console_oauth_states enable row level security;

comment on table public.search_console_oauth_states is
  'Short-lived server-only OAuth state for Google Search Console connections.';
