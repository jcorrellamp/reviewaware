"use client";

import { useState, useTransition } from "react";
import { saveOnboarding, type OnboardingResult } from "./actions";
import QrDisplay from "../settings/qr-display";

export default function OnboardingForm({ shortBase }: { shortBase: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  // Form state for automation settings (need controlled inputs for toggle)
  const [reminder2Enabled, setReminder2Enabled] = useState(true);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    // Add the toggle value (checkboxes don't send "false" when unchecked)
    formData.set("reminder2_enabled", String(reminder2Enabled));

    startTransition(async () => {
      const res = await saveOnboarding(formData);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || "Something went wrong");
      }
    });
  }

  // ─── Success State ──────────────────────────────────────────
  if (result?.success && result.shortCode) {
    const shortLink = `${shortBase}/r/${result.shortCode}`;

    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
            Setup Complete!
          </h2>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            Your location is configured. Here&apos;s your review short link and
            QR code.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Your Review Link
          </h3>
          <p className="mt-2 font-mono text-sm text-zinc-700 dark:text-zinc-300 break-all">
            {shortLink}
          </p>

          <div className="mt-6">
            <QrDisplay url={shortLink} />
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href="/app"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Go to Dashboard
          </a>
          <a
            href="/app/settings"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            View Settings
          </a>
        </div>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ─── Business Details ──────────────────────────────── */}
      <fieldset className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <legend className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Business Details
        </legend>

        <div className="mt-4 space-y-4">
          <Field
            label="Business Name"
            name="business_name"
            required
            placeholder="Acme Plumbing"
          />
          <Field
            label="Business Address"
            name="business_address"
            required
            placeholder="123 Main St, Anytown, USA"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              name="business_phone"
              type="tel"
              required
              placeholder="(555) 123-4567"
            />
            <Field
              label="Reply-to Email"
              name="business_email"
              type="email"
              required
              placeholder="reviews@acmeplumbing.com"
            />
          </div>
          <Field
            label="Google Review URL"
            name="google_review_url"
            type="url"
            required
            placeholder="https://g.page/r/..."
            hint="Paste the direct link to your Google review page"
          />
          <Field
            label="Contact Us URL (optional)"
            name="contact_us_url"
            type="url"
            placeholder="https://acmeplumbing.com/contact"
          />
        </div>
      </fieldset>

      {/* ─── Automation Settings ───────────────────────────── */}
      <fieldset className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <legend className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Automation Settings
        </legend>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure when and how review requests are sent. You can change these
          later.
        </p>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Send Delay (minutes)"
              name="send_delay_minutes"
              type="number"
              defaultValue="60"
              hint="Wait this long after job completion before sending"
            />
            <Field
              label="First Reminder (days)"
              name="reminder1_days"
              type="number"
              defaultValue="3"
              hint="Days after initial request"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={reminder2Enabled}
              onClick={() => setReminder2Enabled(!reminder2Enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 ${
                reminder2Enabled
                  ? "bg-zinc-900 dark:bg-zinc-100"
                  : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform dark:bg-zinc-900 ${
                  reminder2Enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Send 2nd Reminder
            </span>
          </div>

          {reminder2Enabled && (
            <Field
              label="Second Reminder (days)"
              name="reminder2_days"
              type="number"
              defaultValue="7"
              hint="Days after initial request"
            />
          )}

          <Field
            label="Cooldown (days)"
            name="cooldown_days"
            type="number"
            defaultValue="30"
            hint="Minimum days between requests to the same contact"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Send Window Start"
              name="send_window_start"
              type="time"
              defaultValue="09:00"
            />
            <Field
              label="Send Window End"
              name="send_window_end"
              type="time"
              defaultValue="19:00"
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Saving..." : "Complete Setup"}
      </button>
    </form>
  );
}

/* ─── Reusable Field Component ──────────────────────────────── */

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
      />
      {hint && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
    </div>
  );
}
