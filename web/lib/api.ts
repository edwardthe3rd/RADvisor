import { serverApiBase } from "./env";
import type {
  Business,
  Category,
  Equipment,
  Paginated,
  RecommendResponse,
} from "./types";

// Revalidate public directory data periodically (ISR). The data changes only
// when the business sync runs, so an hour is plenty and keeps API load low.
const PUBLIC_REVALIDATE_SECONDS = 3600;

type QueryValue = string | number | boolean | undefined;

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const base = serverApiBase();
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

interface GetOptions {
  params?: Record<string, QueryValue>;
  /** Override ISR revalidate seconds; pass 0 for no-store (dynamic). */
  revalidate?: number;
}

async function apiGet<T>(path: string, options: GetOptions = {}): Promise<T> {
  const { params, revalidate = PUBLIC_REVALIDATE_SECONDS } = options;
  const url = buildUrl(path, params);
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    ...(revalidate === 0
      ? { cache: "no-store" }
      : { next: { revalidate } }),
  });
  if (!res.ok) {
    throw new ApiError(`GET ${path} failed: ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function unwrap<T>(data: Paginated<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

/** All categories (the endpoint is unpaginated). */
export async function getCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/categories/");
}

/**
 * Fetch businesses, following DRF pagination so callers get the full set.
 * `max_page_size` is 200 server-side, so we page through if needed.
 */
export async function getBusinesses(
  params: { search?: string; category?: string; category_group?: string } = {},
): Promise<Business[]> {
  const all: Business[] = [];
  let page = 1;
  // Hard cap on pages to avoid runaway loops.
  for (let i = 0; i < 20; i++) {
    const data = await apiGet<Paginated<Business>>("/businesses/", {
      params: { page_size: 200, page, ...params },
    });
    all.push(...unwrap(data));
    if (!data.next) break;
    page += 1;
  }
  return all;
}

export async function getBusiness(slug: string): Promise<Business> {
  return apiGet<Business>(`/businesses/${encodeURIComponent(slug)}/`);
}

export async function getEquipment(
  params: { category?: string; business?: number } = {},
): Promise<Equipment[]> {
  const data = await apiGet<Paginated<Equipment>>("/equipment/", {
    params: { page_size: 200, ...params },
  });
  return unwrap(data);
}

export async function recommend(body: {
  activity?: string;
  max_price?: number;
  max_price_level?: number;
}): Promise<RecommendResponse> {
  const res = await fetch(buildUrl("/recommend/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new ApiError(`POST /recommend/ failed: ${res.status}`, res.status);
  }
  return res.json() as Promise<RecommendResponse>;
}
