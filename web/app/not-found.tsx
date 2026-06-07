import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-content flex-col items-center px-4 py-24 text-center">
        <h1 className="text-4xl font-extrabold text-ink-primary">Not found</h1>
        <p className="mt-3 text-ink-secondary">
          We couldn&apos;t find that page. It may have moved or no longer exists.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-brand-primary px-5 py-2 font-semibold text-white hover:bg-brand-primaryDark"
        >
          Back to discovery
        </Link>
      </main>
    </>
  );
}
