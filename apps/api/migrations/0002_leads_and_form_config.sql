-- Persistent lead CRM and form-builder configuration.
-- The API uses the service role and still enforces project ownership before every write.

ALTER TABLE website_forms
  ADD COLUMN IF NOT EXISTS form_config jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS lead_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  form_id uuid REFERENCES website_forms(id) ON DELETE SET NULL,
  owner_email text NOT NULL,
  name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Negotiating', 'Won', 'Lost')),
  deal_value text,
  notes text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'website_form',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_records_project_created_idx
  ON lead_records(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lead_records_owner_email_idx
  ON lead_records(owner_email, created_at DESC);

ALTER TABLE lead_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_records_service_role_only ON lead_records;
CREATE POLICY lead_records_service_role_only
  ON lead_records
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION set_lead_records_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_records_updated_at ON lead_records;
CREATE TRIGGER lead_records_updated_at
  BEFORE UPDATE ON lead_records
  FOR EACH ROW EXECUTE FUNCTION set_lead_records_updated_at();
