import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { uploadReferenceImage } from "@/lib/viral/reference-images";
import { getReferenceImages } from "@/lib/db/viral-queries";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const images = await getReferenceImages();
    return NextResponse.json({ images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    const notes = formData.get("notes");
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = await uploadReferenceImage({
      bytes,
      mimeType: file.type,
      filename: file.name,
      notes: typeof notes === "string" ? notes : undefined,
    });
    return NextResponse.json({ image });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
