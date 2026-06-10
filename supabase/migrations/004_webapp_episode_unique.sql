-- One interactive webpage per episode; slug includes episode number for global uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_interactive_webpages_episode_unique
  ON interactive_webpages(episode_id)
  WHERE episode_id IS NOT NULL;
