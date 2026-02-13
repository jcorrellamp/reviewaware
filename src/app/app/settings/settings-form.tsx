"use client";

import { useState, useTransition } from "react";
import { updateSettings, type SettingsResult } from "./actions";

interface SettingsFormProps {
  location: {
    id: string;
    name: string;
    address: string | null;
    business_phone: string | null;
    business_email: string | null;
    google_review_url: string | null;
    contact_us_url: string | null;
  };
  settings: {
    send_delay_minutes: number;
    reminder1_days: number;
    reminder2_enabled: boolean;
    reminder2_days: number;
    cooldown_days: number;
    send_window_start: string;
    send_window_end: string;
  };
}

export default function SettingsForm({ location, settings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reminder2Enabled, setReminder2Enabled] = useState(
    settings.reminder2_enabled
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    formData.set("location_id", location.id);
    formData.set("reminder2_enabled", String(reminder2Enabled));

    startTransition(async () => {
      const res: SettingsResult = await updateSettings(formData);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          Settings saved!
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
            defaultValue={location.name}
          />
          <Field
            label="Business Address"
            name="business_address"
            required
            defaultValue={location.address ?? ""}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              name="business_phone"
              type="tel"
              required
              defaultValue={location.business_phone ?? ""}
            />
            <Field
              label="Reply-to Email"
              name="business_email"
              type="email"
              required
              defaultValue={location.business_email ?? ""}
            />
          </div>
          <Field
            label="Google Review URL"
            name="google_review_url"
            type="url"
            required
            defaultValue={location.google_review_url ?? ""}
          />
          <Field
            label="Contact Us URL (optional)"
            name="contact_us_url"
            type="url"
            defaultValue={location.contact_us_url ?? ""}
          />
        </div>
      </fieldset>

      {/* ─── Automation Settings ───────────────────────────── */}
      <fieldset className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <legend className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Automation Settings
        </legend>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Send Delay (minutes)"
              name="send_delay_minutes"
              type="number"
              defaultValue={String(settings.send_delay_minutes)}
            />
            <Field
              label="First Reminder (days)"
              name="reminder1_days"
              type="number"
              defaultValue={String(settings.reminder1_days)}
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
              defaultValue={String(settings.reminder2_days)}
            />
          )}

          <Field
            label="Cooldown (days)"
            name="cooldown_days"
            type="number"
            defaultValue={String(settings.cooldown_days)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Send Window Start"
              name="send_window_start"
              type="time"
              defaultValue={settings.send_window_start}
            />
            <Field
              label="Send Window End"
              name="send_window_end"
              type="time"
              defaultValue={settings.send_window_end}
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Saving..." : "Save Settings"}
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
