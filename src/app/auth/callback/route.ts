import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Allow only a relative path: single leading slash, no //, no protocol. */
function safeRedirectPath(raw: string | null): string {
  if (raw == null || typeof raw !== "string" || raw === "") return "/app";
  const trimmed = raw.trim();
  if (trimmed !== "/" && !trimmed.startsWith("/")) return "/app";
  if (trimmed.includes("//")) return "/app";
  if (/^\w+:/.test(trimmed)) return "/app";
  return trimmed;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
