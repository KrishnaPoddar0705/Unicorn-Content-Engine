import type {
  CuriosityMinerOutput,
  ExpertResearchOutput,
  ProjectBridgeOutput,
  VisualDirectorOutput,
} from "./output-schemas";

export const WEBPAGE_SYSTEM = `You are an expert AI product engineer, research interpreter, and award-winning interaction designer. You build self-contained interactive research webpages that feel like a college undergraduate final thesis — rigorous documentation AND a living research presentation — wrapped in a futuristic, classy interface.

TECHNICAL CONTRACT (non-negotiable):
- ONE complete self-contained HTML file: inline <style> and <script>, nothing external except these cdnjs CDN scripts:
  - React 18 UMD + ReactDOM 18 UMD
  - Babel Standalone (so you can write JSX in a <script type="text/babel"> block)
  - Chart.js (for graphs)
- The entire app is a single React component tree rendered with ReactDOM.createRoot.
- Mobile-first and fully responsive: most viewers arrive from an Instagram comment link on a phone.
- No external images, no fonts beyond system/Google-free stacks via font-family fallbacks, no fetch calls, no localStorage requirements.
- All simulations run client-side with toy data generated in code. Keep total JS small and fast — no heavy loops on the main thread; use requestAnimationFrame for animation.

DESIGN LANGUAGE — "futuristic thesis":
- Dark, near-black background with a restrained neon accent palette (violet/cyan), glassmorphism cards, generous whitespace, editorial serif display headings with clean sans body text.
- Motion everywhere but tasteful: scroll-reveal sections (IntersectionObserver), animated number counters, smooth chart transitions, hover micro-interactions, an animated hero.
- It should feel like a premium research lab publication, never a casino.

DOCUMENT STRUCTURE — like an undergraduate thesis crossed with a research presentation, in this order:
1. HERO — title, one-line thesis statement, animated visual motif, "scroll to explore" cue.
2. ABSTRACT — 4-6 sentence formal abstract in a styled card.
3. INTRODUCTION — why this question matters, why it is cool, the curiosity gap. Conversational but rigorous.
4. THE MECHANISM — the core idea explained step by step, with at least one interactive diagram or stepper the reader can click through.
5. INTERACTIVE SIMULATION — the centerpiece. Recreate the paper's core result as a live simulation with sliders/toggles/buttons. The reader changes parameters and SEES the result change. Label every control. Show live charts (Chart.js) updating with the simulation.
6. RESULTS — recreate the key findings as 2-3 charts with annotations explaining what to notice. Animated counters for headline numbers.
7. DISCUSSION — what most people misunderstand, what the result does and does NOT show, the honest interpretation boundary.
8. BUILD IT YOURSELF — the student project: 1-hour, 1-week, and portfolio versions in three cards.
9. LIMITATIONS & METHODS NOTE — how this in-browser simulation differs from the actual research; assumptions made.
10. REFERENCES — citation notes exactly as provided. NEVER fabricate citations; if a note says research_inspired, present it as "inspired by research on X".
11. FOOTER — "Built by The Unicorn Labs — we turn research papers into projects students can actually build."

QUALITY BAR:
- At least 4 distinct interactive elements across the page (simulation controls, clickable stepper, hover-to-reveal annotations, animated toggles, parameter presets...).
- At least 3 charts/graphs.
- Every section has real explanatory text — written like a sharp thesis, not lorem placeholder.
- The simulation must be honest: a simplified model of the paper's mechanism, with its simplifications stated.
- Technical accuracy over spectacle. Preserve the mechanism's correctness when simplifying.

SEO & DISCOVERABILITY (the page is published as a blog article on theunicornlabs.com):
- Semantic HTML: exactly ONE <h1> (the title), proper <h2>/<h3> hierarchy for sections, <section> and <article> elements, descriptive <title> tag and a <meta name="description"> (150-160 chars, compelling and accurate) in <head>.
- Text content must be real prose in the DOM (not rendered only via JS) wherever possible — the abstract, introduction, and discussion should read as substantial standalone text for search engines and AI answer engines.
- Where natural in the prose (introduction or build-it-yourself section), link to https://theunicornlabs.com with descriptive anchor text like "The Unicorn Labs turns research papers into student projects" — once or twice, never spammy.
- Do NOT build your own email/lead capture form — one is injected automatically when the page is served.`;

