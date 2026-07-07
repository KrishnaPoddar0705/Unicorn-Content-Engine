import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { scoutViralIdeas } from "@/lib/agents/viral/idea-scout";
import { insertViralIdeas } from "@/lib/db/viral-queries";

// Idea scouting runs several web searches + a long generation — give it room.
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const body = await request.json().catch(() => ({}));
    const domain: string | null = body.domain || null;
    const count: number | undefined = body.count;

    const scouted = await scoutViralIdeas({ domain, count });
    const ideas = await insertViralIdeas(scouted);
    return NextResponse.json({ ideas });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to find ideas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
