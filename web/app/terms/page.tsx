import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Terms of service",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-content px-4 py-10">
        <h1 className="text-3xl font-extrabold text-ink-primary">Terms of service</h1>
        <p className="mt-2 text-sm text-ink-tertiary">Last updated June 2026</p>
        <div className="prose prose-sm mt-8 max-w-2xl text-ink-secondary [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink-primary [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <p>
            RADvisor LLC (&quot;RADvisor&quot;) operates a discovery platform that
            connects outdoor enthusiasts with independent gear-rental and demo
            operators in the Reno–Tahoe region. By using theradvisor.com you agree
            to these terms.
          </p>
          <h2>Directory, not a rental contract</h2>
          <p>
            Listings, prices, and availability are informational. RADvisor does not
            process rentals, hold deposits, or guarantee inventory. Your agreement
            is with the operator you contact or book with directly.
          </p>
          <h2>Accuracy and freshness</h2>
          <p>
            We work to keep operator information current but do not warrant
            real-time accuracy. Confirm details with the operator before you
            travel.
          </p>
          <h2>Acceptable use</h2>
          <ul>
            <li>Do not scrape, bulk-harvest, or misrepresent listing data.</li>
            <li>Do not use the site for unlawful purposes or to harass operators.</li>
          </ul>
          <h2>Contact</h2>
          <p>
            Questions about these terms: reach out via the operator waitlist form
            or your usual RADvisor contact channel.
          </p>
        </div>
        <Link
          href="/"
          className="mt-10 inline-block text-sm font-semibold text-ink-link hover:underline"
        >
          ← Back to discovery
        </Link>
      </main>
    </SiteShell>
  );
}
