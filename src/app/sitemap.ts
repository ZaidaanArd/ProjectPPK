import type { MetadataRoute } from "next"
import { publicDocs } from "@/lib/public-docs"
import { siteUrl } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-29T00:00:00+07:00")

  return siteUrl
    ? [
        {
          url: siteUrl,
          lastModified,
          changeFrequency: "weekly",
          priority: 1,
        },
        {
          url: `${siteUrl}/facilities`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.8,
        },
        {
          url: `${siteUrl}/tentang`,
          lastModified,
          changeFrequency: "monthly",
          priority: 0.7,
        },
        {
          url: siteUrl + "/docs",
          lastModified,
          changeFrequency: "monthly",
          priority: 0.6,
        },
        ...publicDocs.map((doc) => ({
          url: siteUrl + "/docs/" + doc.slug,
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.4,
        })),
      ]
    : []
}
