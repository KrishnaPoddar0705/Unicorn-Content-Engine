import { extractHtml } from "@/lib/llm/extract-html";
import { getSupabase } from "@/lib/supabase/server";

export function parseHtmlFromResponse(htmlRaw: string): string {
  try {
    return extractHtml(htmlRaw);
  } catch {
    const docMatch =
      htmlRaw.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i) || htmlRaw.match(/(<html[\s\S]*?<\/html>)/i);
    if (docMatch) return docMatch[1].trim();
    throw new Error("No HTML document found in model response");
  }
}

export function normalizeWebappSlug(slug: string, episodeNumber: number): string {
  const cleaned =
    slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "") || `webapp-${episodeNumber}`;
  return `${cleaned}-e${episodeNumber}`;
}

export async function saveInteractiveWebpage(params: {
  episodeId: string;
  paperId: string;
  episodeNumber: number;
  title: string;
  theme: string;
  slug: string;
  html: string;
}) {
  const supabase = getSupabase();
  const slug = normalizeWebappSlug(params.slug, params.episodeNumber);

  await supabase.from("interactive_webpages").delete().eq("episode_id", params.episodeId);

  const { data, error } = await supabase
    .from("interactive_webpages")
    .insert({
      episode_id: params.episodeId,
      paper_id: params.paperId,
      slug,
      title: params.title,
      theme: params.theme,
      html_content: params.html,
      status: "published",
      updated_at: new Date().toISOString(),
    })
    .select("slug, title, theme")
    .single();

  if (error) throw error;
  return data;
}

export async function recoverInteractiveWebpageFromAgentRun(episodeId: string) {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("interactive_webpages")
    .select("slug, title, theme")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (existing) return existing;

  const { data: metaRun } = await supabase
    .from("agent_runs")
    .select("output")
    .eq("episode_id", episodeId)
    .eq("agent_name", "interactive_webpage_meta")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: htmlRun } = await supabase
    .from("agent_runs")
    .select("output")
    .eq("episode_id", episodeId)
    .eq("agent_name", "interactive_webpage")
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const htmlRaw = (htmlRun?.output as Record<string, string> | null)?.html_raw;
  const meta = metaRun?.output as { title?: string; slug?: string; theme?: string } | null;

  if (!htmlRaw || !meta?.title) return null;

  const { data: episode } = await supabase
    .from("episodes")
    .select("episode_number, paper_id")
    .eq("id", episodeId)
    .single();

  if (!episode?.paper_id) return null;

  const html = parseHtmlFromResponse(htmlRaw);

  return saveInteractiveWebpage({
    episodeId,
    paperId: episode.paper_id,
    episodeNumber: episode.episode_number,
    title: meta.title,
    theme: meta.theme || "research dashboard",
    slug: meta.slug || `webapp-${episode.episode_number}`,
    html,
  });
}
