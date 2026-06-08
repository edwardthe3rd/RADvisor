import type { MetadataRoute } from "next";
import { getBusinesses } from "@/lib/api";
import { GROUP_ORDER, groupToSlug } from "@/lib/format";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Regenerate the sitemap on the same cadence as the directory data.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    ...GROUP_ORDER.map((g) => ({
      url: `${siteUrl}/category/${groupToSlug(g)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  let businessEntries: MetadataRoute.Sitemap = [];
  try {
    const businesses = await getBusinesses();
    businessEntries = businesses.map((b) => ({
      url: `${siteUrl}/business/${b.slug}`,
      lastModified: b.last_synced_at ? new Date(b.last_synced_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // If the API is down at generation time, still return the static entries.
  }

  return [...staticEntries, ...businessEntries];
}
