import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-content px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-ink-primary">Your profile</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-secondary">
          Sign in and saved gear are coming soon. Browse rentals or take the gear quiz in the
          meantime.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-brand-secondary px-6 py-3 font-bold text-white transition hover:bg-brand-secondaryDark"
          >
            Browse rentals
          </Link>
          <Link
            href="/find"
            className="rounded-lg border border-surface-border px-6 py-3 font-semibold text-ink-primary transition hover:border-ink-primary"
          >
            Gear quiz
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}
