export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          ReviewAware
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Google Review Request Service — manage and automate review requests
          with ease.
        </p>
        <div className="flex gap-4">
          <a
            href="/app"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Get Started
          </a>
        </div>
      </main>
    </div>
  );
}
