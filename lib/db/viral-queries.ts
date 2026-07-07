import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ContentSeriesTemplate,
  ContentVertical,
  EpisodeRevision,
  EpisodeScore,
  IdeaStatus,
  ReferenceImage,
  StyleProfile,
  ViralEpisode,
  ViralEpisodeOutput,
  ViralIdea,
  ViralStage,
} from "@/lib/supabase/types";
import type { ScoutedIdea } from "@/lib/agents/viral/idea-scout";

export interface ViralEpisodeListItem extends ViralEpisode {
  episode_scores?: EpisodeScore[];
  viral_episode_outputs?: { stage: ViralStage; status: string }[];
  critic_score?: number | null;
}

export async function getViralEpisodes(
  vertical: ContentVertical = "viral"
): Promise<ViralEpisodeListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabase();
  const [{ data: episodes }, { data: critics }] = await Promise.all([
    supabase
      .from("viral_episodes")
      .select("*, episode_scores(*), viral_episode_outputs(stage, status)")
      .eq("vertical", vertical)
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

export async function getScoredEpisodes(
  vertical: ContentVertical = "viral"
): Promise<ViralInsightRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("episode_scores")
    .select("*, viral_episodes!inner(*)")
    .eq("viral_episodes.vertical", vertical)
    .order("updated_at", { ascending: false });
  return ((data || []) as (EpisodeScore & { viral_episodes: ViralEpisode })[])
    .filter((row) => row.viral_episodes)
    .map((row) => {
      const { viral_episodes, ...score } = row;
      return { episode: viral_episodes, score: score as EpisodeScore };
    });
}

// ---- Viral Ideas bank ----

export async function getViralIdeas(
  status?: IdeaStatus,
  vertical: ContentVertical = "viral"
): Promise<ViralIdea[]> {
  if (!isSupabaseConfigured()) return [];
  let query = getSupabase().from("viral_ideas").select("*").eq("vertical", vertical);
  if (status) query = query.eq("status", status);
  const { data } = await query
    .order("virality_score", { ascending: false })
    .order("created_at", { ascending: false });
  return (data || []) as ViralIdea[];
}

export async function insertViralIdeas(
  ideas: ScoutedIdea[],
  vertical: ContentVertical = "viral"
): Promise<ViralIdea[]> {
  if (ideas.length === 0) return [];
  const rows = ideas.map((idea) => ({
    title: idea.title,
    hook: idea.hook ?? null,
    summary: idea.summary,
    fields: idea.fields ?? [],
    domain: idea.domain ?? null,
    why_viral: idea.why_viral ?? null,
    virality_score: idea.virality_score ?? 0,
    source_urls: idea.source_urls ?? [],
    audience: idea.audience ?? null,
    vertical,
  }));
  const { data, error } = await getSupabase().from("viral_ideas").insert(rows).select("*");
  if (error) throw new Error(error.message);
  return (data || []) as ViralIdea[];
}

export async function updateIdeaStatus(
  id: string,
  status: IdeaStatus,
  viralEpisodeId?: string | null
): Promise<void> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (viralEpisodeId !== undefined) patch.viral_episode_id = viralEpisodeId;
  const { error } = await getSupabase().from("viral_ideas").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}
