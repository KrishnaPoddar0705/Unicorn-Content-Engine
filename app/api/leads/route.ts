import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { appendSheetRow, isSheetsConfigured } from "@/lib/google/sheets";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Webpages may be served from theunicornlabs.com (proxied) while this API
// lives on the app's own domain — the form posts cross-origin.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const interest = String(body.interest || "").trim().slice(0, 500);
    const source = String(body.source || "").trim().slice(0, 200);

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400, headers: CORS_HEADERS });
    }

    let syncedToSheet = false;
    let sheetError: string | null = null;
    if (isSheetsConfigured()) {
      try {
        await appendSheetRow([
          new Date().toISOString(),
          email,
          phone,
          interest,
          source,
          request.headers.get("user-agent") || "",
        ]);
        syncedToSheet = true;
      } catch (e) {
        sheetError = e instanceof Error ? e.message : "Sheet append failed";
        console.error("Lead sheet sync failed:", sheetError);
      }
    }

    let storedInDb = false;
    if (isSupabaseConfigured()) {
      const { error } = await getSupabase().from("leads").insert({
        email,
        phone: phone || null,
        interest: interest || null,
        source_slug: source || null,
        user_agent: request.headers.get("user-agent"),
        synced_to_sheet: syncedToSheet,
      });
      if (error) {
        console.error("Lead DB insert failed:", error.message);
      } else {
        storedInDb = true;
      }
    }

    // A lead must land in at least one store
    if (!syncedToSheet && !storedInDb) {
      return NextResponse.json(
        { error: sheetError || "Lead storage is not configured" },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save lead";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
