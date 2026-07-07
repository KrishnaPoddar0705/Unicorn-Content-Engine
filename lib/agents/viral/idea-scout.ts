import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { parseJSON } from "@/lib/llm/parse-json";
import { IDEA_SCOUT_SYSTEM, buildIdeaScoutUserPrompt } from "@/lib/prompts/viral/idea-scout";

/**
 * Idea Scout — finds current, real, interdisciplinary reel ideas using Claude's
 * server-side web_search tool, scores them for virality, and returns structured
 * candidates. This calls the Anthropic SDK directly (not the generic LLM provider)
 * because the provider abstraction does not pass tools.
 */

const ScoutedIdeaSchema = z.object({
  title: z.string().min(1),
  hook: z.string().nullish(),
  summary: z.string().min(1),
  fields: z.array(z.string()).default([]),
  domain: z.string().nullish(),
  why_viral: z.string().nullish(),
  virality_score: z.coerce.number().int().min(0).max(100).default(0),
  source_urls: z.array(z.string()).default([]),
  audience: z.string().nullish(),
});

const ScoutResultSchema = z.array(ScoutedIdeaSchema);

export type ScoutedIdea = z.infer<typeof ScoutedIdeaSchema>;

const MODEL = "claude-opus-4-8";

export async function scoutViralIdeas(params: {
  domain?: string | null;
  count?: number;
}): Promise<ScoutedIdea[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const count = Math.min(Math.max(params.count ?? 6, 1), 12);
  const client = new Anthropic({ apiKey });

  const message = await client.messages
    .stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: IDEA_SCOUT_SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: count * 2 + 2 }],
      messages: [
        {
          role: "user",
          content: buildIdeaScoutUserPrompt({ domain: params.domain, count }),
        },
      ],
    })
    .finalMessage();

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Idea Scout returned no text output. The web_search tool may be unavailable.");
  }

  const ideas = parseJSON(text, ScoutResultSchema);
  return [...ideas].sort((a, b) => b.virality_score - a.virality_score);
}
