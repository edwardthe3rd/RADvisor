"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  async function onClick() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={onClick}
      className="rounded-full border border-surface-border px-4 py-2 text-sm font-semibold text-ink-secondary hover:bg-surface-muted"
    >
      Log out
    </button>
  );
}
