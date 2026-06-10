import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const { id } = await params;
    const { data } = await getSupabase()
      .from("episode_scores")
      .select("*")
      .eq("viral_episode_id", id)
      .maybeSingle();
    return NextResponse.json({ score: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load score";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const num = (v: unknown) =>
      v === null || v === undefined || v === "" ? null : Math.max(0, parseInt(String(v), 10) || 0);

    const rating = body.krishna_rating
      ? Math.min(10, Math.max(1, parseInt(String(body.krishna_rating), 10) || 5))
      : null;

    const { data, error } = await getSupabase()
      .from("episode_scores")
      .upsert(
        {
          viral_episode_id: id,
          views: num(body.views),
          likes: num(body.likes),
          comments: num(body.comments),
          shares: num(body.shares),
          saves: num(body.saves),
          krishna_rating: rating,
          performance_notes: body.performance_notes || null,
          posted_url: body.posted_url || null,
          posted_at: body.posted_at || null,
        },
        { onConflict: "viral_episode_id" }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ score: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save score";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
