import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase/server";
import {
  initializeSlidesFromScript,
  listEpisodeSlides,
  upsertEpisodeSlide,
} from "@/lib/slides/episode-slides";
import { formatCarouselSlides, formatCaption, formatHookOptions, formatScriptBody } from "@/lib/episodes/format-content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const { id } = await params;
    const slides = await listEpisodeSlides(id);

    if (slides.length === 0) {
      const supabase = getSupabase();
      const { data: episode } = await supabase
        .from("episodes")
        .select("title, scripts(carousel_slides, title_variants, hook_options, hook_3s, caption)")
        .eq("id", id)
        .single();

      if (episode) {
        const script = episode.scripts as {
          carousel_slides?: unknown;
          title_variants?: unknown;
          hook_options?: unknown;
          hook_3s?: unknown;
          caption?: unknown;
        } | null;

        const hooks = script ? formatHookOptions(script.hook_options) : [];
        const caption = script ? formatCaption(script.caption) : "";
        const carousel = script
          ? formatCarouselSlides(
              script.carousel_slides,
              script.title_variants,
              hooks[0] || formatScriptBody(script.hook_3s),
              caption
            )
          : [];

        const initialized = await initializeSlidesFromScript(id, episode.title, carousel);
        return NextResponse.json({ slides: initialized });
      }
    }

    return NextResponse.json({ slides });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load slides";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const { id } = await params;
    const body = await request.json();
    const slides = Array.isArray(body.slides) ? body.slides : [body];

    const supabase = getSupabase();
    const { data: episode } = await supabase.from("episodes").select("title").eq("id", id).single();

    const saved = [];
    for (const slide of slides) {
      const updated = await upsertEpisodeSlide(id, slide.slide_number, {
        title: slide.title,
        subtitle: slide.subtitle,
        body_text: slide.body_text,
        theme: slide.theme,
        style_prompt: slide.style_prompt,
        episodeTitle: episode?.title,
      });
      saved.push(updated);
    }

    return NextResponse.json({ slides: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save slides";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
