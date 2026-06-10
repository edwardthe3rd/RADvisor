import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logoutAction } from "./actions";
import { isStale } from "@/lib/format";

export const metadata = {
  title: "Admin — operators",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  requireAdmin();
  const db = supabaseAdmin();

  let query = db
    .from("operators")
    .select("id, name, slug, city, phone, website, categories, is_active, last_verified")
    .order("name");
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  const { data: operators } = await query;
  const { count: equipmentCount } = await db
    .from("equipment")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  const { data: equipmentMeta } = await db
    .from("equipment")
    .select("brand, model, price_full_day, price_half_day, price_multi_day, price_weekly, price_hourly, last_verified")
    .eq("is_active", true);

  const rows = operators ?? [];
  const total = rows.length;

  // Completeness dashboard (06A): where to focus outreach.
  const withContact = rows.filter((o) => o.phone || o.website).length;
  const stale = rows.filter((o) => isStale(o.last_verified)).length;
  const skus = equipmentMeta ?? [];
  const skusWithPrice = skus.filter(
    (e) =>
      e.price_full_day ?? e.price_half_day ?? e.price_multi_day ?? e.price_weekly ?? e.price_hourly,
  ).length;
  const skusWithBrand = skus.filter((e) => e.brand && e.model).length;
  const pct = (n: number, d: number) => (d === 0 ? "—" : `${Math.round((n / d) * 100)}%`);

  return (
    <main className="mx-auto max-w-content px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-primary">Operators</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/operators/new"
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primaryDark"
          >
            Add operator
          </Link>
          <form action={logoutAction}>
            <button className="text-sm font-semibold text-ink-link hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Operators", value: String(total) },
          { label: "With contact info", value: pct(withContact, total) },
          { label: "Stale >90d", value: String(stale) },
          { label: "Active SKUs", value: String(equipmentCount ?? 0) },
          { label: "SKUs priced / branded", value: `${pct(skusWithPrice, skus.length)} / ${pct(skusWithBrand, skus.length)}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-surface-borderLight bg-white p-3">
            <p className="text-xs text-ink-tertiary">{stat.label}</p>
            <p className="text-xl font-bold text-ink-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <form className="mb-4" method="get">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search operators…"
          className="w-full max-w-sm rounded-lg border border-surface-border px-3 py-2 text-sm"
        />
      </form>

      <div className="overflow-x-auto rounded-lg border border-surface-borderLight bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-borderLight text-xs uppercase text-ink-tertiary">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Categories</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-borderLight">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-surface-muted">
                <td className="px-3 py-2 font-semibold">
                  <Link href={`/admin/operators/${o.id}`} className="text-ink-link hover:underline">
                    {o.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{o.city ?? "—"}</td>
                <td className="px-3 py-2">
                  {o.phone || o.website ? "✓" : (
                    <span className="font-bold text-feedback-warning">missing</span>
                  )}
                </td>
                <td className="px-3 py-2">{(o.categories ?? []).length}</td>
                <td className="px-3 py-2">
                  {o.last_verified ?? "never"}
                  {isStale(o.last_verified) && (
                    <span className="ml-1 text-feedback-warning">⚠</span>
                  )}
                </td>
                <td className="px-3 py-2">{o.is_active ? "✓" : "✗"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
