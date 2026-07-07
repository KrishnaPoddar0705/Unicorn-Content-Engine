import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { updateIdeaStatus } from "@/lib/db/viral-queries";
import type { IdeaStatus } from "@/lib/supabase/types";

const VALID_STATUSES: IdeaStatus[] = ["new", "saved", "used", "dismissed"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body.status as IdeaStatus;
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await updateIdeaStatus(id, status, body.viral_episode_id ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update idea";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
