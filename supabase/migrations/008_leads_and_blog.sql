-- Lead capture + public blog slugs

-- Leads captured from interactive webpages (backup store; also appended to Google Sheet)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  phone TEXT,
  interest TEXT,
  source_slug TEXT,
  user_agent TEXT,
  synced_to_sheet BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_source ON leads(source_slug);

-- Clean public blog slug for each interactive webpage
-- (strips the internal -vXXXXXX / -eN uniqueness suffixes)
ALTER TABLE interactive_webpages ADD COLUMN blog_slug TEXT;

UPDATE interactive_webpages
SET blog_slug = regexp_replace(slug, '-(v[0-9a-f]{6}|e[0-9]+)$', '');

-- Deduplicate any collisions by re-suffixing later rows
WITH dupes AS (
  SELECT id, blog_slug,
         ROW_NUMBER() OVER (PARTITION BY blog_slug ORDER BY created_at) AS rn
  FROM interactive_webpages
)
UPDATE interactive_webpages iw
SET blog_slug = iw.blog_slug || '-' || d.rn
FROM dupes d
WHERE iw.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX idx_interactive_webpages_blog_slug ON interactive_webpages(blog_slug);
