import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { generateCoverForWebpage, generateMissingCovers } from "@/lib/viral/cover-image";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const body = await request.json().catch(() => ({}));

    if (body.webpage_id) {
      const result = await generateCoverForWebpage(body.webpage_id, { force: body.force });
      return NextResponse.json({
        generated: result ? [result] : [],
        remaining: 0,
        skipped: !result,
      });
    }

    const limit = Math.min(5, Math.max(1, parseInt(String(body.limit ?? 3), 10) || 3));
    const result = await generateMissingCovers(limit);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cover generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
