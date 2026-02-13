import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch the user's profile to get account_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/signin");
  }

  // Check if the account has a location configured
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, short_code, google_review_url")
    .eq("account_id", profile.account_id)
    .limit(1);

  // No location → force onboarding
  if (!locations || locations.length === 0) {
    redirect("/app/onboarding");
  }

  const location = locations[0];
  const shortlinkBase =
    process.env.SHORTLINK_BASE_URL || "http://localhost:3000";
  const shortLink = location.short_code
    ? `${shortlinkBase}/r/${location.short_code}`
    : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Welcome to ReviewAware. Your location is configured and ready.
      </p>

      {/* ─── Location Overview ──────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {location.name}
        </h2>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Google Review URL
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100 break-all">
              {location.google_review_url ?? "—"}
            </dd>
          </div>
          {shortLink && (
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Short Link
              </dt>
              <dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
                {shortLink}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Account
            </dt>
            <dd className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {profile.account_id}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <a
            href="/app/settings"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Edit Settings &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
