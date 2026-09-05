-- ============================================================================
-- Migration: 0002_cms_tables.sql
-- Description: Quantora CMS & AI-CMS content model, revisions, and media tables.
-- ============================================================================

-- 1. CMS DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS cms_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  collection text NOT NULL CHECK (collection IN ('pages', 'products', 'blog', 'services', 'testimonials', 'faqs', 'navigation', 'settings')),
  slug text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected', 'archived')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  author_id text,
  published_at timestamptz,
  scheduled_publish_at timestamptz,
  scheduled_unpublish_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cms_project_collection_slug UNIQUE (project_id, collection, slug)
);

CREATE INDEX IF NOT EXISTS idx_cms_documents_project_collection ON cms_documents (project_id, collection);
CREATE INDEX IF NOT EXISTS idx_cms_documents_status ON cms_documents (status);

-- 2. CMS REVISIONS TABLE (For recoverability and AI diffs)
CREATE TABLE IF NOT EXISTS cms_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES cms_documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  change_source text NOT NULL DEFAULT 'manual' CHECK (change_source IN ('manual', 'ai', 'import')),
  change_note text,
  snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'rejected')),
  author_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_revisions_doc_version ON cms_revisions (document_id, version_number DESC);

-- 3. CMS MEDIA ASSETS TABLE
CREATE TABLE IF NOT EXISTS cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_media_project ON cms_media (project_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE cms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_documents' AND policyname = 'Allow service_role on cms_documents') THEN
    CREATE POLICY "Allow service_role on cms_documents" ON cms_documents FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_revisions' AND policyname = 'Allow service_role on cms_revisions') THEN
    CREATE POLICY "Allow service_role on cms_revisions" ON cms_revisions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cms_media' AND policyname = 'Allow service_role on cms_media') THEN
    CREATE POLICY "Allow service_role on cms_media" ON cms_media FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