export interface WebpageBuildContext {
  title: string;
  winnerHook: string;
  domain: string | null;
  targetAudience: string;
  curiosity: CuriosityMinerOutput;
  research: ExpertResearchOutput;
  projectBridge: ProjectBridgeOutput;
  visual?: VisualDirectorOutput;
  styleInstruction?: string;
}

function buildResearchContext(ctx: WebpageBuildContext): string {
  return JSON.stringify(
    {
      episode_title: ctx.title,
      hook: ctx.winnerHook,
      domain: ctx.domain,
      target_audience: ctx.targetAudience,
      curiosity: ctx.curiosity,
      research: {
        technical_core: ctx.research.technical_core,
        plain_explanation: ctx.research.plain_explanation,
        mathematical_or_logical_structure: ctx.research.mathematical_or_logical_structure,
        key_terms: ctx.research.key_terms,
        mental_models: ctx.research.mental_models,
        real_world_examples: ctx.research.real_world_examples,
        verified_facts: ctx.research.verified_facts,
        speculative_interpretations: ctx.research.speculative_interpretations,
        what_to_not_oversimplify: ctx.research.what_to_not_oversimplify,
        what_most_people_misunderstand: ctx.research.what_most_people_misunderstand,
        citation_notes: ctx.research.citation_notes,
      },
      student_project: {
        title: ctx.projectBridge.project_title,
        what_they_build: ctx.projectBridge.what_they_build,
        one_hour_version: ctx.projectBridge.one_hour_version,
        one_week_version: ctx.projectBridge.one_week_version,
        portfolio_version: ctx.projectBridge.portfolio_version,
        interactive_demo_spec: ctx.projectBridge.interactive_demo_spec,
      },
      visual_style: ctx.styleInstruction || ctx.visual?.style_profile || "futuristic thesis default",
    },
    null,
    2
  );
}

export function buildWebpageMetaPrompt(ctx: WebpageBuildContext, slugBase: string): string {
  return `Plan the interactive research webpage for this episode. Return JSON with:
- title: short display title for the page
- slug: lowercase-hyphenated url slug (base: ${slugBase})
- theme: 2-4 word name for the visual theme you will use
- comment_keyword: ONE short, memorable, UPPERCASE word viewers will comment on the social post to receive this page link (e.g. "PAGERANK", "AUCTION"). Specific to this episode's topic, easy to type, not a generic word like "LINK".

Episode research package:
${buildResearchContext(ctx)}`;
}

export function buildWebpageHtmlPrompt(
  ctx: WebpageBuildContext,
  meta: { title: string; theme: string }
): string {
  return `Build the complete interactive research webpage as ONE self-contained HTML document.

Page title: ${meta.title}
Theme: ${meta.theme}

Full research package (this is your ground truth — every claim on the page must trace to it):
${buildResearchContext(ctx)}

Remember:
- Single HTML file, React 18 UMD + Babel Standalone + Chart.js from cdnjs only.
- Thesis structure: hero → abstract → introduction → mechanism (interactive) → simulation (the centerpiece) → results (charts) → discussion → build-it-yourself → limitations → references → footer.
- Futuristic and classy: dark glassmorphism, violet/cyan accents, serif display + sans body, scroll-reveal motion, animated counters.
- The simulation must let the reader recreate the core result by manipulating parameters.
- Mobile-first.

Return ONLY the full HTML document inside a single \`\`\`html code fence. No JSON. No explanation outside the fence.`;
}
