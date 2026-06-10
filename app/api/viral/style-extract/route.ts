import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { extractStyleProfile } from "@/lib/agents/viral/style-extractor";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const body = await request.json();
    if (!body.reference_image_id) {
      return NextResponse.json({ error: "reference_image_id is required" }, { status: 400 });
    }
    const profile = await extractStyleProfile({
      referenceImageId: body.reference_image_id,
      notes: body.notes,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Style extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
