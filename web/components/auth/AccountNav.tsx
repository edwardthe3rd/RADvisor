"use client";

import Link from "next/link";
import { useAuth } from "./AuthContext";

export default function AccountNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return <span className="text-sm text-ink-tertiary">…</span>;
  }

  if (user) {
    return (
      <Link
        href="/account"
        className="text-sm font-semibold text-ink-primary hover:text-brand-primaryDark"
      >
        {user.profile?.display_name || user.username}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primaryDark"
    >
      Log in
    </Link>
  );
}
