import { readFile } from "fs/promises";
import { join } from "path";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function resolveReferenceUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

async function loadLocalImageAsBase64(publicPath: string): Promise<string> {
  const filePath = join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const buffer = await readFile(filePath);
  return buffer.toString("base64");
}

function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** Returns a public URL or raw base64 for Kling's `image` parameter. */
export async function loadKlingReferenceImage(referencePath: string): Promise<string> {
  const url = resolveReferenceUrl(referencePath);

  if (isLocalUrl(url)) {
    return loadLocalImageAsBase64(new URL(url).pathname);
  }

  if (url.startsWith("http")) {
    return url;
  }

  return loadLocalImageAsBase64(referencePath);
}
