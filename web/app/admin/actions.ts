"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  assertAdmin,
  checkSecretAndIssueCookie,
  clearAdminCookie,
} from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/config/categories";

export async function loginAction(formData: FormData) {
  const secret = String(formData.get("secret") ?? "");
  if (!checkSecretAndIssueCookie(secret)) {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export async function logoutAction() {
  clearAdminCookie();
  redirect("/admin/login");
}

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function operatorFromForm(formData: FormData) {
  const categories = CATEGORIES.map((c) => c.slug).filter(
    (slug) => formData.get(`category_${slug}`) === "on",
  );
  const subcategories = CATEGORIES.flatMap((c) =>
    c.subcategories.map((s) => s.slug),
  ).filter((slug) => formData.get(`subcategory_${slug}`) === "on");
  return {
    name: str(formData, "name") ?? "",
    slug: str(formData, "slug") ?? "",
    description: str(formData, "description"),
    address: str(formData, "address"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    zip: str(formData, "zip"),
    lat: num(formData, "lat"),
    lng: num(formData, "lng"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    website: str(formData, "website"),
    booking_url: str(formData, "booking_url"),
    categories,
    logo_url: str(formData, "logo_url"),
    inventory_sync_type: (str(formData, "inventory_sync_type") ?? "manual") as
      | "manual"
      | "api"
      | "scrape"
      | "none",
    notes_internal: str(formData, "notes_internal"),
    subcategories,
    offers_delivery: formData.get("offers_delivery") === "on",
    offers_rental: formData.get("offers_rental") === "on",
    offers_demo: formData.get("offers_demo") === "on",
    offers_season_lease: formData.get("offers_season_lease") === "on",
    is_active: formData.get("is_active") === "on",
  };
}

export async function saveOperatorAction(formData: FormData) {
  assertAdmin();
  const id = str(formData, "id");
  const row = operatorFromForm(formData);
  if (!row.name || !row.slug) throw new Error("name and slug are required");
  const db = supabaseAdmin();
  if (id) {
    const { error } = await db.from("operators").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/", "layout");
    redirect(`/admin/operators/${id}?saved=1`);
  } else {
    const { data, error } = await db
      .from("operators")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/", "layout");
    redirect(`/admin/operators/${data.id}?saved=1`);
  }
}

/** One-click verify (06A): stamp last_verified = today. */
export async function verifyOperatorAction(formData: FormData) {
  assertAdmin();
  const id = String(formData.get("id"));
  const includeEquipment = formData.get("include_equipment") === "on";
  const today = new Date().toISOString().slice(0, 10);
  const db = supabaseAdmin();
  const { error } = await db
    .from("operators")
    .update({ last_verified: today })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (includeEquipment) {
    await db.from("equipment").update({ last_verified: today }).eq("operator_id", id);
  }
  revalidatePath(`/admin/operators/${id}`);
  revalidatePath("/", "layout");
}

function equipmentFromForm(formData: FormData) {
  return {
    operator_id: String(formData.get("operator_id")),
    category: str(formData, "category") ?? "",
    subcategory: str(formData, "subcategory"),
    name: str(formData, "name"),
    brand: str(formData, "brand"),
    model: str(formData, "model"),
    size: str(formData, "size"),
    description: str(formData, "description"),
    skill_level: (str(formData, "skill_level") ?? "all") as
      | "beginner"
      | "intermediate"
      | "advanced"
      | "all",
    price_hourly: num(formData, "price_hourly"),
    price_half_day: num(formData, "price_half_day"),
    price_full_day: num(formData, "price_full_day"),
    price_multi_day: num(formData, "price_multi_day"),
    price_weekly: num(formData, "price_weekly"),
    deposit: num(formData, "deposit"),
    quantity_total: num(formData, "quantity_total"),
    image_url: str(formData, "image_url"),
    is_popular: formData.get("is_popular") === "on",
    is_active: formData.get("is_active") === "on",
    last_verified: new Date().toISOString().slice(0, 10),
  };
}

export async function saveEquipmentAction(formData: FormData) {
  assertAdmin();
  const id = str(formData, "id");
  const row = equipmentFromForm(formData);
  if (!row.category) throw new Error("category is required");
  const db = supabaseAdmin();
  const { error } = id
    ? await db.from("equipment").update(row).eq("id", id)
    : await db.from("equipment").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/operators/${row.operator_id}`);
  revalidatePath("/", "layout");
}

export async function deleteEquipmentAction(formData: FormData) {
  assertAdmin();
  const id = String(formData.get("id"));
  const operatorId = String(formData.get("operator_id"));
  // Soft delete (01 §1): never hard-delete gear.
  const db = supabaseAdmin();
  const { error } = await db
    .from("equipment")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/operators/${operatorId}`);
  revalidatePath("/", "layout");
}
