import Image from "next/image";
import Link from "next/link";
import FooterLanguageSelect from "./FooterLanguageSelect";

const LINKS = [
  { href: "/", label: "Browse" },
  { href: "/find", label: "Quiz" },
  { href: "/search", label: "Search" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/app/waitlist", label: "Operators" },
] as const;

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-surface-borderLight bg-white">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-4 text-xs text-ink-tertiary sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2">
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/" className="shrink-0">
            <Image
              src="/images/radvisor-logo.png"
              alt="RADvisor"
              width={1024}
              height={528}
              className="h-5 w-auto"
            />
          </Link>
          <p className="font-medium text-ink-secondary">
            &copy; {year} RADvisor LLC
          </p>
        </div>
        <nav
          className="flex flex-wrap items-center gap-x-3 gap-y-1"
          aria-label="Footer"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-secondary transition hover:text-brand-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <FooterLanguageSelect />
      </div>
    </footer>
  );
}
