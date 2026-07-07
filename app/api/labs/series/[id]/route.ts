import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getSeriesWithParts } from "@/lib/db/labs-queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const { id } = await params;
    const series = await getSeriesWithParts(id);
    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }
    return NextResponse.json({ series });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load series";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
