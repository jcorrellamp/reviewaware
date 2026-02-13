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

  // Fetch the user's profile to get account_id (0 or 1 row; no error when missing)
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Welcome to ReviewAware. You are signed in.
      </p>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Account Details
        </h2>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Email
            </dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              User ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {user.id}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Account ID
            </dt>
            <dd className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {profile?.account_id ?? "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
