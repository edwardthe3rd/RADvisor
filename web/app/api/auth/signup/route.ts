import { NextResponse } from "next/server";
import { serverApiBase } from "@/lib/env";
import { setAuthCookies, fetchMe } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { username, email, password, display_name, city, state } = body ?? {};
  if (!username || !email || !password) {
    return NextResponse.json(
      { error: "Username, email and password are required." },
      { status: 400 },
    );
  }

  const signupRes = await fetch(`${serverApiBase()}/auth/signup/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, email, password, display_name, city, state }),
    cache: "no-store",
  });

  if (!signupRes.ok) {
    const detail = await signupRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: "Could not create account.", detail },
      { status: signupRes.status },
    );
  }

  // Auto-login after signup.
  const loginRes = await fetch(`${serverApiBase()}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!loginRes.ok) {
    return NextResponse.json(
      { error: "Account created. Please log in." },
      { status: 201 },
    );
  }

  const { access, refresh } = (await loginRes.json()) as {
    access: string;
    refresh: string;
  };
  setAuthCookies(access, refresh);
  const user = await fetchMe(access);
  return NextResponse.json({ user }, { status: 201 });
}
