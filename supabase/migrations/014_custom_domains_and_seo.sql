-- Nexora.Ai Migration 014: Production Custom Domains & Advanced SEO
-- Project-isolated custom domains, DNS verification state, and SSL status.

create table if not exists project_domains (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references projects(id)
    on delete cascade,

  owner_email text not null,

  domain text not null
    check (
      char_length(domain) between 4 and 253
      and domain ~* '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$'
    ),

  is_primary boolean not null default false,

  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'active', 'failed')),

  verification_token text not null,

  dns_records jsonb not null default '[]'::jsonb,

  ssl_status text not null default 'pending'
    check (ssl_status in ('pending', 'active', 'error')),

  error_message text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_project_domains_unique_project_domain
  on project_domains (project_id, lower(domain));

create index if not exists idx_project_domains_owner_email
  on project_domains (lower(owner_email));

create index if not exists idx_project_domains_lookup
  on project_domains (lower(domain));

alter table project_domains enable row level security;

-- Accessed only by Cloudflare Worker through Supabase service-role connection.
