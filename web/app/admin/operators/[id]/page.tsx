import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/config/categories";
import type { Equipment, Operator } from "@/lib/supabase/types";
import {
  deleteEquipmentAction,
  saveEquipmentAction,
  saveOperatorAction,
  verifyOperatorAction,
} from "../../actions";

export const metadata = {
  title: "Admin — edit operator",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const input =
  "w-full rounded-sm border border-surface-border px-2 py-1.5 text-sm";
const label = "flex flex-col gap-1 text-xs font-semibold text-ink-secondary";

function Field({
  name,
  title,
  defaultValue,
  type = "text",
}: {
  name: string;
  title: string;
  defaultValue?: string | number | null;
  type?: string;
}) {
  return (
    <label className={label}>
      {title}
      <input
        type={type}
        name={name}
        step={type === "number" ? "any" : undefined}
        defaultValue={defaultValue ?? ""}
        className={input}
      />
    </label>
  );
}

function EquipmentForm({
  operatorId,
  item,
}: {
  operatorId: string;
  item?: Equipment;
}) {
  return (
    <form
      action={saveEquipmentAction}
      className="grid grid-cols-2 gap-2 rounded-lg border border-surface-borderLight bg-white p-3 sm:grid-cols-4"
    >
      <input type="hidden" name="operator_id" value={operatorId} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <label className={label}>
        Category
        <select name="category" defaultValue={item?.category ?? ""} className={input} required>
          <option value="" disabled>
            Select…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Subcategory
        <select name="subcategory" defaultValue={item?.subcategory ?? ""} className={input}>
          <option value="">—</option>
          {CATEGORIES.flatMap((c) =>
            c.subcategories.map((s) => (
              <option key={`${c.slug}/${s.slug}`} value={s.slug}>
                {c.label} / {s.label}
              </option>
            )),
          )}
        </select>
      </label>
      <Field name="name" title="Name" defaultValue={item?.name} />
      <Field name="brand" title="Brand" defaultValue={item?.brand} />
      <Field name="model" title="Model" defaultValue={item?.model} />
      <Field name="size" title="Size" defaultValue={item?.size} />
      <label className={label}>
        Skill
        <select name="skill_level" defaultValue={item?.skill_level ?? "all"} className={input}>
          {["all", "beginner", "intermediate", "advanced"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <Field name="image_url" title="Image URL" defaultValue={item?.image_url} />
      <Field name="price_hourly" title="$ hourly" type="number" defaultValue={item?.price_hourly} />
      <Field name="price_half_day" title="$ half day" type="number" defaultValue={item?.price_half_day} />
      <Field name="price_full_day" title="$ full day" type="number" defaultValue={item?.price_full_day} />
      <Field name="price_multi_day" title="$ multi-day" type="number" defaultValue={item?.price_multi_day} />
      <Field name="price_weekly" title="$ weekly" type="number" defaultValue={item?.price_weekly} />
      <Field name="deposit" title="$ deposit" type="number" defaultValue={item?.deposit} />
      <Field name="quantity_total" title="Qty total" type="number" defaultValue={item?.quantity_total} />
      <div className="flex items-end gap-3">
        <label className="flex items-center gap-1 text-xs font-semibold text-ink-secondary">
          <input type="checkbox" name="is_popular" defaultChecked={item?.is_popular ?? false} />
          Popular
        </label>
        <label className="flex items-center gap-1 text-xs font-semibold text-ink-secondary">
          <input type="checkbox" name="is_active" defaultChecked={item?.is_active ?? true} />
          Active
        </label>
      </div>
      <div className="col-span-2 flex items-center gap-3 sm:col-span-4">
        <button className="rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-primaryDark">
          {item ? "Save item" : "Add item"}
        </button>
        {item && <span className="text-xs text-ink-tertiary">Saving re-stamps last_verified to today.</span>}
      </div>
    </form>
  );
}

export default async function AdminOperatorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string };
}) {
  requireAdmin();
  const isNew = params.id === "new";
  const db = supabaseAdmin();

  let operator: Operator | null = null;
  let equipment: Equipment[] = [];
  if (!isNew) {
    const { data } = await db
      .from("operators")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (!data) notFound();
    operator = data;
    const { data: eq } = await db
      .from("equipment")
      .select("*")
      .eq("operator_id", params.id)
      .eq("is_active", true)
      .order("category");
    equipment = eq ?? [];
  }

  return (
    <main className="mx-auto max-w-content px-4 py-8">
      <nav className="mb-4 text-sm">
        <Link href="/admin" className="text-ink-link hover:underline">
          ← All operators
        </Link>
      </nav>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-extrabold text-ink-primary">
          {isNew ? "New operator" : operator!.name}
        </h1>
        {searchParams.saved && (
          <span className="rounded-full bg-brand-accentLight px-3 py-1 text-xs font-bold text-brand-accent">
            Saved
          </span>
        )}
        {!isNew && (
          <form action={verifyOperatorAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={operator!.id} />
            <label className="flex items-center gap-1 text-xs text-ink-secondary">
              <input type="checkbox" name="include_equipment" defaultChecked />
              include gear
            </label>
            <button className="rounded-lg border border-brand-accent px-3 py-1.5 text-sm font-bold text-brand-accent hover:bg-brand-accentLight">
              ✓ Verified today
            </button>
            <span className="text-xs text-ink-tertiary">
              last: {operator!.last_verified ?? "never"}
            </span>
          </form>
        )}
      </div>

      <form
        action={saveOperatorAction}
        className="mb-10 grid grid-cols-2 gap-3 rounded-lg border border-surface-borderLight bg-white p-4 sm:grid-cols-4"
      >
        {!isNew && <input type="hidden" name="id" value={operator!.id} />}
        <Field name="name" title="Name *" defaultValue={operator?.name} />
        <Field name="slug" title="Slug *" defaultValue={operator?.slug} />
        <Field name="phone" title="Phone" defaultValue={operator?.phone} />
        <Field name="email" title="Email" defaultValue={operator?.email} />
        <Field name="website" title="Website" defaultValue={operator?.website} />
        <Field name="booking_url" title="Booking URL" defaultValue={operator?.booking_url} />
        <Field name="address" title="Address" defaultValue={operator?.address} />
        <Field name="city" title="City" defaultValue={operator?.city} />
        <Field name="state" title="State" defaultValue={operator?.state ?? "NV"} />
        <Field name="zip" title="ZIP" defaultValue={operator?.zip} />
        <Field name="lat" title="Latitude" type="number" defaultValue={operator?.lat} />
        <Field name="lng" title="Longitude" type="number" defaultValue={operator?.lng} />
        <Field name="logo_url" title="Logo URL" defaultValue={operator?.logo_url} />
        <label className={label}>
          Inventory sync
          <select
            name="inventory_sync_type"
            defaultValue={operator?.inventory_sync_type ?? "manual"}
            className={input}
          >
            {["manual", "api", "scrape", "none"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
          <input type="checkbox" name="is_active" defaultChecked={operator?.is_active ?? true} />
          Active (visible to the public)
        </label>
        <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
          <input
            type="checkbox"
            name="offers_delivery"
            defaultChecked={operator?.offers_delivery ?? false}
          />
          Offers delivery service
        </label>
        <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
          <input
            type="checkbox"
            name="offers_rental"
            defaultChecked={operator?.offers_rental ?? true}
          />
          Offers rentals
        </label>
        <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
          <input
            type="checkbox"
            name="offers_demo"
            defaultChecked={operator?.offers_demo ?? false}
          />
          Offers demos / tryouts
        </label>
        <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-ink-secondary">
          <input
            type="checkbox"
            name="offers_season_lease"
            defaultChecked={operator?.offers_season_lease ?? false}
          />
          Offers season gear leases
        </label>
        <label className={`${label} col-span-2 sm:col-span-4`}>
          Description
          <textarea
            name="description"
            rows={2}
            defaultValue={operator?.description ?? ""}
            className={input}
          />
        </label>
        <fieldset className="col-span-2 sm:col-span-4">
          <legend className="mb-1 text-xs font-semibold text-ink-secondary">Categories</legend>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <label key={c.slug} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  name={`category_${c.slug}`}
                  defaultChecked={(operator?.categories ?? []).includes(c.slug)}
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="col-span-2 sm:col-span-4">
          <legend className="mb-1 text-xs font-semibold text-ink-secondary">
            Subcategories (specific equipment types offered)
          </legend>
          <div className="flex flex-col gap-2">
            {CATEGORIES.map((c) => (
              <div key={c.slug}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
                  {c.label}
                </p>
                <div className="flex flex-wrap gap-3">
                  {c.subcategories
                    .filter(
                      (s) =>
                        !s.slug.endsWith("_demo") && !s.slug.endsWith("_lease"),
                    )
                    .map((s) => (
                      <label
                        key={s.slug}
                        className="flex items-center gap-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          name={`subcategory_${s.slug}`}
                          defaultChecked={(
                            operator?.subcategories ?? []
                          ).includes(s.slug)}
                        />
                        {s.label}
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
        <label className={`${label} col-span-2 sm:col-span-4`}>
          Internal notes (never shown publicly)
          <textarea
            name="notes_internal"
            rows={2}
            defaultValue={operator?.notes_internal ?? ""}
            className={input}
          />
        </label>
        <div className="col-span-2 sm:col-span-4">
          <button className="rounded-lg bg-brand-primary px-5 py-2 font-bold text-white hover:bg-brand-primaryDark">
            {isNew ? "Create operator" : "Save operator"}
          </button>
        </div>
      </form>

      {!isNew && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-ink-primary">
            Equipment ({equipment.length})
          </h2>
          <div className="flex flex-col gap-4">
            {equipment.map((item) => (
              <div key={item.id} className="relative">
                <EquipmentForm operatorId={operator!.id} item={item} />
                <form action={deleteEquipmentAction} className="absolute right-3 top-3">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="operator_id" value={operator!.id} />
                  <button className="text-xs font-semibold text-feedback-danger hover:underline">
                    Deactivate
                  </button>
                </form>
              </div>
            ))}
            <h3 className="mt-2 text-sm font-bold text-ink-secondary">Add equipment</h3>
            <EquipmentForm operatorId={operator!.id} />
          </div>
        </section>
      )}
    </main>
  );
}
