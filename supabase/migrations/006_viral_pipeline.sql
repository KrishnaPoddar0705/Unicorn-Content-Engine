-- Viral Research Episode Pipeline

-- Enums
CREATE TYPE viral_input_mode AS ENUM ('paper', 'idea', 'topic', 'trend', 'reference_visual');
CREATE TYPE viral_stage AS ENUM (
  'curiosity_miner', 'expert_research', 'hook_lab', 'script_architect',
  'visual_director', 'engagement_engineer', 'virality_critic', 'project_bridge'
);
CREATE TYPE viral_stage_status AS ENUM ('pending', 'running', 'success', 'failed');
CREATE TYPE viral_episode_status AS ENUM ('queued', 'running', 'failed', 'complete');

-- Reference images (Supabase Storage bucket: reference-images)
CREATE TABLE reference_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Style profiles (extracted from reference images, or manual/default)
CREATE TABLE style_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'extracted' CHECK (source IN ('default', 'extracted', 'manual')),
  reference_image_id UUID REFERENCES reference_images(id) ON DELETE SET NULL,
  profile JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content series templates
CREATE TABLE content_series_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  hook_style TEXT,
  structure TEXT,
  visual_language TEXT,
  cta_type TEXT,
  ideal_domains TEXT[] DEFAULT '{}',
  pacing_notes TEXT,
  prompt_snippet TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Viral episodes
CREATE TABLE viral_episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Untitled viral episode',
  input_mode viral_input_mode NOT NULL,
  domain TEXT,
  raw_input TEXT,
  paper_text TEXT,
  target_audience TEXT NOT NULL DEFAULT 'general curious adult',
  depth TEXT NOT NULL DEFAULT 'medium',
  output_format TEXT NOT NULL DEFAULT 'all',
  tone TEXT NOT NULL DEFAULT 'founder-led',
  cta_goal TEXT,
  platform TEXT NOT NULL DEFAULT 'instagram_reels',
  visual_style_mode TEXT NOT NULL DEFAULT 'default' CHECK (visual_style_mode IN ('default', 'reference_image', 'pasted_prompt')),
  pasted_style_prompt TEXT,
  series_template_id UUID REFERENCES content_series_templates(id) ON DELETE SET NULL,
  style_profile_id UUID REFERENCES style_profiles(id) ON DELETE SET NULL,
  reference_image_id UUID REFERENCES reference_images(id) ON DELETE SET NULL,
  pipeline_id UUID NOT NULL,
  status viral_episode_status NOT NULL DEFAULT 'queued',
  current_stage viral_stage,
  winner_hook TEXT,
  winner_archetype TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per pipeline stage per episode
CREATE TABLE viral_episode_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viral_episode_id UUID NOT NULL REFERENCES viral_episodes(id) ON DELETE CASCADE,
  stage viral_stage NOT NULL,
  status viral_stage_status NOT NULL DEFAULT 'pending',
  output JSONB,
  error TEXT,
  attempt INT NOT NULL DEFAULT 0,
  agent_run_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (viral_episode_id, stage)
);

-- Revision history (previous/new snapshots per revision action)
CREATE TABLE episode_revision_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viral_episode_id UUID NOT NULL REFERENCES viral_episodes(id) ON DELETE CASCADE,
  stage viral_stage NOT NULL,
  action TEXT NOT NULL,
  instruction TEXT,
  previous_output JSONB,
  new_output JSONB,
  agent_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Real-world performance metrics (one row per episode, upserted)
CREATE TABLE episode_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viral_episode_id UUID NOT NULL UNIQUE REFERENCES viral_episodes(id) ON DELETE CASCADE,
  views INT,
  likes INT,
  comments INT,
  shares INT,
  saves INT,
  krishna_rating INT CHECK (krishna_rating BETWEEN 1 AND 10),
  performance_notes TEXT,
  posted_url TEXT,
  posted_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lineage from agent runs to viral episodes
