import api from "./client";

export interface BusinessCategory {
  id: number;
  name: string;
  slug: string;
  group: string;
  icon: string;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  website: string;
  google_rating: string | null;
  google_rating_count: number;
  price_level: number | null;
  hours: { weekday?: string[] } | Record<string, unknown>;
  photo_url: string;
  categories: BusinessCategory[];
  category_groups: string[];
  is_active: boolean;
  last_synced_at: string | null;
}

/** Fetch the rental-business directory, optionally filtered by search/category. */
export async function fetchBusinesses(params: {
  search?: string;
  category?: string;
  category_group?: string;
} = {}): Promise<Business[]> {
  const res = await api.get("/businesses/", {
    params: { page_size: 300, ...params },
  });
  return res.data.results ?? res.data;
}

export async function fetchBusiness(slug: string): Promise<Business> {
  const res = await api.get(`/businesses/${slug}/`);
  return res.data;
}
