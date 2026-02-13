import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /r/[code]
 * Public short-link redirect handler.
 * Looks up a location by short_code, logs a link_event, and 302-redirects
 * to the location's google_review_url.
 *
 * Designed to be served from go.reviewaware.com (or any domain).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up location by short_code
  const { data: location, error } = await admin
    .from("locations")
    .select("id, account_id, google_review_url")
    .eq("short_code", code)
    .single();

  if (error || !location || !location.google_review_url) {
    return new NextResponse("Link not found", { status: 404 });
  }

  // Determine source — default to "qr" for direct short-link visits
  const source = request.nextUrl.searchParams.get("src") || "qr";

  // Log the link event (fire-and-forget; don't block the redirect)
  admin
    .from("link_events")
    .insert({
      account_id: location.account_id,
      location_id: location.id,
      source,
      // contact_id is null for anonymous visits
    })
    .then(({ error: insertError }) => {
      if (insertError) {
        console.error("Failed to log link_event:", insertError.message);
      }
    });

  return NextResponse.redirect(location.google_review_url, 302);
}
