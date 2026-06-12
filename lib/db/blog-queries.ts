import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export interface BlogPost {
  id: string;
  blog_slug: string;
  slug: string;
  title: string;
  theme: string | null;
  description: string;
  domain: string | null;
  cover_image_url: string | null;
  created_at: string;
}

interface WebpageRow {
  id: string;
  blog_slug: string | null;
  slug: string;
  title: string;
  theme: string | null;
  cover_image_url: string | null;
  created_at: string;
  viral_episodes: { winner_hook: string | null; domain: string | null } | null;
  episodes: { viral_hook: string | null; topic: string | null } | null;
}

/** Domain labels are short chips — long topic paragraphs (old-pipeline episodes) must not leak in. */
function cleanDomain(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v || v.length > 24 || /[\n.:;—]/.test(v)) return null;
  return v;
}

function toBlogPost(row: WebpageRow): BlogPost | null {
  if (!row.blog_slug) return null;
  return {
    id: row.id,
    blog_slug: row.blog_slug,
    slug: row.slug,
    title: row.title,
    theme: row.theme,
    description:
      row.viral_episodes?.winner_hook ||
      row.episodes?.viral_hook ||
      `An interactive research breakdown: ${row.title}. Explore the mechanism, run the simulation, and build it yourself.`,
    domain: cleanDomain(row.viral_episodes?.domain) || cleanDomain(row.episodes?.topic),
    cover_image_url: row.cover_image_url || null,
    created_at: row.created_at,
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await getSupabase()
    .from("interactive_webpages")
    .select(
      "id, blog_slug, slug, title, theme, cover_image_url, created_at, viral_episodes(winner_hook, domain), episodes(viral_hook, topic)"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return ((data || []) as unknown as WebpageRow[])
    .map(toBlogPost)
    .filter((p): p is BlogPost => p !== null);
}

export async function getBlogPostBySlug(
  blogSlug: string
): Promise<(BlogPost & { html_content: string }) | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase()
    .from("interactive_webpages")
    .select(
      "id, blog_slug, slug, title, theme, cover_image_url, created_at, html_content, viral_episodes(winner_hook, domain), episodes(viral_hook, topic)"
    )
    .eq("blog_slug", blogSlug)
    .maybeSingle();
  if (!data) return null;
  const post = toBlogPost(data as unknown as WebpageRow);
  if (!post) return null;
  return { ...post, html_content: (data as { html_content: string }).html_content };
}
