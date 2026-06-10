import { extractText, getDocumentProxy } from "unpdf";

const MAX_PDF_BYTES = 25 * 1024 * 1024;

export function assertPdfSize(byteLength: number): void {
  if (byteLength > MAX_PDF_BYTES) {
    throw new Error("PDF is too large (max 25 MB)");
  }
  if (byteLength === 0) {
    throw new Error("PDF file is empty");
  }
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  assertPdfSize(buffer.length);

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const normalized = text.replace(/\s+/g, " ").trim() || "";

  if (normalized.length < 50) {
    throw new Error(
      "Could not extract enough text from the PDF. Try a text-based PDF or paste the abstract manually."
    );
  }

  return normalized;
}
