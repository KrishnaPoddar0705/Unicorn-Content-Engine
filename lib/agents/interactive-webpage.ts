import { z } from "zod";
import { runAgent, runAgentText } from "./runner";
import { parseHtmlFromResponse } from "@/lib/agents/save-interactive-webpage";
import type { Deconstruction } from "./types";
import type { Paper } from "@/lib/supabase/types";

const WebpageMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  theme: z.string(),
});

export type InteractiveWebpageOutput = {
  title: string;
  slug: string;
  theme: string;
  html: string;
};

const WEBAPP_SYSTEM = `You are an expert AI product engineer, research interpreter, and modern UI designer.

Given a research paper, build a mobile-optimized interactive webpage that recreates the paper's key results and lets users simulate or experiment with the core idea.

Requirements for the HTML document:
- Complete self-contained single-file HTML with inline <style> and <script>
- Optional CDN: Chart.js from cdnjs only
- Mobile-first layout, readable typography, smooth interactions
- Clear sections: main claim, method, dataset, results
- Interactive simulation with sliders, dropdowns, toggles, or inputs
- "What this means" cards in simple language
- Final section: limitations, assumptions, how simulation differs from actual paper
- Pick one theme: cyberpunk lab, Apple minimalism, Bloomberg terminal, AI research dashboard, playful Duolingo-style, dark academia, glassmorphism, or futuristic classroom

Prioritize clarity, interactivity, and viral visual appeal.`;

function buildPaperContext(
  paper: Paper,
  deconstruction: Deconstruction | null,
  episodeTitle: string
): string {
  return JSON.stringify(
    {
      episode_title: episodeTitle,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      abstract: paper.abstract,
      core_idea: paper.core_idea,
      metadata: paper.metadata,
      deconstruction,
    },
    null,
    2
  );
}

export async function buildInteractiveWebpage(
  paper: Paper,
  deconstruction: Deconstruction | null,
  episodeTitle: string,
  context?: { pipelineId?: string; episodeId?: string; paperId?: string }
): Promise<InteractiveWebpageOutput> {
  const paperJson = buildPaperContext(paper, deconstruction, episodeTitle);
  const slugBase = episodeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  const { output: meta } = await runAgent({
    agentName: "interactive_webpage_meta",
    userPrompt: `Plan a mobile interactive webpage for this paper. Return JSON with title (short), slug (lowercase-hyphenated, base: ${slugBase}), and theme (design theme name).

Paper:
${paperJson}`,
    schema: WebpageMetaSchema,
    context,
    extraSystem: WEBAPP_SYSTEM,
    temperature: 0.7,
  });

  const { content: htmlRaw } = await runAgentText({
    agentName: "interactive_webpage",
    userPrompt: `Build the complete interactive webpage HTML for this paper.

Title: ${meta.title}
Theme: ${meta.theme}

Paper:
${paperJson}

Return ONLY the full HTML document inside a single \`\`\`html code fence. No JSON. No explanation outside the fence.`,
    context,
    extraSystem: WEBAPP_SYSTEM,
    maxTokens: 20000,
    temperature: 0.8,
  });

  const html = parseHtmlFromResponse(htmlRaw);

  return {
    title: meta.title,
    slug: meta.slug,
    theme: meta.theme,
    html,
  };
}
