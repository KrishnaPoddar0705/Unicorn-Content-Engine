# Unicorn Labs Content Engine

**Paper to Project** — Transform research papers into viral Instagram content, interactive student projects, and educational materials.

---

## 🎯 Mission & Vision

**Core Mission:** Turn academic research papers into engaging, rebuildable projects that students can actually understand and build.

**Philosophy:**
- Research should be accessible, not gatekept
- Viral content ≠ shallow content (educationally rigorous yet entertaining)
- Every piece of content should have a "wait, what?" moment
- Students learn by building, not just watching

---

## 🚀 Current Capabilities (MVP)

### 1. **Paper Ingestion & Deconstruction**
- Paste research paper text (PDF parsing coming soon)
- Automatic simplification for high school audience
- Extraction of core concepts without loss of rigor
- Citation preservation (never hallucinate references)

### 2. **Multi-Agent Episode Generation Pipeline**
A 7-stage pipeline that automates content creation:

1. **Research Scout** — Suggest trending, rebuildable papers
2. **Paper Deconstruction** — Simplify complex concepts for students
3. **Scriptwriting** — Generate multiple script lengths (45s, 60s, 90s) with hooks, captions, and carousel text
4. **Demo Specification** — Design interactive project requirements
5. **Demo Builder** — Generate React component code (with review gates)
6. **Calendar Strategist** — Plan 7/14/30-day content schedules
7. **Quality Critic** — Viral scoring and improvement suggestions

### 3. **Dashboard**
- Real-time episode overview with viral scores
- Upcoming content calendar visualization
- Pillar distribution analysis (which topics are covered)
- Quick stats on agent runtime and token usage

### 4. **Episode Management**
- Create episodes from papers or start from scratch
- View full episode details with all agent outputs
- Edit and refine scripts, demo specs, and calendar items
- Track episode status and publish history
- View agent execution history and cost analytics

### 5. **Paper Library**
- Ingest papers via text paste
- Organize by topic, author, or date
- Search and filter capabilities
- View papers used in past episodes
- Suggest papers based on trending topics

### 6. **Content Calendar**
- AI-generated posting schedules (7/14/30-day plans)
- Visual calendar layout
- Drag-and-drop rescheduling (planned)
- Pillar-based distribution (ensure topic diversity)
- Optimal timing recommendations

### 7. **Interactive Demo Ecosystem**
Three production-ready demos:

#### a. **PageRank Visualizer** (`/demos/pagerank`)
- Interactive 5-website network graph
- Real-time PageRank calculation
- Drag-to-modify link structure
- Educational explanation of Google's original algorithm
- Adjustable iteration count

#### b. **Collaborative Filtering** (`/demos/recommender`)
- Movie rating matrix (user × movie)
- Interactive cell editing
- Real-time recommendation computation
- Similarity-based suggestions
- Explains Netflix/Spotify recommendation logic

#### c. **Misinformation Spread Simulator** (`/demos/misinformation-spread`)
- Social network graph visualization
- Rumor propagation simulation
- Adjustable belief thresholds
- Network topology controls
- Real-time spread visualization

### 8. **Settings & Provider Management**
- Toggle between OpenAI and Anthropic APIs
- Configure model preferences
- API key management (secure storage in `.env.local`)
- LLM provider testing/validation
- Token usage tracking per provider

### 9. **Agent History & Analytics**
- Full run logs for each agent pipeline
- Token usage tracking and cost analysis
- Execution duration metrics
- Error logging and debugging info
- Performance insights by agent

---

## 🏗️ Architecture Overview

### **Data Model**

```
Episodes
├── metadata (title, status, publish date)
├── paper_id (source paper)
├── agent_outputs (all 7 stages)
│   ├── research_scout_output
│   ├── deconstruction_output
│   ├── scriptwriting_output (45s, 60s, 90s)
│   ├── demo_spec_output
│   ├── demo_builder_output
│   ├── calendar_strategist_output
│   └── quality_critic_output
├── demo_id (linked interactive project)
└── created_at, updated_at

Papers
├── metadata (title, authors, abstract)
├── raw_text
├── source_url
├── ingestion_date
└── episodes_using (foreign key relationship)

Demos
├── slug (pagerank, recommender, misinformation-spread)
├── component (React code)
├── description
└── educational_content

DemoRuns
├── user_session
├── demo_slug
├── interaction_history
└── timestamp
```

### **Core Libraries**

