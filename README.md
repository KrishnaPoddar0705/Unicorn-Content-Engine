# Unicorn Labs Content Engine

**Paper to Project** — turn research papers into Instagram content and interactive student demos.

Built for [The Unicorn Labs](https://theunicornlabs.com) flagship series: deconstruct research, write viral scripts, build rebuildable demos, and plan your content calendar.

## Features

- **Dashboard** — upcoming posts, viral scores, pillar distribution
- **Paper Library** — ingest papers via paste text (PDF stub ready)
- **Episode Generator** — 7-agent pipeline: deconstruction → script → demo spec → quality critic
- **Interactive Demos** — PageRank, Recommender, Misinformation Spread
- **Content Calendar** — AI-generated 7/14/30-day schedules
- **Agent History** — token usage, duration, run logs
- **Settings** — OpenAI / Anthropic provider toggle

## Stack

- Next.js 16 (App Router)
- Tailwind CSS + shadcn-style components
- Supabase (Postgres)
- OpenAI + Anthropic SDKs
- Zod for agent output validation

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (default) and/or `OPENAI_API_KEY`

### 3. Run Supabase migrations

Apply migrations in your Supabase project SQL editor or via CLI:

```bash
# Files to run in order:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_seed_pillars_ctas.sql
```

### 4. Seed 30 episodes

```bash
npm run seed
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Agent Pipeline

1. **Research Scout** — suggest viral, rebuildable papers
2. **Paper Deconstruction** — simplify for high school audience
3. **Scriptwriting** — hooks, 45/60/90s scripts, captions, carousel
4. **Demo Spec** — interactive project specification
5. **Demo Builder** — generate React component code (review before deploy)
6. **Calendar Strategist** — schedule episodes across pillars
7. **Quality Critic** — viral scoring + improvements

## Built-in Demos

| Slug | Episode | Description |
|------|---------|-------------|
| `/demos/pagerank` | E1 | 5-website PageRank visualizer |
| `/demos/recommender` | E2 | Collaborative filtering matrix |
| `/demos/misinformation-spread` | E18 | Social network rumor simulator |

## Project Structure

```
app/           # Pages and API routes
components/    # UI, demos, layout
lib/
  agents/      # 7 agent modules + orchestrator
  llm/         # OpenAI / Anthropic abstraction
  demos/       # Algorithms + registry
  brand/       # Voice config
  db/          # Supabase queries
supabase/      # SQL migrations
data/          # 30 seed episodes JSON
scripts/       # Database seed script
```

## Brand Voice

> We turn research papers into projects students can actually build.

- Curious, founder-led, no guru energy
- One "wait, what?" moment per script
- Never hallucinate paper citations

## License

Private — The Unicorn Labs
