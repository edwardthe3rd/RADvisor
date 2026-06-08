import { NextResponse } from "next/server";
import {
  getAccessToken,
  getRefreshToken,
  fetchMe,
  refreshAccess,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth";

export async function GET() {
  const access = getAccessToken();
  if (access) {
    const user = await fetchMe(access);
    if (user) return NextResponse.json({ user });
  }

  // Access missing/expired: try the refresh token and persist a new access.
  const refresh = getRefreshToken();
  if (refresh) {
    const newAccess = await refreshAccess(refresh);
    if (newAccess) {
      setAuthCookies(newAccess);
      const user = await fetchMe(newAccess);
      if (user) return NextResponse.json({ user });
    }
  }

  clearAuthCookies();
  return NextResponse.json({ user: null }, { status: 200 });
}
