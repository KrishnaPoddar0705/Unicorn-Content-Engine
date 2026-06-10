-- Generated reel / carousel slide images per episode
CREATE TABLE IF NOT EXISTS episode_slide_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  slide_number INT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL DEFAULT '',
  style_prompt TEXT NOT NULL DEFAULT '',
  image_prompt TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  thumbnail_url TEXT,
  higgsfield_job_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (episode_id, slide_number)
);

CREATE INDEX IF NOT EXISTS idx_episode_slide_images_episode ON episode_slide_images(episode_id);
