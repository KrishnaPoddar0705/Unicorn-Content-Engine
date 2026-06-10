import { NextResponse } from "next/server";
import { runIdeaPipeline } from "@/lib/agents/idea-pipeline";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const body = await request.json();
    if (!body.contentIdea?.trim()) {
      return NextResponse.json({ error: "contentIdea is required" }, { status: 400 });
    }

    const result = await runIdeaPipeline({
      contentIdea: body.contentIdea,
      episodeTitle: body.episodeTitle,
      targetAudience: body.targetAudience,
      contentPillarId: body.contentPillarId,
      scriptPreferences: body.scriptPreferences,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Idea pipeline failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
