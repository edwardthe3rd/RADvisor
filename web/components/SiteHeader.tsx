import Link from "next/link";
import SearchBar from "./SearchBar";

export default function SiteHeader({ search }: { search?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-surface-borderLight bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-brand-primary">
          RADvisor
        </Link>
        <div className="flex-1">
          <SearchBar initialValue={search} />
        </div>
        <nav className="flex items-center gap-4 text-sm font-semibold text-ink-primary">
          <Link href="/" className="hover:text-brand-primaryDark">
            Browse
          </Link>
          <Link href="/find" className="hover:text-brand-primaryDark">
            Gear quiz
          </Link>
        </nav>
      </div>
    </header>
  );
}
