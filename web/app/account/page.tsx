import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerUser, djangoFetchAuthed } from "@/lib/auth";
import type { ReservationRequest } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

const STATUS_LABEL: Record<ReservationRequest["status"], string> = {
  pending: "Pending",
  contacted: "Contacted",
  confirmed: "Confirmed",
  closed: "Closed",
  canceled: "Canceled",
};

async function loadReservations(): Promise<ReservationRequest[]> {
  const res = await djangoFetchAuthed("/reservations/");
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : (data.results ?? []);
}

export default async function AccountPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/account");

  const reservations = await loadReservations();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-content px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-primary">
              {user.profile?.display_name || user.username}
            </h1>
            <p className="text-ink-secondary">{user.email}</p>
          </div>
          <LogoutButton />
        </div>

        <h2 className="mb-4 text-xl font-bold text-ink-primary">
          My reservation requests
        </h2>

        {reservations.length === 0 ? (
          <div className="rounded-lg border border-surface-borderLight bg-surface-muted p-6 text-ink-secondary">
            <p>You haven&apos;t requested any reservations yet.</p>
            <Link
              href="/"
              className="mt-3 inline-block font-semibold text-ink-link hover:underline"
            >
              Browse rentals →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {reservations.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-surface-borderLight p-4"
              >
                <div>
                  <Link
                    href={`/business/${r.business_slug}`}
                    className="font-bold text-ink-primary hover:text-brand-primaryDark"
                  >
                    {r.business_name}
                  </Link>
                  <p className="text-sm text-ink-secondary">
                    {r.start_date} → {r.end_date}
                    {r.equipment_name ? ` · ${r.equipment_name}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-secondary">
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
