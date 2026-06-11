export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type CitationStatus = "verified" | "research_inspired" | "pending_verification";
export type ContentStatus = "idea" | "ingested" | "episode_created" | "published";
export type RebuildType =
  | "simulation"
  | "toy_model"
  | "dashboard"
  | "calculator"
  | "visualizer"
  | "game"
  | "classifier"
  | "recommender"
  | "network_graph";

export type TargetAudience = "student" | "parent" | "school" | "founder";
export type EpisodeStatus = "draft" | "script_ready" | "demo_pending" | "demo_ready" | "scheduled" | "recorded" | "published";
export type DemoBuildStatus = "not_started" | "spec_ready" | "building" | "ready" | "failed";
export type DemoStatus = "spec" | "built" | "published";
export type PostFormat = "reel" | "carousel" | "story";
export type WorkflowStatus = "not_started" | "in_progress" | "done";
export type LLMProviderName = "openai" | "anthropic";
export type AgentRunStatus = "running" | "success" | "failed";
export type ParseStatus = "pending" | "complete" | "failed" | "not_implemented";

export interface ContentPillar {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  source_url: string | null;
  upload_id: string | null;
  abstract: string | null;
  raw_text: string | null;
  topic: string | null;
  difficulty_level: DifficultyLevel;
  audience_suitability: string[];
  core_idea: string | null;
  why_cool: string | null;
  is_rebuildable: boolean;
  rebuild_type: RebuildType | null;
  suggested_project: string | null;
  citation_status: CitationStatus;
  content_status: ContentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  episode_number: number;
  title: string;
  content_pillar_id: string | null;
  paper_id: string | null;
  topic: string | null;
  target_audience: TargetAudience;
  why_cool: string | null;
  viral_hook: string | null;
  status: EpisodeStatus;
  demo_build_status: DemoBuildStatus;
  student_project_extension: string | null;
  parent_positioning: string | null;
  one_line_positioning: string | null;
  recording_notes: string | null;
  lead_magnet_angle: string | null;
  script_preferences?: Record<string, string>;
  created_at: string;
  updated_at: string;
  content_pillars?: ContentPillar;
  papers?: Paper;
  scripts?: Script;
  demos?: Demo[];
  quality_scores?: QualityScore[];
}

export interface Script {
  id: string;
  episode_id: string;
  hook_3s: string | null;
  hook_options: string[];
  script_45s: string | null;
  script_60s: string | null;
  script_90s: string | null;
  caption: string | null;
  first_comment: string | null;
  hashtags: string[];
  carousel_slides: { title: string; body: string }[];
  title_variants: string[];
  thumbnail_text: string | null;
  parent_angle: string | null;
  student_angle: string | null;
  school_angle: string | null;
  founder_angle: string | null;
  cta: string | null;
  cta_id: string | null;
  explain_curious: string | null;
  b_roll_suggestions: string[];
  visual_props: string[];
  created_at: string;
  updated_at: string;
}

