"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthContext";

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink-primary">Log in</h1>
      {error ? (
        <p className="rounded-md bg-feedback-danger/10 px-3 py-2 text-sm text-feedback-danger">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink-secondary">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-surface-border px-3 py-2 text-ink-primary outline-none focus:border-brand-primary"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-primary px-5 py-2.5 font-semibold text-white hover:bg-brand-primaryDark disabled:opacity-60"
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
      <p className="text-sm text-ink-secondary">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-ink-link hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
