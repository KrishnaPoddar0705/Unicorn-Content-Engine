import { randomUUID } from "crypto";
import { generateSlideImage, isKlingConfigured } from "@/lib/kling/generate-slide-image";
import { getSupabase } from "@/lib/supabase/server";

const COVERS_BUCKET = "covers";

export function buildCoverImagePrompt(params: {
  title: string;
  description?: string | null;
  domain?: string | null;
}): string {
  return `Modern abstract art editorial cover for a research article titled "${params.title}"${
    params.domain ? ` in the field of ${params.domain}` : ""
  }. Contemporary museum-grade abstraction inspired by the topic: ${
    params.description?.slice(0, 200) || params.title
  }. Visual language: particle constellations of tiny geometric shapes (triangles, circles, diamonds) clustering into one striking organic form that evokes the subject, fine white line work, generous pure black negative space. Palette: deep black background, saturated violet (#8052ff) as the dominant accent, sparse amber (#ffb829) and teal (#15846e) sparks, white highlights. High contrast, cinematic lighting, flat depth, minimalist composition with one clear focal form. Absolutely no text, no words, no letters, no numbers, no logos. 16:9 landscape.`;
}

async function persistCover(klingUrl: string): Promise<string> {
  const supabase = getSupabase();
  const { error: bucketError } = await supabase.storage.createBucket(COVERS_BUCKET, {
    public: true,
  });
  if (bucketError && !/already exists/i.test(bucketError.message)) {
    console.warn(`createBucket(${COVERS_BUCKET}): ${bucketError.message}`);
  }

  // Kling URLs expire (~30 days) — copy the bytes into our own storage.
  const res = await fetch(klingUrl);
  if (!res.ok) throw new Error(`Failed to download generated cover (${res.status})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/png";
  const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, bytes, { contentType });
  if (error) throw new Error(`Cover upload failed: ${error.message}`);

  return supabase.storage.from(COVERS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface CoverResult {
  webpageId: string;
  title: string;
  coverUrl: string;
}

/** Generates and persists a modern-art cover for one webpage. */
export async function generateCoverForWebpage(
  webpageId: string,
  options?: { force?: boolean }
): Promise<CoverResult | null> {
  if (!isKlingConfigured()) {
    throw new Error("Kling is not configured (KLING_ACCESS_KEY / KLING_SECRET_KEY)");
  }
  const supabase = getSupabase();
  const { data: row, error } = await supabase
    .from("interactive_webpages")
    .select(
      "id, title, cover_image_url, viral_episodes(winner_hook, domain), episodes(viral_hook, topic)"
    )
    .eq("id", webpageId)
    .single();
  if (error || !row) throw new Error(`Webpage not found: ${webpageId}`);
  if (row.cover_image_url && !options?.force) return null;

  const viral = row.viral_episodes as { winner_hook?: string; domain?: string } | null;
  const legacy = row.episodes as { viral_hook?: string; topic?: string } | null;

  const prompt = buildCoverImagePrompt({
    title: row.title,
    description: viral?.winner_hook || legacy?.viral_hook,
    domain: viral?.domain || null,
  });

  const { imageUrl } = await generateSlideImage({ prompt, aspectRatio: "16:9" });
  const coverUrl = await persistCover(imageUrl);

  await supabase
    .from("interactive_webpages")
    .update({ cover_image_url: coverUrl, cover_image_prompt: prompt })
    .eq("id", webpageId);

  return { webpageId, title: row.title, coverUrl };
}

/** Generates covers for webpages missing one. Bounded per call (long Kling polls). */
export async function generateMissingCovers(limit = 3): Promise<{
  generated: CoverResult[];
  remaining: number;
  errors: string[];
}> {
  const supabase = getSupabase();
  const { data: missing, error: selectError } = await supabase
    .from("interactive_webpages")
    .select("id, title")
    .is("cover_image_url", null)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (selectError) {
    throw new Error(
      /cover_image_url/.test(selectError.message)
        ? "cover_image_url column missing — apply supabase/migrations/009_webpage_covers.sql first"
        : selectError.message
    );
  }

  const queue = missing || [];
  const generated: CoverResult[] = [];
  const errors: string[] = [];

  for (const row of queue.slice(0, limit)) {
    try {
      const result = await generateCoverForWebpage(row.id);
      if (result) generated.push(result);
    } catch (e) {
      errors.push(`${row.title}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return {
    generated,
    remaining: Math.max(0, queue.length - limit),
    errors,
  };
}
