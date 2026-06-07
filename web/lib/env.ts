/**
 * API base resolution.
 *
 * - `API_BASE_URL` (server-only) is used for SSR/server-component fetches and
 *   the auth BFF route handlers (server-to-server, no CORS).
 * - `NEXT_PUBLIC_API_BASE_URL` is used for client-side fetches in the browser
 *   (must be in the Django CORS allowlist).
 *
 * Both default to the local Django dev server.
 */
const DEFAULT_API_BASE = "http://localhost:8000/api/v1";

function normalize(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Server-side base (SSR, route handlers). Prefer the private var. */
export function serverApiBase(): string {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_BASE;
  return normalize(raw);
}

/** Browser-visible base for client components. */
export function publicApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
  return normalize(raw);
}
