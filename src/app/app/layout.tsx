export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          {/* Auth controls will go here */}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