ALTER TABLE agent_runs ADD COLUMN viral_episode_id UUID REFERENCES viral_episodes(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_viral_episodes_status ON viral_episodes(status, created_at DESC);
CREATE INDEX idx_viral_outputs_episode ON viral_episode_outputs(viral_episode_id);
CREATE INDEX idx_viral_revisions_episode ON episode_revision_history(viral_episode_id, created_at DESC);
CREATE INDEX idx_agent_runs_viral ON agent_runs(viral_episode_id);

-- updated_at triggers
CREATE TRIGGER viral_episodes_updated_at BEFORE UPDATE ON viral_episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER viral_episode_outputs_updated_at BEFORE UPDATE ON viral_episode_outputs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER episode_scores_updated_at BEFORE UPDATE ON episode_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: 10 content series templates
INSERT INTO content_series_templates (slug, name, description, hook_style, structure, visual_language, cta_type, ideal_domains, pacing_notes, prompt_snippet, sort_order) VALUES
(
  'paper-that-explains',
  'The Paper That Explains ___',
  'A single research paper as the skeleton key to a familiar phenomenon.',
  'Familiar phenomenon, unfamiliar cause: "There is one paper that explains why ___."',
  'Phenomenon → "one paper explains this" → the mechanism → the twist → what students can build',
  'Paper-as-artifact visuals: floating documents, highlighted equations, annotated figures',
  'save',
  ARRAY['economics', 'ai', 'science', 'markets'],
  'Slow open (3s on the phenomenon), fast middle, hold on the mechanism reveal',
  'SERIES FORMAT — "The Paper That Explains ___": Anchor the entire piece on ONE real paper as the skeleton key to a familiar everyday phenomenon. Open on the phenomenon, not the paper. Reveal the paper as the answer ("a paper from [year] explains exactly why"). Walk the mechanism in 2-3 steps max. End with what a student could rebuild from it. Never invent the paper — if no specific verifiable paper fits, frame as research_inspired and say "research on X shows" instead of naming a fake citation.',
  1
),
(
  'i-rebuilt-this-paper',
  'I Rebuilt This Research Paper',
  'First-person rebuild narrative: recreating a paper and finding something along the way.',
  'First-person discovery: "I recreated this paper and found something weird."',
  'I rebuilt it → here is what the paper claimed → here is what I saw → the surprising detail → you can rebuild it too',
  'Screen recordings, code snippets, charts being drawn live, before/after comparisons',
  'comment',
  ARRAY['ai', 'math', 'science', 'markets'],
  'Hook in first person immediately; show the artifact early; the "weird finding" lands at 60-70% mark',
  'SERIES FORMAT — "I Rebuilt This Research Paper": First-person rebuild narrative. The narrator actually recreated the paper''s core experiment/model. Structure: what the paper claimed → what the rebuild showed → one genuinely surprising detail found along the way → invitation to rebuild. Keep claims honest: only assert what a real rebuild would plausibly show, flag any simplification. The rebuild must be concretely described (tools, data, steps) so a student could follow.',
  2
),
(
  'one-equation-explains',
  'This One Equation Explains ___',
  'A single equation as the hidden engine behind a big system.',
  'Tiny rule, huge consequence: "This one equation explains a billion-dollar system."',
  'Big system → zoom into one equation → unpack each term in plain language → recompose → payoff',
  'Single equation rendered large, terms lighting up one at a time, system diagrams collapsing into symbols',
  'save',
  ARRAY['math', 'economics', 'markets', 'ai'],
  'Maximum one equation. Spend most of the time unpacking terms, not deriving.',
  'SERIES FORMAT — "This One Equation Explains ___": Exactly ONE equation, treated as a character. Show the big messy system first, then reveal the tiny equation underneath it. Unpack each term in plain language with a concrete number or example per term. Never show a second equation. The dopamine payoff is recomposing the equation and watching the system make sense. End with a way to play with the equation in a spreadsheet or 20 lines of code.',
  3
),
(
  'hidden-system-behind',
  'The Hidden System Behind ___',
  'Infrastructure reveal: the invisible machinery under everyday things.',
  'Invisible machinery: "There is a hidden system deciding ___ and you have never seen it."',
  'Everyday surface → trapdoor into the hidden system → how it actually works → who controls it → mental model shift',
  'X-ray / blueprint aesthetics, layered diagrams peeling back, network maps',
  'share',
  ARRAY['markets', 'economics', 'business', 'space'],
  'The trapdoor moment ("here is what is actually underneath") should hit by second 8-10',
  'SERIES FORMAT — "The Hidden System Behind ___": Infrastructure reveal. Start on a mundane surface (an order button, a price tag, a flight path), then drop through the trapdoor into the hidden machinery beneath it. Map the system in 3 layers max. Name the real institutions/mechanisms involved (exchanges, clearinghouses, auction systems, protocols) accurately. The mental-model shift: the viewer should never see the surface thing the same way again.',
  4
),
(
  'everyone-gets-this-wrong',
  'Everyone Gets This Wrong',
  'Misconception demolition with a precise correction.',
  'Confident contradiction: "Everyone thinks X. The research says the opposite."',
  'State the common belief sympathetically → why it feels true → the evidence against it → the correct model → what most people misunderstand',
  'Split-screen wrong/right, crossed-out diagrams, replaced mental models',
  'comment',
  ARRAY['economics', 'philosophy', 'science', 'ai'],
  'Be generous to the misconception first — the correction lands harder. Correction at the midpoint.',
  'SERIES FORMAT — "Everyone Gets This Wrong": Misconception demolition. State the common belief fairly and explain why smart people hold it. Then bring the actual evidence/mechanism that contradicts it. The correction must be precise — not "it''s more complicated" but a specific replacement model. Avoid strawmen: the misconception must be one people genuinely hold. Invite disagreement in the comments deliberately.',
  5
),
(
  'algorithm-behind-everyday-life',
  'The Algorithm Behind Everyday Life',
  'The literal algorithm running behind a daily experience.',
  'Demystification: "This looks like magic until you see the algorithm."',
  'Daily experience → "there is an algorithm doing this" → the algorithm in 3 steps → why it is simpler than the outcome → rebuild angle',
  'Step-by-step flowcharts animating, pseudo-code over real-life footage',
  'follow',
  ARRAY['ai', 'math', 'business'],
  'The "simpler than you think" beat is the payoff — the 3-step version of the algorithm must be honest',
  'SERIES FORMAT — "The Algorithm Behind Everyday Life": Take one daily experience (a feed ranking, a price, a route, a match) and reveal the literal algorithm behind it. Express the algorithm honestly in 3 plain-language steps. The key tension: the outcome feels complex but the algorithm is simple. Always include the gap between the toy version and the production version so it is accurate. The rebuild: a student can implement the 3-step version in an afternoon.',
  6
),
(
  'market-mystery-60s',
  'A Market Mystery in 60 Seconds',
  'A genuine market anomaly set up as a detective story.',
  'Detective opening: "In [year], something happened in the market that should have been impossible."',
  'The anomaly (impossible thing) → the suspects (candidate explanations) → the actual mechanism → what it reveals about markets',
  'Noir/detective aesthetics, charts as crime scenes, timestamps, magnifying details',
  'save',
  ARRAY['markets', 'economics'],
  'Strict 60s discipline: anomaly by 0:08, suspects by 0:25, mechanism by 0:45, takeaway at 0:55',
  'SERIES FORMAT — "A Market Mystery in 60 Seconds": Detective-story structure around a REAL, verifiable market anomaly or event (flash crash, negative oil prices, a persistent arbitrage, an auction failure). Present it as impossible-seeming, walk 2-3 candidate explanations, then reveal the actual mechanism. All facts must be real and checkable; flag any disputed interpretation as disputed. Indian market examples are highly welcome where they fit.',
  7
),
(
  'philosophy-with-simulations',
  'Philosophy But With Simulations',
  'A philosophical question made concrete and runnable as a simulation.',
  'Thought experiment made executable: "Philosophers argued about this for 200 years. Then someone simulated it."',
  'The old philosophical question → why it seemed unanswerable → the simulation/model that made it concrete → what the simulation shows → what it cannot show',
  'Agent-based simulation visuals, dots and grids evolving, emergent patterns',
  'share',
  ARRAY['philosophy', 'ai', 'science'],
  'Respect the philosophy: the simulation sharpens the question, it does not cheaply "solve" it',
  'SERIES FORMAT — "Philosophy But With Simulations": Take one real philosophical question (cooperation, fairness, knowledge, emergence, free will) and show how a computational model or simulation made it concrete (e.g. Axelrod''s tournaments, Schelling''s segregation model, Rawls via veil-of-ignorance experiments). Be precise about what the simulation shows AND what it cannot settle — overclaiming here is the cardinal sin. The build: the student runs or modifies the simulation themselves.',
  8
),
(
  'math-that-feels-illegal',
  'Math That Feels Illegal',
  'A mathematical result so counterintuitive it feels like cheating.',
  'Disbelief bait: "This math result feels illegal. It is just true."',
  'The impossible-sounding claim → "this is provably true" → the intuition for why → where it shows up in real life → try it yourself',
  'Bold single statements, visual proofs, number animations, the "wait what" pause',
  'comment',
  ARRAY['math', 'economics', 'ai'],
  'Lead with the claim cold, no warmup. Let the disbelief breathe for a beat before explaining.',
  'SERIES FORMAT — "Math That Feels Illegal": One counterintuitive but TRUE mathematical result (Banach-Tarski flavored honesty: state any conditions plainly). Structure: cold open with the claim → let disbelief land → the cleanest intuition (not the proof) → one real-world place it bites (insurance, gambling, ML, markets) → a way to verify it yourself with dice/spreadsheet/code. Accuracy bar is maximum: state the precise conditions under which the result holds.',
  9
),
(
  'ai-papers-you-can-build',
  'AI Papers You Can Actually Build',
  'Frontier AI research scoped down to a weekend build.',
  'Accessibility shock: "This AI paper looks terrifying. You can build the core idea in a weekend."',
  'The intimidating paper → the one core idea inside it → the idea stripped to its mechanism → the weekend version → what the full version adds',
  'Paper screenshots dissolving into simple diagrams, code editors, small-scale demos',
  'join_unicorn_labs',
  ARRAY['ai', 'math'],
  'The gap between "looks terrifying" and "core idea is simple" is the whole video — make both ends vivid',
  'SERIES FORMAT — "AI Papers You Can Actually Build": Take a real, named AI paper and extract the ONE core mechanism a student can rebuild small-scale (attention from scratch, a tiny diffusion model, RLHF on a toy task, a mini world-model). Be explicit about the gap between the weekend version and the real system — that honesty is the brand. Spec the weekend build concretely: dataset, model size, expected result, what success looks like.',
  10
);
