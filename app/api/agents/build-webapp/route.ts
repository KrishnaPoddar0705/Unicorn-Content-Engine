import { NextResponse } from "next/server";
import { buildInteractiveWebpage } from "@/lib/agents/interactive-webpage";
import { saveInteractiveWebpage } from "@/lib/agents/save-interactive-webpage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const maxDuration = 300;

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

    const supabase = getSupabase();
    const { data: episode, error: epError } = await supabase
      .from("episodes")
      .select("*, papers(*)")
      .eq("id", episodeId)
      .single();

    if (epError || !episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    const paper = episode.papers;
    if (!paper) {
      return NextResponse.json({ error: "Episode has no linked paper" }, { status: 400 });
    }

    const deconstruction =
      (paper.metadata as Record<string, unknown>)?.deconstruction || null;
    const pipelineId = randomUUID();

    const webapp = await buildInteractiveWebpage(
      paper,
      deconstruction as Parameters<typeof buildInteractiveWebpage>[1],
      episode.title,
      { pipelineId, episodeId, paperId: paper.id }
    );

    const saved = await saveInteractiveWebpage({
      episodeId,
      paperId: paper.id,
      episodeNumber: episode.episode_number,
      title: webapp.title,
      theme: webapp.theme,
      slug: webapp.slug,
      html: webapp.html,
    });

    return NextResponse.json({
      slug: saved.slug,
      url: `/webapps/${saved.slug}`,
      title: saved.title,
      theme: saved.theme,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webapp build failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