- **`lib/agents/`** — 7 specialized agents + orchestrator
- **`lib/llm/`** — Provider abstraction (OpenAI/Anthropic unified interface)
- **`lib/demos/`** — Algorithm implementations + registry
- **`lib/episodes/`** — Episode orchestration logic
- **`lib/papers/`** — Paper ingestion and management
- **`lib/slides/`** — Presentation generation (coming soon)
- **`lib/brand/`** — Voice & tone configurations
- **`lib/supabase/`** — Database queries and migrations

### **UI Components**

- **Navigation** — Sidebar with section links
- **Dashboard** — Stats cards, calendar preview, trending content
- **Episode Builder** — Multi-step form for manual creation
- **Demo Viewer** — Embedded interactive components
- **Settings Panel** — Provider and preference management
- **Agent Monitor** — Real-time pipeline execution visualization

---

## 📋 Feature Breakdown

### **Paper Ingest Workflow**
```
User pastes paper text
    ↓
Validate & extract metadata (title, authors, abstract)
    ↓
Store in Supabase
    ↓
Suggest episode creation
    ↓
Begin agent pipeline
```

### **Episode Generation Workflow**
```
New Episode Created
    ↓
[1] Research Scout — Suggest viral papers (if starting from scratch)
    ↓
[2] Paper Deconstruction — Simplify for high school audience
    ↓
[3] Scriptwriting — Generate 45s/60s/90s scripts with hooks
    ↓
[4] Demo Spec — Design interactive project spec
    ↓
[5] Demo Builder — Generate React component (review gate)
    ↓
[6] Calendar Strategist — Plan 7/14/30-day schedule
    ↓
[7] Quality Critic — Score virality and suggest improvements
    ↓
All outputs saved to Episode
```

### **Content Calendar Workflow**
```
Select episode(s) for scheduling
    ↓
Choose calendar duration (7/14/30 days)
    ↓
AI generates optimal posting schedule
    ↓
Ensures pillar distribution (topic diversity)
    ↓
Provides posting times & platform recommendations
    ↓
User can rearrange and confirm
```

### **Demo Management Workflow**
```
Episode created with demo spec
    ↓
[Demo Builder] generates React component
    ↓
Save to webapp registry
    ↓
Generate unique slug & deploy
    ↓
Shareable at /demos/[slug]
    ↓
Track user interactions & engagement
```

---

## 🧠 Agent Pipeline Details

### **1. Research Scout**
- **Input:** Topic/keyword or empty (global trends)
- **Output:** 3-5 paper suggestions with virality scores
- **Logic:** Searches trends, filters for educational rebuildability
- **Cost:** ~2-3K tokens per run

### **2. Paper Deconstruction**
- **Input:** Paper abstract + key sections
- **Output:** High school simplified explanation
- **Logic:** Removes jargon, explains with analogies
- **Constraint:** Maintains scientific accuracy
- **Cost:** ~3-4K tokens per run

### **3. Scriptwriting**
- **Input:** Deconstructed paper + script preferences
- **Output:** Three scripts (45s/60s/90s) with hooks, captions, carousel
- **Logic:** Viral copywriting with "wait, what?" moment
- **Preferences:** Tone, examples, audience level
- **Cost:** ~4-5K tokens per run

### **4. Demo Specification**
- **Input:** Paper concepts + script content
- **Output:** Interactive project spec (user flows, interactions, data)
- **Logic:** Designs learnable, visual demonstration
- **Cost:** ~2-3K tokens per run

### **5. Demo Builder**
- **Input:** Demo spec + component design patterns
- **Output:** Full React component code (copy-paste ready)
- **Logic:** Generates working, styled component
- **Gate:** Requires manual review before deployment
- **Cost:** ~5-6K tokens per run

### **6. Calendar Strategist**
- **Input:** 1-3 episodes to schedule
- **Output:** 7/14/30-day calendar with posting times
- **Logic:** Distributes across pillars, optimizes engagement windows
- **Considerations:** Topic diversity, posting frequency, platform best times
- **Cost:** ~2-3K tokens per run

### **7. Quality Critic**
- **Input:** All previous outputs
- **Output:** Virality score (1-10), improvement suggestions
- **Logic:** Evaluates hooks, educational value, engagement potential
- **Score Factors:** Hook strength, novelty, educational depth, repeatability
- **Cost:** ~2-3K tokens per run

**Total Pipeline Cost:** ~20-30K tokens per full episode

---

## 🎮 Interactive Demos

