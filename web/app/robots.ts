import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Search result pages are noindex; keep crawlers off the query endpoint.
      disallow: ["/search"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
