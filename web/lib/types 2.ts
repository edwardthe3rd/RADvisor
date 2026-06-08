// Types mirrored from the Django catalog serializers
// (backend/apps/catalog/serializers.py).

export interface Category {
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
  categories: Category[];
  category_groups: string[];
  is_active: boolean;
  last_synced_at: string | null;
}

export interface BusinessSummary {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string;
  website: string;
  google_rating: string | null;
}

export interface Equipment {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: string | null;
  price_unit: string;
  sizes: string[];
  image_url: string;
  is_available: boolean;
  business: BusinessSummary;
  category: Category;
}

export interface RecommendResponse {
  count: number;
  equipment: Equipment[];
  businesses: Business[];
}

export interface ReservationRequest {
  id: number;
  business: number;
  business_name: string;
  business_slug: string;
  equipment: number | null;
  equipment_name: string;
  start_date: string;
  end_date: string;
  party_size: number;
  message: string;
  contact_email: string;
  contact_phone: string;
  status: "pending" | "contacted" | "confirmed" | "closed" | "canceled";
  created_at: string;
  updated_at: string;
}

/** DRF StandardPagination envelope (backend/radvisor/pagination.py). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
