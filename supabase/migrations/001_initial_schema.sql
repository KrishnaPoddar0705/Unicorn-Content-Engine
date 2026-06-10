-- Unicorn Labs Content Engine Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE citation_status AS ENUM ('verified', 'research_inspired', 'pending_verification');
CREATE TYPE content_status AS ENUM ('idea', 'ingested', 'episode_created', 'published');
CREATE TYPE rebuild_type AS ENUM (
  'simulation', 'toy_model', 'dashboard', 'calculator', 'visualizer',
  'game', 'classifier', 'recommender', 'network_graph'
);
CREATE TYPE target_audience AS ENUM ('student', 'parent', 'school', 'founder');
CREATE TYPE episode_status AS ENUM ('draft', 'script_ready', 'demo_pending', 'demo_ready', 'scheduled', 'recorded', 'published');
CREATE TYPE demo_build_status AS ENUM ('not_started', 'spec_ready', 'building', 'ready', 'failed');
CREATE TYPE demo_status AS ENUM ('spec', 'built', 'published');
CREATE TYPE post_format AS ENUM ('reel', 'carousel', 'story');
CREATE TYPE workflow_status AS ENUM ('not_started', 'in_progress', 'done');
CREATE TYPE llm_provider AS ENUM ('openai', 'anthropic');
CREATE TYPE agent_run_status AS ENUM ('running', 'success', 'failed');
CREATE TYPE parse_status AS ENUM ('pending', 'complete', 'failed', 'not_implemented');

-- Content pillars
CREATE TABLE content_pillars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

-- CTAs
CREATE TABLE ctas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  target_audience target_audience NOT NULL DEFAULT 'student',
  usage_count INT NOT NULL DEFAULT 0
);

-- Uploads
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT,
  parsed_text TEXT,
  parse_status parse_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Papers
CREATE TABLE papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  year INT,
  source_url TEXT,
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  abstract TEXT,
  raw_text TEXT,
  topic TEXT,
  difficulty_level difficulty_level NOT NULL DEFAULT 'beginner',
  audience_suitability TEXT[] DEFAULT '{}',
  core_idea TEXT,
  why_cool TEXT,
  is_rebuildable BOOLEAN NOT NULL DEFAULT true,
  rebuild_type rebuild_type,
  suggested_project TEXT,
  citation_status citation_status NOT NULL DEFAULT 'pending_verification',
  content_status content_status NOT NULL DEFAULT 'idea',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Episodes
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_number INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_pillar_id UUID REFERENCES content_pillars(id) ON DELETE SET NULL,
  paper_id UUID REFERENCES papers(id) ON DELETE SET NULL,
  topic TEXT,
  target_audience target_audience NOT NULL DEFAULT 'student',
  why_cool TEXT,
  viral_hook TEXT,
  status episode_status NOT NULL DEFAULT 'draft',
  demo_build_status demo_build_status NOT NULL DEFAULT 'not_started',
  student_project_extension TEXT,
  parent_positioning TEXT,
  one_line_positioning TEXT,
  recording_notes TEXT,
  lead_magnet_angle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scripts
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL UNIQUE REFERENCES episodes(id) ON DELETE CASCADE,
  hook_3s TEXT,
  hook_options JSONB DEFAULT '[]',
  script_45s TEXT,
  script_60s TEXT,
  script_90s TEXT,
  caption TEXT,
  first_comment TEXT,
  hashtags TEXT[] DEFAULT '{}',
  carousel_slides JSONB DEFAULT '[]',
  title_variants TEXT[] DEFAULT '{}',
  thumbnail_text TEXT,
  parent_angle TEXT,
  student_angle TEXT,
  school_angle TEXT,
  founder_angle TEXT,
  cta TEXT,
  cta_id UUID REFERENCES ctas(id) ON DELETE SET NULL,
  explain_curious TEXT,
  b_roll_suggestions TEXT[] DEFAULT '{}',
  visual_props TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demos
CREATE TABLE demos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  spec JSONB DEFAULT '{}',
  component_key TEXT,
  status demo_status NOT NULL DEFAULT 'spec',
  educational_notes TEXT,
  paper_connection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calendar items
CREATE TABLE calendar_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  format post_format NOT NULL DEFAULT 'reel',
  recording_status workflow_status NOT NULL DEFAULT 'not_started',
  editing_status workflow_status NOT NULL DEFAULT 'not_started',
  caption_status workflow_status NOT NULL DEFAULT 'not_started',
  demo_status workflow_status NOT NULL DEFAULT 'not_started',
  final_post_url TEXT,
  notes TEXT,
  viral_mechanism TEXT,
  ordering_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality scores
CREATE TABLE quality_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  hook_strength INT NOT NULL DEFAULT 0,
  surprise_factor INT NOT NULL DEFAULT 0,
  student_relevance INT NOT NULL DEFAULT 0,
  parent_relevance INT NOT NULL DEFAULT 0,
  demo_feasibility INT NOT NULL DEFAULT 0,
  shareability INT NOT NULL DEFAULT 0,
  brand_fit INT NOT NULL DEFAULT 0,
  overall_viral_score NUMERIC(4,1) NOT NULL DEFAULT 0,
  clarity INT NOT NULL DEFAULT 0,
  authenticity INT NOT NULL DEFAULT 0,
  educational_value INT NOT NULL DEFAULT 0,
  rebuildability INT NOT NULL DEFAULT 0,
  explanation TEXT,
  improvements JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent runs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  pipeline_id UUID,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  model TEXT,
  provider TEXT,
  token_usage JSONB DEFAULT '{}',
  status agent_run_status NOT NULL DEFAULT 'running',
  error TEXT,
  duration_ms INT,
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  paper_id UUID REFERENCES papers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings (singleton)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  llm_provider llm_provider NOT NULL DEFAULT 'anthropic',
  openai_model TEXT NOT NULL DEFAULT 'gpt-4o',
  anthropic_model TEXT NOT NULL DEFAULT 'claude-opus-4-8',
  brand_voice_overrides JSONB DEFAULT '{}',
  content_preferences JSONB DEFAULT '{"posting_days":["mon","wed","fri"],"default_horizon":30}'
);

-- Indexes
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_episodes_pillar ON episodes(content_pillar_id);
CREATE INDEX idx_papers_status ON papers(content_status);
CREATE INDEX idx_calendar_date ON calendar_items(scheduled_date);
CREATE INDEX idx_agent_runs_name ON agent_runs(agent_name);
CREATE INDEX idx_demos_slug ON demos(slug);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER papers_updated_at BEFORE UPDATE ON papers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER episodes_updated_at BEFORE UPDATE ON episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER scripts_updated_at BEFORE UPDATE ON scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER demos_updated_at BEFORE UPDATE ON demos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER calendar_items_updated_at BEFORE UPDATE ON calendar_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
