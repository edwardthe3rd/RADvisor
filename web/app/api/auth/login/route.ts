import { NextResponse } from "next/server";
import { serverApiBase } from "@/lib/env";
import { setAuthCookies, fetchMe } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim();
  const password = body?.password;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const res = await fetch(`${serverApiBase()}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const { access, refresh } = (await res.json()) as {
    access: string;
    refresh: string;
  };
  setAuthCookies(access, refresh);
  const user = await fetchMe(access);
  return NextResponse.json({ user });
}
