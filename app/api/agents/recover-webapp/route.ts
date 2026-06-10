import { NextResponse } from "next/server";
import { recoverInteractiveWebpageFromAgentRun } from "@/lib/agents/save-interactive-webpage";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const body = await request.json();
    const episodeId = body.episodeId as string;
    if (!episodeId) {
      return NextResponse.json({ error: "episodeId is required" }, { status: 400 });
    }

    const saved = await recoverInteractiveWebpageFromAgentRun(episodeId);
    if (!saved) {
      return NextResponse.json(
        { error: "No recoverable webapp build found for this episode" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      slug: saved.slug,
      url: `/webapps/${saved.slug}`,
      title: saved.title,
      theme: saved.theme,
      recovered: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recovery failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
