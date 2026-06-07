import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getBusiness, ApiError } from "@/lib/api";
import { locationLabel } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import ReserveForm from "@/components/ReserveForm";

export const metadata: Metadata = {
  title: "Request a reservation",
  robots: { index: false },
};

export default async function ReservePage({
  params,
}: {
  params: { slug: string };
}) {
  let business;
  try {
    business = await getBusiness(params.slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <nav className="mb-4 text-sm text-ink-tertiary">
          <Link href={`/business/${business.slug}`} className="hover:underline">
            {business.name}
          </Link>{" "}
          / <span className="text-ink-secondary">Reserve</span>
        </nav>
        <h1 className="text-2xl font-extrabold text-ink-primary">
          Request to reserve at {business.name}
        </h1>
        <p className="mb-8 mt-1 text-ink-secondary">
          {locationLabel(business)}
        </p>
        <ReserveForm businessId={business.id} businessName={business.name} />
      </main>
    </>
  );
}
