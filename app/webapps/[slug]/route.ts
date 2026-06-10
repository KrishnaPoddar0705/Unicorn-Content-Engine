import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return new NextResponse("Not configured", { status: 503 });
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from("interactive_webpages")
    .select("html_content")
    .eq("slug", slug)
    .single();

  if (!data?.html_content) {
    return new NextResponse("Webapp not found", { status: 404 });
  }

  return new NextResponse(data.html_content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
