import { NextResponse } from "next/server";
import { generateSvgCover } from "@/lib/viral/svg-cover";

// Deterministic particle cover art, seeded by slug — no storage, no API cost.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const svg = generateSvgCover(slug);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
