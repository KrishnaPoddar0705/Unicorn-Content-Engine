import { NextResponse } from "next/server";
import { runPaperIngestionPipeline } from "@/lib/agents/paper-pipeline";
import { extractPdfText } from "@/lib/papers/extract-pdf-text";
import { fetchPdfFromUrl } from "@/lib/papers/fetch-pdf-url";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const maxDuration = 300;

async function resolvePaperText(request: Request): Promise<{
  text: string;
  sourceUrl?: string;
}> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("pdf");
    const sourceUrl = form.get("sourceUrl")?.toString().trim() || undefined;

    if (!(file instanceof File)) {
      throw new Error("Please upload a PDF file");
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      throw new Error("Uploaded file must be a PDF");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(buffer);

    return { text, sourceUrl: sourceUrl || file.name };
  }

  const body = await request.json();
  const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : undefined;

  if (pdfUrl) {
    const { buffer, resolvedUrl } = await fetchPdfFromUrl(pdfUrl);
    const extracted = await extractPdfText(buffer);
    return { text: extracted, sourceUrl: resolvedUrl };
  }

  if (!text) {
    throw new Error("Please provide paper text or a PDF URL");
  }

  return { text, sourceUrl };
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const { text, sourceUrl } = await resolvePaperText(request);
    const result = await runPaperIngestionPipeline({ text, sourceUrl });

    return NextResponse.json({
      ingestion: result.ingestion,
      paper: result.paper,
      episode: { id: result.episode.episodeId },
      webapp: result.webapp,
      saved: true,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ingest]", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Ingestion failed";
}
