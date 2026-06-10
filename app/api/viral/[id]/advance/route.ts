import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { advanceViralPipeline } from "@/lib/agents/viral/pipeline";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const { id } = await params;
    const status = await advanceViralPipeline(id);
    return NextResponse.json({
      status: status.episode.status,
      current_stage: status.episode.current_stage,
      ran_stages: status.ranStages,
      stages: status.outputs.map((o) => ({
        stage: o.stage,
        status: o.status,
        error: o.error,
        attempt: o.attempt,
        completed_at: o.completed_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Advance failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
