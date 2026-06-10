import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getSeriesTemplates } from "@/lib/db/viral-queries";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const templates = await getSeriesTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
