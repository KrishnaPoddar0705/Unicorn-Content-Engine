-- The Unicorn Labs — multi-part deep-tech series vertical.
-- Adds a series layer ON TOP of the existing viral pipeline: each "part" is an
-- ordinary viral_episodes row (vertical='labs') run through the unchanged 9-stage
-- pipeline, with series continuity + brand DNA injected as context. A `vertical`
-- discriminator keeps the Unicorn Labs tab's dashboard / ideas / insights cleanly
-- separate from the Viral Lab while sharing all infrastructure.

-- An AI-planned multi-part series. `arc` stores the series-architect output:
-- the ordered parts with their working titles, coverage, interdisciplinary
-- bridges, India angle, and the cliffhanger that teases the next part.
CREATE TABLE viral_series (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  topic            TEXT NOT NULL,                 -- the raw topic the user entered
  premise          TEXT,                          -- the through-line of the whole series
  domain           TEXT,                          -- primary domain (matches VIRAL_DOMAINS)
  target_audience  TEXT NOT NULL DEFAULT 'general_curious_adult',
  depth            TEXT NOT NULL DEFAULT 'extremely_technical',
  tone             TEXT NOT NULL DEFAULT 'founder_led',
  platform         TEXT NOT NULL DEFAULT 'instagram_reels',
  total_parts      INTEGER NOT NULL DEFAULT 0,
  arc              JSONB NOT NULL DEFAULT '{}'::jsonb,  -- SeriesArchitect output
  status           TEXT NOT NULL DEFAULT 'planned'
                   CHECK (status IN ('planned', 'in_progress', 'complete')),
  vertical         TEXT NOT NULL DEFAULT 'labs',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER viral_series_updated_at BEFORE UPDATE ON viral_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_viral_series_created ON viral_series(created_at DESC);

-- Tag every episode with its vertical and (when part of a series) its position.
ALTER TABLE viral_episodes
  ADD COLUMN vertical    TEXT NOT NULL DEFAULT 'viral',
  ADD COLUMN series_id   UUID REFERENCES viral_series(id) ON DELETE SET NULL,
  ADD COLUMN part_number INTEGER;

CREATE INDEX idx_viral_episodes_vertical ON viral_episodes(vertical);
CREATE INDEX idx_viral_episodes_series ON viral_episodes(series_id, part_number);

-- The ideas bank is shared infrastructure; the discriminator routes each idea to
-- the right tab's board.
ALTER TABLE viral_ideas
  ADD COLUMN vertical TEXT NOT NULL DEFAULT 'viral';

CREATE INDEX idx_viral_ideas_vertical ON viral_ideas(vertical);
