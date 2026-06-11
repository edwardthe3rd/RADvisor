import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function SiteShell({
  children,
  search,
}: {
  children: React.ReactNode;
  search?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader search={search} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