### **PageRank Simulator**
- **Teaches:** How Google ranks web pages
- **Interface:** Draggable nodes, editable links
- **Real-time:** Recalculates PageRank on each change
- **Educational Value:** Demystifies black-box algorithms
- **Code Path:** `lib/demos/algorithms/pagerank.ts`

### **Collaborative Filtering**
- **Teaches:** How recommendation systems work
- **Interface:** Editable rating matrix, live suggestions
- **Real-time:** Updates recommendations as ratings change
- **Educational Value:** Behind-the-scenes of Netflix/Spotify
- **Code Path:** `lib/demos/algorithms/collaborative-filter.ts`

### **Misinformation Spread**
- **Teaches:** How rumors propagate on social networks
- **Interface:** Network graph, adjustment sliders
- **Real-time:** Animates spread across network
- **Educational Value:** Understanding information flow and belief polarization
- **Code Path:** `lib/demos/algorithms/misinformation-spread.ts`

**Demo Registry:** `lib/demos/registry.ts`
All demos are catalogued and discoverable via `/demos` index page.

---

## 📊 Data & Analytics

### **Episode Analytics**
- Total episodes created
- Episodes with published demos
- Average viral score
- Most successful topics (by engagement)
- Content calendar fill rate

### **Agent Analytics**
- Tokens used per agent (cost tracking)
- Average runtime per agent
- Success rate (% of runs that complete)
- Provider comparison (OpenAI vs Anthropic)
- Error patterns and retry logic

### **Demo Analytics**
- Demo views and interactions
- User session duration
- Most popular demos
- Click-through to source content
- Engagement by topic

### **Content Calendar Analytics**
- Posting frequency
- Pillar distribution
- Optimal posting times (engagement-based)
- Rescheduling frequency
- Calendar adherence rate

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** Next.js 16 (App Router)
- **UI Framework:** React 19
- **Styling:** Tailwind CSS 4 + PostCSS
- **Components:** shadcn-style Radix UI primitives
- **Icons:** Lucide React
- **Date Handling:** date-fns

### **Backend**
- **Runtime:** Node.js via Next.js
- **Database:** Supabase (PostgreSQL)
- **ORM:** Direct SQL queries via Supabase client
- **Validation:** Zod

### **LLM & APIs**
- **Anthropic SDK:** `@anthropic-ai/sdk` (v0.101.0)
- **OpenAI SDK:** `openai` (v6.42.0)
- **Unified Interface:** `lib/llm/provider.ts`

### **Utilities**
- **PDF Parsing:** unpdf (experimental)
- **Class Utilities:** clsx, class-variance-authority, tailwind-merge
- **Dev Tools:** tsx, TypeScript, ESLint

### **Database Schema**
- Episodes table (content metadata + agent outputs)
- Papers table (source documents)
- Demos table (interactive components)
- DemoRuns table (user interactions & telemetry)
- Pillars table (content categories)
- Settings table (user preferences)

---

## 🗺️ Roadmap

### **Phase 1: MVP Hardening** (Current)
- ✅ Core 7-agent pipeline
- ✅ Paper ingestion (text paste)
- ✅ Dashboard
- ✅ 3 interactive demos
- ⏳ **TODO:** Better error handling in agent runner
- ⏳ **TODO:** Retry logic for failed agent stages
- ⏳ **TODO:** User authentication & multi-user support

### **Phase 2: Content Enhancement** (Next 4 weeks)
- **PDF Ingestion:** Parse PDFs directly (currently text-only)
- **Slide Generation:** Auto-generate presentation slides from scripts
  - Code: `lib/slides/` (architecture ready)
  - Multiple layouts: Title, Content, Code, Comparison
  - Export to PPTX
- **Video Script Adaptation:** Generate video storyboards from scripts
- **Social Media Assets:** Auto-generate Instagram carousel designs
  - Integration: Canva API (research phase)
  - Branding: Auto-apply Unicorn Labs brand guidelines
- **Caption Optimization:** Multi-language subtitle generation

### **Phase 3: Demo Expansion** (Weeks 5-8)
- **More Interactive Demos:** 5+ additional algorithms
  - A/B Testing Simulator
  - ML Model Training Visualizer
  - Network Protocol Animator
  - Blockchain Transaction Flow
  - Recommendation Algorithm Playground
- **Demo Creator UI:** User-friendly tool to build custom demos
- **Demo Analytics Dashboard:** Engagement metrics per demo
- **Customizable Demo Code:** Users can fork and modify demo code

