import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { SeriesStatus, ViralSeries, ViralStage } from "@/lib/supabase/types";
import type { ViralEpisodeListItem } from "@/lib/db/viral-queries";

export interface SeriesWithParts extends ViralSeries {
  parts: ViralEpisodeListItem[];
}

/** Attaches each series' episodes (ordered by part_number) with their stage progress. */
async function attachParts(series: ViralSeries[]): Promise<SeriesWithParts[]> {
  if (series.length === 0) return [];
  const ids = series.map((s) => s.id);
  const { data: episodes } = await getSupabase()
    .from("viral_episodes")
    .select("*, episode_scores(*), viral_episode_outputs(stage, status)")
    .in("series_id", ids)
    .order("part_number", { ascending: true });
  const bySeries = new Map<string, ViralEpisodeListItem[]>();
  for (const ep of (episodes || []) as ViralEpisodeListItem[]) {
    const key = ep.series_id as string;
    if (!bySeries.has(key)) bySeries.set(key, []);
    bySeries.get(key)!.push(ep);
  }
  return series.map((s) => ({ ...s, parts: bySeries.get(s.id) ?? [] }));
}

export async function getSeriesList(): Promise<SeriesWithParts[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("viral_series")
    .select("*")
    .eq("vertical", "labs")
    .order("created_at", { ascending: false });
  return attachParts((data || []) as ViralSeries[]);
}

export async function getSeriesWithParts(id: string): Promise<SeriesWithParts | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase()
    .from("viral_series")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [withParts] = await attachParts([data as ViralSeries]);
  return withParts ?? null;
}

export async function updateSeriesStatus(id: string, status: SeriesStatus): Promise<void> {
  const { error } = await getSupabase()
    .from("viral_series")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Stage counts for a part, used by the series board progress meter. */
export function partProgress(part: ViralEpisodeListItem): { done: number; total: number } {
  const stages = (part.viral_episode_outputs || []) as { stage: ViralStage; status: string }[];
  return {
    done: stages.filter((s) => s.status === "success").length,
    total: stages.length || 9,
  };
}
