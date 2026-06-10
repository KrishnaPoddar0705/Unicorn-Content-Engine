import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { reviseViralStage } from "@/lib/agents/viral/pipeline";

export const maxDuration = 300;

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
    if (!body.stage || !body.action) {
      return NextResponse.json({ error: "stage and action are required" }, { status: 400 });
    }
    const { output } = await reviseViralStage({
      episodeId: id,
      stage: body.stage,
      actionKey: body.action,
      customInstruction: body.instruction,
    });
    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revision failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
