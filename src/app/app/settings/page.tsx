import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";
import QrDisplay from "./qr-display";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/signin");

  // Fetch location (single-location V1)
  const { data: location } = await supabase
    .from("locations")
    .select(
      "id, name, address, business_phone, business_email, google_review_url, contact_us_url, short_code"
    )
    .eq("account_id", profile.account_id)
    .single();

  if (!location) {
    redirect("/app/onboarding");
  }

  // Fetch account_settings
  const { data: settings } = await supabase
    .from("account_settings")
    .select(
      "send_delay_minutes, reminder1_days, reminder2_enabled, reminder2_days, cooldown_days, send_window_start, send_window_end"
    )
    .eq("account_id", profile.account_id)
    .single();

  const defaultSettings = {
    send_delay_minutes: 60,
    reminder1_days: 3,
    reminder2_enabled: true,
    reminder2_days: 7,
    cooldown_days: 30,
    send_window_start: "09:00",
    send_window_end: "19:00",
  };

  const shortlinkBase =
    process.env.SHORTLINK_BASE_URL || "http://localhost:3000";
  const shortLink = location.short_code
    ? `${shortlinkBase}/r/${location.short_code}`
    : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Manage your business details, automation settings, and review link.
      </p>

      {/* ─── QR Code & Short Link ──────────────────────────── */}
      {shortLink && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Review Link &amp; QR Code
          </h2>
          <p className="mt-2 font-mono text-sm text-zinc-700 dark:text-zinc-300 break-all">
            {shortLink}
          </p>
          <div className="mt-4">
            <QrDisplay url={shortLink} />
          </div>
        </div>
      )}

      {/* ─── Settings Form ─────────────────────────────────── */}
      <div className="mt-8">
        <SettingsForm
          location={location}
          settings={settings ?? defaultSettings}
        />
      </div>
    </div>
  );
}
