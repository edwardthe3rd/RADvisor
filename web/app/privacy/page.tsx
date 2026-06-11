import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Privacy policy",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-content px-4 py-10">
        <h1 className="text-3xl font-extrabold text-ink-primary">Privacy policy</h1>
        <p className="mt-2 text-sm text-ink-tertiary">Last updated June 2026</p>
        <div className="prose prose-sm mt-8 max-w-2xl text-ink-secondary [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink-primary [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          <p>
            RADvisor LLC respects your privacy. This policy describes what we
            collect when you use theradvisor.com and how we use it.
          </p>
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Usage data</strong> — pages viewed, searches, and filters
              (standard web analytics).
            </li>
            <li>
              <strong>Waitlist submissions</strong> — email and message content when
              you join the operator waitlist.
            </li>
            <li>
              <strong>Technical data</strong> — browser type, device, and IP address
              for security and performance.
            </li>
          </ul>
          <h2>What we do not sell</h2>
          <p>
            We do not sell your personal information. Operator listings are public
            business information sourced from operators and public directories.
          </p>
          <h2>Third parties</h2>
          <p>
            We use Supabase for data hosting and standard infrastructure providers
            for hosting and email. Their policies govern data they process on our
            behalf.
          </p>
          <h2>Your choices</h2>
          <p>
            You may request access or deletion of waitlist data by contacting
            RADvisor. Account features may expand in a future release.
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
