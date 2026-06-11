-- 9th viral pipeline stage: Interactive Webpage Builder
-- (the thesis-style interactive page shared when viewers comment the episode keyword)

ALTER TYPE viral_stage ADD VALUE IF NOT EXISTS 'interactive_webpage';

ALTER TABLE interactive_webpages
  ADD COLUMN viral_episode_id UUID REFERENCES viral_episodes(id) ON DELETE CASCADE;

CREATE INDEX idx_interactive_webpages_viral ON interactive_webpages(viral_episode_id);