### **Phase 4: Intelligence & Personalization** (Weeks 9-12)
- **Audience Profiling:** Adapt scripts by audience level (middle school / high school / college)
- **Topic Clustering:** Auto-detect and group related episodes
- **Recommendation Engine:** Suggest follow-up papers based on user history
- **Personalized Calendar:** Suggest posting times based on audience timezone/behavior
- **A/B Testing Agent:** Automatically test script variations
- **Feedback Loop:** Users rate content; agent learns preferences

### **Phase 5: Collaboration & Distribution** (Weeks 13-16)
- **User Authentication:** Multi-user accounts with team support
- **Sharing & Publishing:** Direct publishing to social platforms (Instagram, TikTok, LinkedIn)
  - OAuth integrations
  - Scheduling capabilities
  - Performance tracking
- **Collaboration Workflows:** Comment on episodes, assign tasks, review gates
- **Content Library:** Searchable archive of all past episodes
- **Export Options:** Download scripts, code, slides in multiple formats (PDF, PPTX, MD)

### **Phase 6: Advanced Features** (Weeks 17+)
- **Real-time Collaboration:** WebSocket-based co-editing
- **Voice-to-Text:** Generate scripts from voice notes
- **Interactive Transcription:** Edit video transcripts inline with video
- **Mobile App:** iOS/Android version for on-the-go content creation
- **API Layer:** Expose platform as API for external integrations
- **Custom LLM Fine-tuning:** Fine-tune models on Unicorn Labs voice/style
- **Batch Processing:** Queue multiple episode generations
- **Webhook Integrations:** Trigger workflows from external events

---

## 🎨 Brand & Voice

### **Core Brand Promise**
> We turn research papers into projects students can actually build.

### **Voice Characteristics**
- **Curious** — Start with genuine questions
- **Founder-led** — No corporate guru energy
- **Transparent** — Show the "why" not just the "what"
- **Practical** — Always end with something buildable

### **Content Requirements**
- ✅ One "wait, what?" moment per script
- ✅ Never hallucinate paper citations
- ✅ Maintain scientific accuracy while simplifying
- ✅ Each script should spark curiosity to learn more
- ⚠️ Avoid influencer-y language, overhyping

### **Visual Language**
- **Fonts:** DM Sans (body), Fraunces (display)
- **Color Scheme:** High contrast, accessible
- **Demo Interactions:** Smooth animations, intuitive controls
- **Icons:** Lucide React library

---

## 🔧 Infrastructure & Deployment

### **Development**
```bash
npm install
npm run dev
# Runs on http://localhost:3000
```

### **Production**
```bash
npm run build
npm run start
# Optimized for Vercel deployment
```

### **Database Setup**
```bash
# Apply migrations in order:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_seed_pillars_ctas.sql

# Seed sample data:
npm run seed
# Loads 30 example episodes from data/seed-episodes.json
```

### **Environment Variables**
```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public anon key
SUPABASE_SERVICE_ROLE_KEY          # Service role (server-only)
ANTHROPIC_API_KEY                  # Anthropic Claude API
OPENAI_API_KEY                     # OpenAI GPT API (optional)
```

---

## 📁 Project Structure

