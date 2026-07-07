-- Viral Ideas bank — web-sourced interdisciplinary reel ideas
-- Surfaced by the idea-scout agent (Claude web_search) and pushed into the viral pipeline.

CREATE TABLE viral_ideas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,                 -- punchy, reel-ready title
  hook             TEXT,                          -- the "wait, what?" one-liner
  summary          TEXT NOT NULL,                 -- 2-3 sentence deconstruction angle
  fields           TEXT[] NOT NULL DEFAULT '{}',  -- interdisciplinary tags e.g. {economics, biology}
  domain           TEXT,                          -- primary domain (matches create-form DOMAINS)
  why_viral        TEXT,                          -- rationale: curiosity gap / retention driver
  virality_score   INTEGER NOT NULL DEFAULT 0,    -- 0-100, model-assigned
  source_urls      TEXT[] NOT NULL DEFAULT '{}',  -- citations from web_search
  audience         TEXT,                          -- students / builders / founders / researchers
  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'saved', 'used', 'dismissed')),
  viral_episode_id UUID REFERENCES viral_episodes(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_viral_ideas_status_score ON viral_ideas(status, virality_score DESC);
CREATE INDEX idx_viral_ideas_created ON viral_ideas(created_at DESC);
