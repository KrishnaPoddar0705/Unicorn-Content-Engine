import { NextResponse } from "next/server";
import { planCalendar } from "@/lib/agents/calendar-strategist";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const body = await request.json();
    const horizonDays = body.horizonDays || 30;

    const supabase = getSupabase();
    const { data: episodes } = await supabase
      .from("episodes")
      .select("*, content_pillars(*)")
      .order("episode_number");

    if (!episodes?.length) {
      return NextResponse.json({ error: "No episodes to schedule" }, { status: 400 });
    }

    const plan = await planCalendar(episodes, horizonDays);

    for (const item of plan.items) {
      const episode = episodes.find((e) => e.episode_number === item.episode_number);
      if (!episode) continue;

      const { data: existing } = await supabase
        .from("calendar_items")
        .select("id")
        .eq("episode_id", episode.id)
        .maybeSingle();

      const payload = {
        episode_id: episode.id,
        scheduled_date: item.scheduled_date,
        format: item.format,
        notes: item.recording_notes,
        viral_mechanism: item.viral_mechanism,
        ordering_reason: item.ordering_reason,
      };

      if (existing) {
        await supabase.from("calendar_items").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("calendar_items").insert(payload);
      }

      await supabase
        .from("episodes")
        .update({
          status: "scheduled",
          recording_notes: item.recording_notes,
        })
        .eq("id", episode.id);
    }

    return NextResponse.json({ plan, saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendar generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