```
unicorn-labs-content-engine/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home (redirects to /dashboard)
│   ├── api/
│   │   ├── agents/               # Agent pipeline endpoints
│   │   │   ├── generate-episode/  # Full 7-stage pipeline
│   │   │   ├── scout/             # Research Scout only
│   │   │   ├── ingest/            # Paper ingestion
│   │   │   ├── build-webapp/      # Demo builder
│   │   │   ├── generate-calendar/ # Calendar scheduler
│   │   │   └── generate-from-idea/ # Ideation pipeline
│   │   ├── episodes/             # Episode CRUD
│   │   ├── settings/             # User preferences
│   │   └── ...
│   ├── dashboard/                # Main dashboard page
│   ├── episodes/                 # Episode management
│   │   ├── page.tsx              # List episodes
│   │   ├── new/page.tsx          # Create new episode
│   │   └── [id]/page.tsx         # View episode details
│   ├── papers/                   # Paper library
│   ├── calendar/                 # Content calendar
│   ├── agents/                   # Agent history & monitoring
│   ├── demos/                    # Interactive demos
│   └── settings/                 # Settings page
├── components/                   # React components
│   ├── layout/
│   ├── ui/                       # Shadcn-style primitives
│   ├── demos/                    # Demo component implementations
│   └── ...
├── lib/
│   ├── agents/                   # 7-agent implementations
│   │   ├── research-scout.ts
│   │   ├── paper-deconstruction.ts
│   │   ├── scriptwriting.ts
│   │   ├── demo-spec.ts
│   │   ├── demo-builder.ts
│   │   ├── calendar-strategist.ts
│   │   ├── quality-critic.ts
│   │   ├── orchestrator.ts       # Pipeline coordinator
│   │   ├── runner.ts             # Execution engine
│   │   └── types.ts              # Shared type definitions
│   ├── llm/                      # LLM provider abstraction
│   │   ├── provider.ts           # OpenAI/Anthropic unified API
│   │   └── ...
│   ├── demos/                    # Demo algorithms & registry
│   │   ├── algorithms/
│   │   │   ├── pagerank.ts
│   │   │   ├── collaborative-filter.ts
│   │   │   └── misinformation-spread.ts
│   │   └── registry.ts
│   ├── episodes/                 # Episode logic
│   ├── papers/                   # Paper management
│   ├── slides/                   # Presentation generation
│   ├── brand/                    # Brand voice config
│   ├── supabase/                 # DB queries
│   ├── kling/                    # Video generation (experimental)
│   ├── higgsfield/               # Other integrations
│   └── utils.ts
├── public/                       # Static assets
├── supabase/                     # SQL migrations
│   └── migrations/
├── data/                         # Seed data
│   └── seed-episodes.json        # 30 example episodes
├── scripts/                      # CLI utilities
│   └── seed-database.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── .env.local.example            # Environment template
└── README.md
```

---

## 🚦 Key Workflows

### **Workflow 1: New Paper → Published Episode**
1. User pastes paper text in Papers page
2. System extracts metadata and stores in DB
3. User clicks "Create Episode" for that paper
4. Trigger full 7-stage agent pipeline
5. Review outputs at each stage
6. Approve demo code for generation
7. Episode appears in Dashboard with viral score
8. User schedules via Calendar Strategist
9. Calendar generates 7/14/30-day posting plan
10. User publishes to social (coming soon)

### **Workflow 2: Manual Episode Creation from Scratch**
1. User goes to Episodes → New
2. Start with idea/topic (no paper)
3. Research Scout suggests 5 viral papers
4. User selects one to deconstruct
5. Full pipeline executes
6. User refines scripts, demo spec, calendar
7. Approve and publish

### **Workflow 3: Demo Exploration**
1. User navigates to /demos
2. Sees list of all interactive demonstrations
3. Clicks on a demo (e.g., PageRank)
4. Interactive component loads
5. User manipulates nodes/edges, sees real-time updates
6. Learns algorithm through play
7. Option to view source code or read article

### **Workflow 4: Analytics & Optimization**
1. User goes to Agent History page
2. Sees all past pipeline runs with costs/timing
3. Compares OpenAI vs Anthropic performance
4. Checks Dashboard for episode performance
5. Uses Quality Critic feedback to improve next episode
6. Adjusts Script Preferences for future generations

---

## 🎓 Educational Value Proposition

### **For Students:**
- Learn complex algorithms by building interactive demos
- Understand cutting-edge research through engaging scripts
- Build portfolio projects from curriculum-aligned content
- Access free educational resources

### **For Educators:**
- Turnkey lesson plans with scripts and demos
- Aligned with STEM curriculum standards
- Engagement metrics to track student interest
- Customizable difficulty levels (coming soon)

### **For Content Creators:**
- Automate 80% of content creation workflow
- Data-driven virality scoring
- Multi-format outputs (scripts, slides, code, social posts)
- Built-in audience testing framework

---

## 🔮 Vision (2026+)

### **Year 1 Goals:**
- 1,000+ episodes in library
- 50+ interactive demos
- 10K+ monthly active users
- 5M+ total demo interactions
- Integrated social publishing

### **Year 2+ Goals:**
- AI tutor that guides students through demos
- Peer collaboration features
- Educator marketplace (buy/sell lesson plans)
- University partnerships and accreditation
- Mobile-first experience
- Real-time multiplayer demo exploration
- Content recommendation engine powering discovery

---

## 📞 Support & Feedback

- **GitHub Issues:** Report bugs and feature requests
- **Roadmap:** See this file for planned features
- **Contributing:** Open to community contributions
- **License:** Private — The Unicorn Labs

---

**Last Updated:** June 2026
**Status:** MVP Phase (Phase 1)
**Next Review:** End of Q2 2026
