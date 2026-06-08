"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

export default function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(form);
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink-primary">Create account</h1>
      {error ? (
        <p className="rounded-md bg-feedback-danger/10 px-3 py-2 text-sm text-feedback-danger">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        Username
        <input
          required
          value={form.username}
          onChange={update("username")}
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        Email
        <input
          type="email"
          required
          value={form.email}
          onChange={update("email")}
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        Password
        <input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={update("password")}
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-primary px-5 py-2.5 font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Sign up"}
      </button>
      <p className="text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink-link hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
