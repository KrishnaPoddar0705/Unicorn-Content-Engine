import { getSupabase } from "@/lib/supabase/server";
import { buildSlideImagePrompt, type SlideContent } from "./build-slide-prompt";
import { DEFAULT_SLIDE_STYLE_PROMPT, DEFAULT_SLIDE_THEME, SLIDE_REFERENCE_IMAGE_URLS } from "./default-style";
import { generateSlideImage } from "@/lib/kling/generate-slide-image";

export interface EpisodeSlideImage {
  id: string;
  episode_id: string;
  slide_number: number;
  title: string;
  subtitle: string;
  body_text: string;
  theme: string;
  style_prompt: string;
  image_prompt: string;
  image_url: string | null;
  thumbnail_url: string | null;
  higgsfield_job_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function listEpisodeSlides(episodeId: string): Promise<EpisodeSlideImage[]> {
  const { data } = await getSupabase()
    .from("episode_slide_images")
    .select("*")
    .eq("episode_id", episodeId)
    .order("slide_number");
  return (data || []) as EpisodeSlideImage[];
}

export async function initializeSlidesFromScript(
  episodeId: string,
  episodeTitle: string,
  carouselSlides: { title: string; body: string }[]
): Promise<EpisodeSlideImage[]> {
  const existing = await listEpisodeSlides(episodeId);
  if (existing.length > 0) return existing;

  const slides = carouselSlides.length > 0 ? carouselSlides : getDefaultSlideCopy(episodeTitle);

  const rows = slides.map((slide, i) => {
    const content: SlideContent = {
      title: slide.title,
      subtitle: i === 0 ? "Paper to Project" : episodeTitle,
      body_text: slide.body,
      theme: DEFAULT_SLIDE_THEME,
      style_prompt: DEFAULT_SLIDE_STYLE_PROMPT,
    };
    return {
      episode_id: episodeId,
      slide_number: i + 1,
      title: content.title,
      subtitle: content.subtitle,
      body_text: content.body_text,
      theme: content.theme || DEFAULT_SLIDE_THEME,
      style_prompt: content.style_prompt || DEFAULT_SLIDE_STYLE_PROMPT,
      image_prompt: buildSlideImagePrompt(content, episodeTitle),
      status: "draft",
    };
  });

  const { data, error } = await getSupabase()
    .from("episode_slide_images")
    .insert(rows)
    .select("*");

  if (error) throw error;
  return (data || []) as EpisodeSlideImage[];
}

function getDefaultSlideCopy(episodeTitle: string) {
  return [
    { title: episodeTitle, body: "The research insight" },
    { title: "The method", body: "How the paper works" },
    { title: "Key result", body: "What they found" },
    { title: "Why it matters", body: "Real-world impact" },
    { title: "Rebuild it", body: "Student project extension" },
  ];
}

export async function upsertEpisodeSlide(
  episodeId: string,
  slideNumber: number,
  patch: Partial<SlideContent> & { episodeTitle?: string }
): Promise<EpisodeSlideImage> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("episode_slide_images")
    .select("*")
    .eq("episode_id", episodeId)
    .eq("slide_number", slideNumber)
    .maybeSingle();

  const merged: SlideContent = {
    title: patch.title ?? existing?.title ?? "",
    subtitle: patch.subtitle ?? existing?.subtitle ?? "",
    body_text: patch.body_text ?? existing?.body_text ?? "",
    theme: patch.theme ?? existing?.theme ?? DEFAULT_SLIDE_THEME,
    style_prompt: patch.style_prompt ?? existing?.style_prompt ?? DEFAULT_SLIDE_STYLE_PROMPT,
  };

  const row = {
    episode_id: episodeId,
    slide_number: slideNumber,
    ...merged,
    image_prompt: buildSlideImagePrompt(merged, patch.episodeTitle),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("episode_slide_images")
      .update(row)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as EpisodeSlideImage;
  }

  const { data, error } = await supabase
    .from("episode_slide_images")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;
  return data as EpisodeSlideImage;
}

export async function generateEpisodeSlideImage(
  episodeId: string,
  slideNumber: number,
  episodeTitle: string
): Promise<EpisodeSlideImage> {
  const supabase = getSupabase();
  const slide = await upsertEpisodeSlide(episodeId, slideNumber, { episodeTitle });

  await supabase
    .from("episode_slide_images")
    .update({ status: "generating", error_message: null })
    .eq("id", slide.id);

  const referenceImageUrl =
    SLIDE_REFERENCE_IMAGE_URLS[(slideNumber - 1) % SLIDE_REFERENCE_IMAGE_URLS.length];

  const imagePrompt = buildSlideImagePrompt(
    {
      title: slide.title,
      subtitle: slide.subtitle,
      body_text: slide.body_text,
      theme: slide.theme,
      style_prompt: slide.style_prompt,
    },
    episodeTitle
  );

  try {
    const result = await generateSlideImage({
      prompt: imagePrompt,
      referenceImageUrl,
      seed: 1000 + slideNumber,
    });

    const { data, error } = await supabase
      .from("episode_slide_images")
      .update({
        status: "completed",
        image_url: result.imageUrl,
        thumbnail_url: result.thumbnailUrl || null,
        image_prompt: imagePrompt,
        higgsfield_job_id: result.jobId,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slide.id)
      .select("*")
      .single();

    if (error) throw error;
    return data as EpisodeSlideImage;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await supabase
      .from("episode_slide_images")
      .update({ status: "failed", error_message: message })
      .eq("id", slide.id);
    throw err;
  }
}
