import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSeries } from "@/lib/agents/viral/series-architect";

// Planning the arc is a long single generation — give it room.
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const body = await request.json();
    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const { seriesId } = await createSeries({
      topic: String(body.topic).trim(),
      domain: body.domain || null,
      target_audience: body.target_audience || undefined,
      depth: body.depth || undefined,
      tone: body.tone || undefined,
      platform: body.platform || undefined,
      partsHint: body.parts_hint ? Number(body.parts_hint) : null,
    });

    return NextResponse.json({ seriesId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create series";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
