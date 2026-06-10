import { NextResponse } from "next/server";
import { runEpisodePipeline } from "@/lib/agents/orchestrator";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const body = await request.json();
    const result = await runEpisodePipeline({
      episodeId: body.episodeId,
      paperId: body.paperId,
      episodeTitle: body.episodeTitle,
      targetAudience: body.targetAudience,
      contentPillarId: body.contentPillarId,
      scriptPreferences: body.scriptPreferences,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Episode generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
