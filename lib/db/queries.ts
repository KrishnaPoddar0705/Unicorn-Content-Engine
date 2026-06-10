import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getDashboardStats() {
  if (!isSupabaseConfigured()) return getEmptyDashboard();

  const supabase = getSupabase();

  const [
    { count: episodeCount },
    { count: draftCount },
    { count: paperCount },
    { count: demoPending },
    { data: upcoming },
    { data: scores },
    { data: pillars },
    { data: episodes },
  ] = await Promise.all([
    supabase.from("episodes").select("*", { count: "exact", head: true }),
    supabase.from("episodes").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("papers").select("*", { count: "exact", head: true }),
    supabase
      .from("episodes")
      .select("*", { count: "exact", head: true })
      .in("demo_build_status", ["not_started", "spec_ready", "building"]),
    supabase
      .from("calendar_items")
      .select("*, episodes(*)")
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .order("scheduled_date")
      .limit(7),
    supabase.from("quality_scores").select("overall_viral_score"),
    supabase.from("content_pillars").select("*"),
    supabase.from("episodes").select("content_pillar_id, lead_magnet_angle, status"),
  ]);

  const avgViral =
    scores && scores.length > 0
      ? Math.round(
          (scores.reduce((s, q) => s + Number(q.overall_viral_score), 0) / scores.length) * 10
        ) / 10
      : 0;

  const pillarDist: Record<string, number> = {};
  (pillars || []).forEach((p) => {
    pillarDist[p.code] = 0;
  });
  (episodes || []).forEach((e) => {
    const pillar = pillars?.find((p) => p.id === e.content_pillar_id);
    if (pillar) pillarDist[pillar.code] = (pillarDist[pillar.code] || 0) + 1;
  });

  const leadMagnets = (episodes || [])
    .filter((e) => e.lead_magnet_angle)
    .slice(0, 5)
    .map((e) => e.lead_magnet_angle);

  return {
    episodeCount: episodeCount || 0,
    draftCount: draftCount || 0,
    paperCount: paperCount || 0,
    demoPending: demoPending || 0,
    avgViral,
    upcoming: upcoming || [],
    pillarDist,
    pillars: pillars || [],
    leadMagnets,
  };
}

function getEmptyDashboard() {
  return {
    episodeCount: 0,
    draftCount: 0,
    paperCount: 0,
    demoPending: 0,
    avgViral: 0,
    upcoming: [],
    pillarDist: {},
    pillars: [],
    leadMagnets: [],
  };
}

export async function getPapers() {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("papers")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getPaper(id: string) {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase().from("papers").select("*").eq("id", id).single();
  return data;
}

export async function getEpisodes() {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("episodes")
    .select("*, content_pillars(*), quality_scores(overall_viral_score), papers(title)")
    .order("episode_number");
  return data || [];
}

export async function getEpisode(id: string) {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase()
    .from("episodes")
    .select("*, content_pillars(*), papers(*), scripts(*), demos(*), quality_scores(*)")
    .eq("id", id)
    .single();
  return data;
}

export async function getInteractiveWebpageForEpisode(episodeId: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  const { data } = await supabase
    .from("interactive_webpages")
    .select("slug, title, theme, status")
    .eq("episode_id", episodeId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data;

  const { recoverInteractiveWebpageFromAgentRun } = await import(
    "@/lib/agents/save-interactive-webpage"
  );
  try {
    return await recoverInteractiveWebpageFromAgentRun(episodeId);
  } catch {
    return null;
  }
}

export async function getDemos() {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase().from("demos").select("*, episodes(title, episode_number)").order("title");
  return data || [];
}

export async function getCalendarItems() {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("calendar_items")
    .select("*, episodes(*, content_pillars(*), scripts(caption, cta), papers(title))")
    .order("scheduled_date");
  return data || [];
}

export async function getAgentRuns() {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("agent_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
}

export async function getSettings() {
  if (!isSupabaseConfigured()) {
    return {
      llm_provider: "anthropic",
      openai_model: "gpt-4o",
      anthropic_model: "claude-opus-4-8",
      brand_voice_overrides: {},
      content_preferences: {},
    };
  }
  const { data } = await getSupabase().from("settings").select("*").limit(1).single();
  return data;
}
