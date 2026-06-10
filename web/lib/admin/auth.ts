import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "rv_admin";

function expectedToken(): string | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 16) return null;
  // Cookie stores a hash so the raw secret never leaves the server env.
  return createHash("sha256").update(secret).digest("hex");
}

export function isAdminAuthed(): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const got = cookies().get(ADMIN_COOKIE)?.value ?? "";
  if (got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** Gate for admin pages: bounce to the login screen when unauthenticated. */
export function requireAdmin(): void {
  if (!isAdminAuthed()) redirect("/admin/login");
}

/** Gate for admin server actions: throw instead of redirect. */
export function assertAdmin(): void {
  if (!isAdminAuthed()) throw new Error("Not authorized");
}

export function checkSecretAndIssueCookie(secret: string): boolean {
  const configured = process.env.ADMIN_SECRET;
  if (!configured || configured.length < 16) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(configured);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  cookies().set(ADMIN_COOKIE, expectedToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 7 * 24 * 3600,
  });
  return true;
}

export function clearAdminCookie(): void {
  cookies().delete(ADMIN_COOKIE);
}
