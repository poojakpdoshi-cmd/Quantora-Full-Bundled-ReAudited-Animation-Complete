-- ============================================================================
-- Syntropix AI Migration 015: Master Ecosystem Extension
-- Tables: project_pwa_builds, project_apk_builds, gsc_submissions, vision_scans, otp_audit_logs
-- ============================================================================

-- 1. Progressive Web App (PWA) Builds
create table if not exists project_pwa_builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  email text not null,
  app_name text not null,
  theme_color text not null default '#0284c7',
  background_color text not null default '#0f172a',
  manifest jsonb not null default '{}'::jsonb,
  service_worker_code text not null,
  html_meta_tags text not null,
  status text not null default 'ready' check (status in ('pending', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pwa_builds_project on project_pwa_builds (project_id);
create index if not exists idx_pwa_builds_email on project_pwa_builds (lower(email));
alter table project_pwa_builds enable row level security;

-- 2. Native Android APK Builds (Gradle Pipeline)
create table if not exists project_apk_builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  email text not null,
  app_name text not null,
  application_id text not null,
  version_code integer not null default 1,
  version_name text not null default '1.0.1',
  apk_file_name text not null,
  gradle_spec jsonb not null default '{}'::jsonb,
  download_url text,
  status text not null default 'completed' check (status in ('building', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_apk_builds_project on project_apk_builds (project_id);
create index if not exists idx_apk_builds_email on project_apk_builds (lower(email));
alter table project_apk_builds enable row level security;

-- 3. Google Search Console & SEO Submissions
create table if not exists gsc_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  email text not null,
  meta_verification_tag text not null,
  dns_txt_verification text not null,
  sitemap_url text not null default '/sitemap.xml',
  indexing_status text not null default 'submitted_to_googlebot',
  submitted_at timestamptz not null default now()
);

create index if not exists idx_gsc_submissions_project on gsc_submissions (project_id);
alter table gsc_submissions enable row level security;

-- 4. Multimodal Vision AI Scans
create table if not exists vision_scans (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  image_name text,
  image_url text,
  industry text not null,
  layout_architecture text not null,
  primary_color text not null,
  accent_color text not null,
  detected_sections jsonb not null default '[]'::jsonb,
  synthesized_prompt text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_vision_scans_email on vision_scans (lower(email));
alter table vision_scans enable row level security;

-- 5. Z++++++++ CSPRNG OTP Audit Logs
create table if not exists otp_audit_logs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  installation_id text not null,
  action text not null check (action in ('requested', 'verified', 'rejected_invalid', 'rejected_locked', 'rejected_expired')),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_audit_email on otp_audit_logs (lower(email));
create index if not exists idx_otp_audit_created_at on otp_audit_logs (created_at desc);
alter table otp_audit_logs enable row level security;