export interface EpisodeSlideImage {
  id: string;
  episode_id: string;
  slide_number: number;
  title: string;
  subtitle: string;
  body_text: string;
  theme: string;
  style_prompt: string;
  image_prompt: string;
  image_url: string | null;
  thumbnail_url: string | null;
  higgsfield_job_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface InteractiveWebpage {
  id: string;
  episode_id: string | null;
  paper_id: string | null;
  viral_episode_id?: string | null;
  blog_slug?: string | null;
  slug: string;
  title: string;
  theme: string | null;
  html_content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Demo {
  id: string;
  episode_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  spec: Record<string, unknown>;
  component_key: string | null;
  status: DemoStatus;
  educational_notes: string | null;
  paper_connection: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarItem {
  id: string;
  episode_id: string;
  scheduled_date: string;
  format: PostFormat;
  recording_status: WorkflowStatus;
  editing_status: WorkflowStatus;
  caption_status: WorkflowStatus;
  demo_status: WorkflowStatus;
  final_post_url: string | null;
  notes: string | null;
  viral_mechanism: string | null;
  ordering_reason: string | null;
  created_at: string;
  updated_at: string;
  episodes?: Episode;
}

export interface QualityScore {
  id: string;
  episode_id: string;
  hook_strength: number;
  surprise_factor: number;
  student_relevance: number;
  parent_relevance: number;
  demo_feasibility: number;
  shareability: number;
  brand_fit: number;
  overall_viral_score: number;
  clarity: number;
  authenticity: number;
  educational_value: number;
  rebuildability: number;
  explanation: string | null;
  improvements: string[];
  created_at: string;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  pipeline_id: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  model: string | null;
  provider: string | null;
  token_usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  status: AgentRunStatus;
  error: string | null;
  duration_ms: number | null;
  episode_id: string | null;
  paper_id: string | null;
  created_at: string;
}

export interface CTA {
  id: string;
  label: string;
  text: string;
  target_audience: TargetAudience;
  usage_count: number;
}

export interface Settings {
  id: string;
  llm_provider: LLMProviderName;
  openai_model: string;
  anthropic_model: string;
  brand_voice_overrides: Record<string, unknown>;
  content_preferences: Record<string, unknown>;
}

export interface Upload {
  id: string;
  filename: string;
  mime_type: string;
  storage_path: string | null;
  parsed_text: string | null;
  parse_status: ParseStatus;
  created_at: string;
}

// ---- Viral Research Episode Pipeline ----

export type ViralInputMode = "paper" | "idea" | "topic" | "trend" | "reference_visual";
export type ViralStage =
  | "curiosity_miner"
  | "expert_research"
  | "hook_lab"
  | "script_architect"
  | "visual_director"
  | "engagement_engineer"
  | "virality_critic"
  | "project_bridge"
  | "interactive_webpage";
export type ViralStageStatus = "pending" | "running" | "success" | "failed";
export type ViralEpisodeStatus = "queued" | "running" | "failed" | "complete";
export type VisualStyleMode = "default" | "reference_image" | "pasted_prompt";

export interface ReferenceImage {
  id: string;
  filename: string;
  mime_type: string;
  storage_path: string;
  public_url: string;
  notes: string | null;
  created_at: string;
}

export interface StyleProfile {
  id: string;
  name: string;
  source: "default" | "extracted" | "manual";
  reference_image_id: string | null;
  profile: {
    visual_keywords?: string[];
    color_palette?: string[];
    typography_suggestions?: string[];
    texture?: string;
    composition_rules?: string[];
    prompt_snippet?: string;
  };
  created_at: string;
}

export interface ContentSeriesTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  hook_style: string | null;
  structure: string | null;
  visual_language: string | null;
  cta_type: string | null;
  ideal_domains: string[];
  pacing_notes: string | null;
  prompt_snippet: string;
  sort_order: number;
  active: boolean;
}

export interface ViralEpisode {
  id: string;
  title: string;
  input_mode: ViralInputMode;
  domain: string | null;
  raw_input: string | null;
  paper_text: string | null;
  target_audience: string;
  depth: string;
  output_format: string;
  tone: string;
  cta_goal: string | null;
  platform: string;
  visual_style_mode: VisualStyleMode;
  pasted_style_prompt: string | null;
  series_template_id: string | null;
  style_profile_id: string | null;
  reference_image_id: string | null;
  pipeline_id: string;
  status: ViralEpisodeStatus;
  current_stage: ViralStage | null;
  winner_hook: string | null;
  winner_archetype: string | null;
  created_at: string;
  updated_at: string;
  content_series_templates?: ContentSeriesTemplate;
  style_profiles?: StyleProfile;
  reference_images?: ReferenceImage;
}

export interface ViralEpisodeOutput {
  id: string;
  viral_episode_id: string;
  stage: ViralStage;
  status: ViralStageStatus;
  output: Record<string, unknown> | null;
  error: string | null;
  attempt: number;
  agent_run_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EpisodeRevision {
  id: string;
  viral_episode_id: string;
  stage: ViralStage;
  action: string;
  instruction: string | null;
  previous_output: Record<string, unknown> | null;
  new_output: Record<string, unknown> | null;
  agent_run_id: string | null;
  created_at: string;
}

export interface EpisodeScore {
  id: string;
  viral_episode_id: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  krishna_rating: number | null;
  performance_notes: string | null;
  posted_url: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}
