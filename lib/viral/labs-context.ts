import { getSupabase } from "@/lib/supabase/server";
import type { ExpertResearchOutput } from "@/lib/prompts/viral/output-schemas";
import type { SeriesArc, ViralEpisode } from "@/lib/supabase/types";

/**
 * The Unicorn Labs house DNA. Injected into every "labs"-vertical pipeline stage
 * (via buildSharedContext's brandSnippet). Encodes the voice of the example reels:
 * first-principles reframing, explicit interdisciplinary bridges, and India +
 * founder framing — for an audience of students, builders, founders, and investors.
 */
export const UNICORN_LABS_BRAND = `THE UNICORN LABS — DEEP-TECH SERIES DNA (non-negotiable house style):

You are writing for The Unicorn Labs: long-arc, multi-part, first-principles explanations of deep-tech sectors nobody explains well — and how they connect to economics, society, philosophy, business, and equity markets. The audience is India's ambitious class: students, builders, founders, and investors who are comfortable with technical depth and think in terms of structural advantage.

1. FIRST-PRINCIPLES REFRAME. Open by displacing the common wrong mental model before building the correct one. Name the intuitive-but-wrong picture ("most people think X is a speed problem — it's actually a representation problem") and show why it breaks. Critique analogies when they fail rather than endorsing them. Explain WHY a mechanism works, traced to its root, not just THAT it works.

2. INTERDISCIPLINARY BRIDGES (required, explicit). Every piece must draw at least one concrete cross-field connection the way the reels do: physics ↔ computer science, energy ↔ geopolitics, capital ↔ sovereignty, biology ↔ computation ↔ economics, defense ↔ commercial. The "interdisciplinary collision" is part of the substance, not decoration. Make the bridge load-bearing.

3. INDIA + FOUNDER FRAMING. Connect the topic to India's strategic position — where the structural advantage or constraint is (talent, capital, energy, spectrum, sovereignty), what it means for an Indian student/builder/founder/investor specifically. Where real, name actual companies or founders building in the space (and you may use the example-reel move of teasing a founder conversation), but never fabricate names — if unsure, say "founders building in this space" rather than inventing one.

4. INTELLECTUAL HONESTY. Separate verified mechanism from interpretation. Acknowledge tradeoffs and where frameworks are incomplete. The gap between what something shows and what it might mean is content, not something to hide. Rigor without gatekeeping: use real terminology, then translate it — never dumb it down, make it CLEAR.

The intelligence of the content IS the hook. No guru energy, no "game-changer" filler.`;

interface PriorPartSummary {
  part_number: number;
  title: string;
  summary: string;
}

/**
 * Builds the Unicorn Labs context injected into a labs episode's pipeline stages:
 * the brand DNA always, plus per-part series continuity (recap of prior parts and
 * the cliffhanger into the next) when the episode belongs to a series.
 */
export async function buildLabsContext(
  episode: ViralEpisode
): Promise<{ brandSnippet: string; seriesContext?: string }> {
  if (!episode.series_id || episode.part_number == null) {
    return { brandSnippet: UNICORN_LABS_BRAND };
  }

  const supabase = getSupabase();

  const { data: series } = await supabase
    .from("viral_series")
    .select("title, premise, arc")
    .eq("id", episode.series_id)
    .maybeSingle();

  const arc = (series?.arc as SeriesArc | undefined) ?? undefined;
  const thisPart = arc?.parts?.find((p) => p.part_number === episode.part_number);

  // Prior parts of this series, in order, with a one-line summary each.
  const { data: priorEpisodes } = await supabase
    .from("viral_episodes")
    .select("id, title, part_number")
    .eq("series_id", episode.series_id)
    .lt("part_number", episode.part_number)
    .order("part_number", { ascending: true });

  const priorSummaries: PriorPartSummary[] = [];
  if (priorEpisodes && priorEpisodes.length > 0) {
    const ids = priorEpisodes.map((e) => e.id as string);
    const { data: researchRows } = await supabase
      .from("viral_episode_outputs")
      .select("viral_episode_id, output")
      .eq("stage", "expert_research")
      .eq("status", "success")
      .in("viral_episode_id", ids);
    const researchById = new Map(
      (researchRows || []).map((r) => [
        r.viral_episode_id as string,
        (r.output as ExpertResearchOutput | null)?.plain_explanation ?? null,
      ])
    );
    for (const ep of priorEpisodes) {
      const arcPart = arc?.parts?.find((p) => p.part_number === ep.part_number);
      const summary =
        researchById.get(ep.id as string) || arcPart?.covers || "(covered earlier in the series)";
      priorSummaries.push({
        part_number: ep.part_number as number,
        title: ep.title as string,
        summary: String(summary).slice(0, 600),
      });
    }
  }

  const lines: string[] = [
    `SERIES CONTINUITY — this is Part ${episode.part_number} of "${series?.title ?? episode.title}".`,
  ];
  if (series?.premise) lines.push(`Series premise: ${series.premise}`);

  if (priorSummaries.length > 0) {
    lines.push(
      "Previous parts already established (do NOT re-explain from scratch — build on them):"
    );
    for (const p of priorSummaries) {
      lines.push(`- Part ${p.part_number} (${p.title}): ${p.summary}`);
    }
    lines.push(
      'OPEN this part with a one-to-two-line recap that explicitly references the earlier part(s), in the voice of the example reels ("We established in episode one that…"). Then move forward.'
    );
  } else {
    lines.push(
      "This is the opening part — set up the series premise and the question the whole arc will answer."
    );
  }

  if (thisPart) {
    lines.push(`THIS part must cover: ${thisPart.covers}`);
    if (thisPart.first_principles_reframe)
      lines.push(`First-principles reframe to lead with: ${thisPart.first_principles_reframe}`);
    if (thisPart.interdisciplinary_bridges?.length)
      lines.push(
        `Interdisciplinary bridge(s) to draw: ${thisPart.interdisciplinary_bridges.join("; ")}`
      );
    if (thisPart.india_angle) lines.push(`India / founder angle: ${thisPart.india_angle}`);
    if (thisPart.teases_next)
      lines.push(
        `END by teasing the next part as a cliffhanger ("next week / in the next episode…"): ${thisPart.teases_next}`
      );
  }

  return { brandSnippet: UNICORN_LABS_BRAND, seriesContext: lines.join("\n") };
}
