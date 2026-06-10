import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { EpisodeScore, ViralEpisode } from "@/lib/supabase/types";

interface ScoredEpisode {
  episode: Pick<
    ViralEpisode,
    "title" | "domain" | "tone" | "winner_hook" | "winner_archetype"
  > & { series_slug?: string };
  score: EpisodeScore;
  engagement: number | null;
}

function compositeEngagement(s: EpisodeScore): number | null {
  if (!s.views || s.views <= 0) return null;
  const saves = s.saves ?? 0;
  const shares = s.shares ?? 0;
  const comments = s.comments ?? 0;
  const likes = s.likes ?? 0;
  return (saves * 4 + shares * 4 + comments * 2 + likes) / s.views;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/**
 * Builds "Krishna's content memory" — a compact summary of what has actually
 * performed, injected into generation prompts. Computed live (single user,
 * small data). Returns "" until at least 3 episodes have scores.
 */
export async function buildContentMemorySummary(): Promise<string> {
  if (!isSupabaseConfigured()) return "";

  const { data: scores } = await getSupabase()
    .from("episode_scores")
    .select("*, viral_episodes(title, domain, tone, winner_hook, winner_archetype, content_series_templates(slug))")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (!scores || scores.length < 3) return "";

  const scored: ScoredEpisode[] = scores.flatMap((row): ScoredEpisode[] => {
    const ep = (row as Record<string, unknown>).viral_episodes as
      | (ScoredEpisode["episode"] & { content_series_templates?: { slug: string } })
      | null;
    if (!ep) return [];
    return [
      {
        episode: { ...ep, series_slug: ep.content_series_templates?.slug },
        score: row as EpisodeScore,
        engagement: compositeEngagement(row as EpisodeScore),
      },
    ];
  });

  if (scored.length < 3) return "";

  const ranked = [...scored].sort((a, b) => {
    const ae = a.engagement ?? -1;
    const be = b.engagement ?? -1;
    if (ae !== be) return be - ae;
    return (b.score.krishna_rating ?? 0) - (a.score.krishna_rating ?? 0);
  });

  const top = ranked.slice(0, 5);
  const bottom = ranked.slice(-3).reverse();

  const describe = (s: ScoredEpisode) => {
    const parts = [
      `"${s.episode.winner_hook || s.episode.title}"`,
      s.episode.domain ? `domain: ${s.episode.domain}` : "",
      s.episode.winner_archetype ? `archetype: ${s.episode.winner_archetype}` : "",
      s.engagement !== null ? `engagement: ${pct(s.engagement)}` : "",
      s.score.krishna_rating ? `Krishna rating: ${s.score.krishna_rating}/10` : "",
    ].filter(Boolean);
    return `- ${parts.join(" | ")}`;
  };

  const byKey = (key: (s: ScoredEpisode) => string | null | undefined) => {
    const groups = new Map<string, number[]>();
    for (const s of scored) {
      const k = key(s);
      if (!k || s.engagement === null) continue;
      groups.set(k, [...(groups.get(k) ?? []), s.engagement]);
    }
    return [...groups.entries()]
      .map(([k, vals]) => ({ k, avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length }))
      .sort((a, b) => b.avg - a.avg);
  };

  const domains = byKey((s) => s.episode.domain);
  const archetypes = byKey((s) => s.episode.winner_archetype);

  return `## Krishna's content memory (what has actually performed)
This is real performance data from past episodes. Lean into the winning patterns, avoid repeating the weak ones — but still take ONE deliberate creative risk per piece; do not converge into formula.

TOP PERFORMERS:
${top.map(describe).join("\n")}

WEAKEST:
${bottom.map(describe).join("\n")}
${
    domains.length > 0
      ? `\nDOMAINS by avg engagement: ${domains.map((d) => `${d.k} (${pct(d.avg)}, n=${d.n})`).join(", ")}`
      : ""
  }${
    archetypes.length > 0
      ? `\nHOOK ARCHETYPES by avg engagement: ${archetypes.map((a) => `"${a.k}" (${pct(a.avg)}, n=${a.n})`).join(", ")}`
      : ""
  }`;
}
