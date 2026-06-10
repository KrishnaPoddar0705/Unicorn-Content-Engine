import { assertPdfSize } from "./extract-pdf-text";

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 60_000;

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
  );
}

export function assertSafePdfUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".local") || isPrivateIpv4(hostname)) {
    throw new Error("Private or local URLs are not allowed");
  }

  return parsed;
}

export function normalizePaperPdfUrl(url: string): string {
  const parsed = assertSafePdfUrl(url);

  if (parsed.hostname.includes("arxiv.org")) {
    const absMatch = parsed.pathname.match(/\/abs\/([^/]+)/);
    if (absMatch) return `https://arxiv.org/pdf/${absMatch[1]}.pdf`;

    const htmlMatch = parsed.pathname.match(/\/html\/([^/]+)/);
    if (htmlMatch) return `https://arxiv.org/pdf/${htmlMatch[1]}.pdf`;

    const pdfMatch = parsed.pathname.match(/\/pdf\/([^/]+)/);
    if (pdfMatch && !pdfMatch[1].endsWith(".pdf")) {
      return `https://arxiv.org/pdf/${pdfMatch[1]}.pdf`;
    }
  }

  return parsed.toString();
}

function looksLikePdf(contentType: string | null, url: string): boolean {
  const type = (contentType || "").toLowerCase();
  if (type.includes("application/pdf")) return true;
  if (type.includes("application/octet-stream") && url.toLowerCase().includes(".pdf")) return true;
  return /\.pdf($|\?)/i.test(url);
}

export async function fetchPdfFromUrl(url: string): Promise<{ buffer: Buffer; resolvedUrl: string }> {
  const resolvedUrl = normalizePaperPdfUrl(url);
  assertSafePdfUrl(resolvedUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(resolvedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "UnicornLabsContentEngine/1.0",
        Accept: "application/pdf,*/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF (${response.status})`);
    }

    const contentType = response.headers.get("content-type");
    if (!looksLikePdf(contentType, resolvedUrl)) {
      throw new Error("URL does not appear to point to a PDF file");
    }

    const arrayBuffer = await response.arrayBuffer();
    assertPdfSize(arrayBuffer.byteLength);

    return { buffer: Buffer.from(arrayBuffer), resolvedUrl };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("PDF download timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
