import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ContentSeriesTemplate,
  EpisodeRevision,
  EpisodeScore,
  ReferenceImage,
  StyleProfile,
  ViralEpisode,
  ViralEpisodeOutput,
  ViralStage,
} from "@/lib/supabase/types";

export interface ViralEpisodeListItem extends ViralEpisode {
  episode_scores?: EpisodeScore[];
  viral_episode_outputs?: { stage: ViralStage; status: string }[];
  critic_score?: number | null;
}

export async function getViralEpisodes(): Promise<ViralEpisodeListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const [{ data: episodes }, { data: critics }] = await Promise.all([
    supabase
      .from("viral_episodes")
      .select("*, episode_scores(*), viral_episode_outputs(stage, status)")
      .order("created_at", { ascending: false }),
    supabase
      .from("viral_episode_outputs")
      .select("viral_episode_id, output")
      .eq("stage", "virality_critic")
      .eq("status", "success"),
  ]);
  const criticById = new Map(
    (critics || []).map((c) => [
      c.viral_episode_id as string,
      (c.output as { overall_score?: number } | null)?.overall_score ?? null,
    ])
  );
  return ((episodes || []) as ViralEpisodeListItem[]).map((e) => ({
    ...e,
    critic_score: criticById.get(e.id) ?? null,
  }));
}

export async function getViralEpisode(id: string): Promise<ViralEpisode | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase()
    .from("viral_episodes")
    .select("*, content_series_templates(*), style_profiles(*), reference_images(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as ViralEpisode) || null;
}

export async function getViralEpisodeOutputs(id: string): Promise<ViralEpisodeOutput[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("viral_episode_outputs")
    .select("*")
    .eq("viral_episode_id", id);
  return (data || []) as ViralEpisodeOutput[];
}

export async function getEpisodeRevisions(id: string): Promise<EpisodeRevision[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("episode_revision_history")
    .select("*")
    .eq("viral_episode_id", id)
    .order("created_at", { ascending: false });
  return (data || []) as EpisodeRevision[];
}

export async function getEpisodeScore(id: string): Promise<EpisodeScore | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase()
    .from("episode_scores")
    .select("*")
    .eq("viral_episode_id", id)
    .maybeSingle();
  return (data as EpisodeScore) || null;
}

export async function getSeriesTemplates(): Promise<ContentSeriesTemplate[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("content_series_templates")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  return (data || []) as ContentSeriesTemplate[];
}

export async function getStyleProfiles(): Promise<StyleProfile[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("style_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []) as StyleProfile[];
}

export async function getReferenceImages(): Promise<ReferenceImage[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("reference_images")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []) as ReferenceImage[];
}

export interface ViralInsightRow {
  episode: ViralEpisode;
  score: EpisodeScore;
}

export async function getScoredEpisodes(): Promise<ViralInsightRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("episode_scores")
    .select("*, viral_episodes(*)")
    .order("updated_at", { ascending: false });
  return ((data || []) as (EpisodeScore & { viral_episodes: ViralEpisode })[])
    .filter((row) => row.viral_episodes)
    .map((row) => {
      const { viral_episodes, ...score } = row;
      return { episode: viral_episodes, score: score as EpisodeScore };
    });
}
