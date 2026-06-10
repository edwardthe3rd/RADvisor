import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep crawlers off the query endpoint and internal tooling.
      disallow: ["/search", "/admin", "/app"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
