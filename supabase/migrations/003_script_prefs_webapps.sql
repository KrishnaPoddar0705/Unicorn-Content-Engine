-- Per-episode script writing preferences
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS script_preferences JSONB DEFAULT '{}';

-- Mobile interactive webpages generated from papers
CREATE TABLE IF NOT EXISTS interactive_webpages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES papers(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  theme TEXT,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactive_webpages_episode ON interactive_webpages(episode_id);
