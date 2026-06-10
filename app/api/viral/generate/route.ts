import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createViralEpisode } from "@/lib/agents/viral/pipeline";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const body = await request.json();
    if (!body.title || !body.input_mode) {
      return NextResponse.json({ error: "title and input_mode are required" }, { status: 400 });
    }
    if (["paper"].includes(body.input_mode) && !body.paper_text?.trim()) {
      return NextResponse.json({ error: "paper_text is required in paper mode" }, { status: 400 });
    }

    const id = await createViralEpisode({
      title: String(body.title),
      input_mode: body.input_mode,
      domain: body.domain || null,
      raw_input: body.raw_input || null,
      paper_text: body.paper_text || null,
      target_audience: body.target_audience || "general_curious_adult",
      depth: body.depth || "medium",
      output_format: body.output_format || "all",
      tone: body.tone || "founder_led",
      cta_goal: body.cta_goal || null,
      platform: body.platform || "instagram_reels",
      visual_style_mode: body.visual_style_mode || "default",
      pasted_style_prompt: body.pasted_style_prompt || null,
      series_template_id: body.series_template_id || null,
      style_profile_id: body.style_profile_id || null,
      reference_image_id: body.reference_image_id || null,
    });

    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create viral episode";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
