import { NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase/server";
import { generateEpisodeSlideImage, listEpisodeSlides } from "@/lib/slides/episode-slides";
import { isKlingConfigured } from "@/lib/kling/generate-slide-image";

export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    if (!isKlingConfigured()) {
      return NextResponse.json(
        {
          error:
            "Kling AI not configured. Add KLING_ACCESS_KEY and KLING_SECRET_KEY to .env.local",
        },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const slideNumber = body.slideNumber as number | undefined;

    const supabase = getSupabase();
    const { data: episode } = await supabase.from("episodes").select("title").eq("id", id).single();
    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    let slides = await listEpisodeSlides(id);
    if (slides.length === 0) {
      return NextResponse.json(
        { error: "No slides configured. Open the Reel Slides tab first to initialize." },
        { status: 400 }
      );
    }

    if (slideNumber) {
      const slide = await generateEpisodeSlideImage(id, slideNumber, episode.title);
      return NextResponse.json({ slide });
    }

    const generated = [];
    for (const slide of slides) {
      const result = await generateEpisodeSlideImage(id, slide.slide_number, episode.title);
      generated.push(result);
    }

    return NextResponse.json({ slides: generated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slide generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
