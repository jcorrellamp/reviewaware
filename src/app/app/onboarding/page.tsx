import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  // Get account_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/signin");

  // If location already exists, redirect to dashboard (single-location V1)
  const { data: locations } = await supabase
    .from("locations")
    .select("id")
    .eq("account_id", profile.account_id)
    .limit(1);

  if (locations && locations.length > 0) {
    redirect("/app");
  }

  const shortBase = process.env.SHORTLINK_BASE_URL || "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Set Up Your Business
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Let&apos;s configure your location and review request settings to get
          started.
        </p>
      </div>

      <OnboardingForm shortBase={shortBase} />
    </div>
  );
}
