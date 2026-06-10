import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/config/categories";
import { getAllOperatorSlugs } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Regenerate the sitemap on the same cadence as the directory data.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/find`, changeFrequency: "monthly", priority: 0.7 },
    ...CATEGORIES.map((c) => ({
      url: `${siteUrl}/discover/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const operators = await getAllOperatorSlugs();
  const operatorEntries: MetadataRoute.Sitemap = operators.map((o) => ({
    url: `${siteUrl}/operators/${o.slug}`,
    lastModified: o.updated_at ? new Date(o.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...operatorEntries];
}
