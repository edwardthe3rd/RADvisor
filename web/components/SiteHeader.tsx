import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";

export default function SiteHeader({ search }: { search?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-borderLight bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center justify-between sm:contents">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/images/radvisor-logo.png"
              alt="RADvisor"
              width={1024}
              height={528}
              className="h-8 w-auto sm:h-9"
              priority
            />
          </Link>
          <Link
            href="/account"
            aria-label="Profile"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-surface-border text-ink-secondary transition hover:border-ink-primary hover:text-ink-primary sm:order-3 sm:self-center"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
        <div className="flex-1 sm:order-2">
          <SearchBar initialValue={search} />
        </div>
      </div>
    </header>
  );
}
