import { NextResponse } from "next/server";
import { djangoFetchAuthed } from "@/lib/auth";

export async function GET() {
  const res = await djangoFetchAuthed("/reservations/");
  if (res.status === 401) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const data = await res.json().catch(() => []);
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.business || !body?.start_date || !body?.end_date) {
    return NextResponse.json(
      { error: "business, start_date and end_date are required." },
      { status: 400 },
    );
  }

  const res = await djangoFetchAuthed("/reservations/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: "Could not submit reservation.", detail: data },
      { status: res.status },
    );
  }
  return NextResponse.json(data, { status: 201 });
}
