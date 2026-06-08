import { cookies } from "next/headers";
import { serverApiBase } from "./env";

export const ACCESS_COOKIE = "rv_access";
export const REFRESH_COOKIE = "rv_refresh";

// Mirror Django SIMPLE_JWT lifetimes (settings.py): access 12h, refresh 7d.
const ACCESS_MAX_AGE = 12 * 60 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export interface SessionUser {
  id: number;
  username: string;
  email: string;
  profile?: {
    id: number;
    display_name: string;
    bio: string;
    city: string;
    state: string;
    profile_photo: string | null;
  };
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Persist JWTs as httpOnly cookies (called from route handlers only). */
export function setAuthCookies(access: string, refresh?: string) {
  const store = cookies();
  store.set(ACCESS_COOKIE, access, cookieOptions(ACCESS_MAX_AGE));
  if (refresh) {
    store.set(REFRESH_COOKIE, refresh, cookieOptions(REFRESH_MAX_AGE));
  }
}

export function clearAuthCookies() {
  const store = cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}

export function getRefreshToken(): string | undefined {
  return cookies().get(REFRESH_COOKIE)?.value;
}

/** Fetch the current user from Django with a bearer token. Null if unauthorized. */
export async function fetchMe(access: string): Promise<SessionUser | null> {
  const res = await fetch(`${serverApiBase()}/auth/me/`, {
    headers: { Authorization: `Bearer ${access}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as SessionUser;
}

/** Exchange a refresh token for a new access token, or null if invalid. */
export async function refreshAccess(refresh: string): Promise<string | null> {
  const res = await fetch(`${serverApiBase()}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access: string };
  return data.access;
}

/**
 * Server-side authenticated fetch to Django. Attaches the access cookie as a
 * bearer token and, on 401, transparently refreshes once (persisting the new
 * access token when called from a route handler). Use from route handlers and
 * server components for protected endpoints.
 */
export async function djangoFetchAuthed(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const access = getAccessToken();
  const doFetch = (token: string) =>
    fetch(`${serverApiBase()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

  let res = access
    ? await doFetch(access)
    : new Response(null, { status: 401 });

  if (res.status === 401) {
    const refresh = getRefreshToken();
    if (refresh) {
      const newAccess = await refreshAccess(refresh);
      if (newAccess) {
        try {
          setAuthCookies(newAccess);
        } catch {
          // Server components cannot set cookies; still use the token below.
        }
        res = await doFetch(newAccess);
      }
    }
  }
  return res;
}

/**
 * Read the current session in a Server Component. Returns null when logged out.
 * Note: cannot refresh-and-persist here (only route handlers/middleware can set
 * cookies); a stale access token simply reads as logged-out until the next
 * route-handler call refreshes it.
 */
export async function getServerUser(): Promise<SessionUser | null> {
  const access = getAccessToken();
  if (!access) return null;
  return fetchMe(access);
}
