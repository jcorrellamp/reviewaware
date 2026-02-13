import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./sign-out-button";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <nav className="mx-auto flex max-w-5xl items-center justify-between">
          <a
            href="/app"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            ReviewAware
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/app/billing"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Billing
            </a>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
