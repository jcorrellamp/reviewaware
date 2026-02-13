"use client";

import { useState } from "react";

interface TopUpButtonProps {
  emails: number;
  label: string;
  price: string;
}

export default function TopUpButton({ emails, label, price }: TopUpButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
        setLoading(false);
      }
    } catch {
      alert("Network error");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {loading ? "..." : `${label} — ${price}`}
    </button>
  );
}
