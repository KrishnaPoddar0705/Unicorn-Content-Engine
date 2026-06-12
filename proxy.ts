import { NextResponse, type NextRequest } from "next/server";

/**
 * Locks the internal Content Engine behind HTTP Basic Auth while keeping the
 * public surfaces open: the blog, the interactive webapps, and the lead API.
 *
 * Set DASHBOARD_USER and DASHBOARD_PASSWORD in the environment to enable.
 * When unset (e.g. local dev), everything stays open.
 */

const PUBLIC_PREFIXES = [
  "/blog",
  "/webapps",
  "/api/leads",
  "/sitemap.xml",
  "/robots.txt",
  "/favicon.ico",
  "/assets",
  "/slide-references",
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isPublic) return NextResponse.next();

  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
    const sep = decoded.indexOf(":");
    const u = decoded.slice(0, sep);
    const p = decoded.slice(sep + 1);
    if (u === user && p === pass) return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Unicorn Labs Content Engine"' },
  });
}

export const config = {
  // Run on everything except Next's own static assets
  matcher: ["/((?!_next/static|_next/image).*)"],
};
