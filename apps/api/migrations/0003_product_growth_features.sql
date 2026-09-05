-- Payment-free commerce and growth feature storage.
-- All API access uses service-role Supabase with project ownership checks.

CREATE TABLE IF NOT EXISTS commerce_catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  owner_email text NOT NULL,
  merchant_whatsapp text NOT NULL DEFAULT '',
  currency_symbol text NOT NULL DEFAULT '$',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES commerce_catalogs(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'closed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_enquiries_project_created_idx ON order_enquiries(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS booking_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  owner_email text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 5 AND 480),
  availability jsonb NOT NULL DEFAULT '{"monday":["09:00-17:00"],"tuesday":["09:00-17:00"],"wednesday":["09:00-17:00"],"thursday":["09:00-17:00"],"friday":["09:00-17:00"]}'::jsonb,
  calendar_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'declined', 'cancelled')),
  calendar_event_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_requests_project_start_idx ON booking_requests(project_id, starts_at);

CREATE TABLE IF NOT EXISTS project_feature_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  feature_key text NOT NULL CHECK (feature_key IN ('chatbot', 'localization', 'pwa', 'social', 'cro', 'spatial')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, feature_key)
);

CREATE TABLE IF NOT EXISTS growth_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_email text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  minimum_observations integer NOT NULL DEFAULT 100 CHECK (minimum_observations BETWEEN 20 AND 1000000),
  winner_variant text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS growth_experiments_project_idx ON growth_experiments(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_experiment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES growth_experiments(id) ON DELETE CASCADE,
  variant_key text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('assignment', 'conversion')),
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS growth_experiment_events_lookup_idx ON growth_experiment_events(experiment_id, variant_key, event_type);

ALTER TABLE commerce_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_feature_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_experiment_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['commerce_catalogs','order_enquiries','booking_configs','booking_requests','project_feature_configs','growth_experiments','growth_experiment_events'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_service_role_only ON %I', table_name, table_name);
    EXECUTE format('CREATE POLICY %I_service_role_only ON %I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', table_name, table_name);
  END LOOP;
END $$;
