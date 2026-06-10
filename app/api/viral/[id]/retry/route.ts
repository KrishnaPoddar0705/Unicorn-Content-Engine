import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { retryViralStage } from "@/lib/agents/viral/pipeline";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const { id } = await params;
    const body = await request.json();
    if (!body.stage) {
      return NextResponse.json({ error: "stage is required" }, { status: 400 });
    }
    const status = await retryViralStage(id, body.stage);
    return NextResponse.json({
      status: status.episode.status,
      current_stage: status.episode.current_stage,
      stages: status.outputs.map((o) => ({ stage: o.stage, status: o.status, error: o.error })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retry failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
