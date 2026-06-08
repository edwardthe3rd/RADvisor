"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReserveForm({
  businessId,
  businessName,
}: {
  businessId: number;
  businessName: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    party_size: "1",
    contact_phone: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(key: keyof typeof form) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: businessId,
          start_date: form.start_date,
          end_date: form.end_date,
          party_size: Number(form.party_size) || 1,
          contact_phone: form.contact_phone,
          message: form.message,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not submit reservation.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-surface-borderLight bg-brand-accentLight p-6">
        <h2 className="text-xl font-bold text-ink-primary">Request sent</h2>
        <p className="mt-2 text-ink-secondary">
          Your reservation request for {businessName} was submitted. You can track
          it from your account.
        </p>
        <button
          onClick={() => router.push("/account")}
          className="mt-4 rounded-full bg-brand-primary px-5 py-2 font-semibold text-white hover:bg-brand-primaryDark"
        >
          View my reservations
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-md bg-feedback-danger/10 px-3 py-2 text-sm text-feedback-danger">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
          Start date
          <input
            type="date"
            required
            value={form.start_date}
            onChange={update("start_date")}
            className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
          End date
          <input
            type="date"
            required
            value={form.end_date}
            onChange={update("end_date")}
            className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        Party size
        <input
          type="number"
          min={1}
          value={form.party_size}
          onChange={update("party_size")}
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        Phone (optional)
        <input
          type="tel"
          value={form.contact_phone}
          onChange={update("contact_phone")}
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        What do you need? (optional)
        <textarea
          rows={3}
          value={form.message}
          onChange={update("message")}
          placeholder="e.g. 2 pairs of skis, intermediate, boot size 10"
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-primary px-5 py-2.5 font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Request to reserve"}
      </button>
      <p className="text-xs text-ink-tertiary">
        No payment is taken now. This sends a reservation request; the business
        will follow up to confirm availability and pricing.
      </p>
    </form>
  );
}
