import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSettings } from "@/lib/db/queries";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const body = await request.json();
    const supabase = getSupabase();
    const existing = await getSettings();

    const { data, error } = await supabase
      .from("settings")
      .update({
        llm_provider: body.llm_provider,
        openai_model: body.openai_model,
        anthropic_model: body.anthropic_model,
        gemini_model: body.gemini_model,
        brand_voice_overrides: body.brand_voice_overrides,
        content_preferences: body.content_preferences,
      })
      .eq("id", existing?.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Settings update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
