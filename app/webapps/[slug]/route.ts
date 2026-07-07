import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { autoRepairWebpageJsx } from "@/lib/agents/webpage-jsx";
import { injectLeadForm } from "@/lib/viral/enhance-webpage";

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

  const html = injectLeadForm(autoRepairWebpageJsx(data.html_content), slug);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
