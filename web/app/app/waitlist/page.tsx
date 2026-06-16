import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "RADvisor — Get notified",
  description:
    "RADvisor is the marketplace for outdoor gear, guided adventures, and community around Lake Tahoe and beyond.",
  robots: { index: false, follow: false },
};

export default function WaitlistPage() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <h1 className="sr-only">RADvisor</h1>
        <div className="header-inner">
          <Image
            className="logo"
            src="/images/waitlist-header-logo.png"
            width={6473}
            height={3697}
            alt=""
            role="presentation"
            priority
          />
        </div>
      </header>

      <main id="main">
        <section className="section notify" aria-labelledby="notify-heading">
          <div className="notify-card">
            <Link href="/" className="browse-link">
              Browse rentals
            </Link>
            <h2 id="notify-heading">Get notified when we launch</h2>
            <p className="notify-lede">
              Leave your email and we will let you know when RADvisor is live. No spam — just
              launch news.
            </p>
            <WaitlistForm />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p className="footer-copy">&copy; RADvisor LLC</p>
      </footer>
    </>
  );
}
